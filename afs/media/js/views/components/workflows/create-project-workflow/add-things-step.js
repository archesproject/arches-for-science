define([
    'jquery',
    'underscore',
    'knockout',
    'knockout-mapping',
    'uuid',
    'arches',
    'templates/views/components/workflows/create-project-workflow/add-things-step.htm',
    'bindings/select2-query',
    'views/components/search/paging-filter',
], function($, _, ko, koMapping, uuid, arches, addThingsStepTemplate) {
    var collectionNameNodegroupId = '52aa1673-c450-11e9-8640-a4d18cec433a'; // Name (E33) in Collection resource
    var activityUsedSetNodeId = 'cc5d6df3-d477-11e9-9f59-a4d18cec433a'; //Used Set in Project
    var activityNameNodeId = "0b92cf5c-ca85-11e9-95b1-a4d18cec433a"; // Name_content in Project resource

    var getQueryObject = function() {
        var query = _.chain(decodeURIComponent(location.search).slice(1).split('&'))
            // Split each array item into [key, value]
            // ignore empty string if search is empty
            .map(function(item) {
                if (item) return item.split('=');
            })
            // Remove undefined in the case the search is empty
            .compact()
            // Turn [key, value] arrays into object parameters
            .object()
            // Return the value of the chain operation
            .value();
        return query;
    };
    
    function viewModel(params) {
        var self = this;

        _.extend(this, params.form);

        var limit = 7;
        this.projectResourceId = ko.observable();
        this.collectionResourceId = ko.observable();
        this.collectionTileId = ko.observable();
        this.usedSetTileId = ko.observable();
        this.reportDataLoading = ko.observable(params.loading());
        let projectName;

        if (params.projectStepData){
            const projectStepData = params.projectStepData;
            projectName = projectStepData.name.value;
            this.projectResourceId(projectStepData.projectResourceId);    
        } else if (params.resourceid){
            this.projectResourceId(params.resourceid);
        }

        this.selectedTab = ko.observable();
        this.searchResults = {'timestamp': ko.observable()};
        this.targetResource = ko.observable();
        this.toggleRelationshipCandidacy = ko.observable();
        this.isResourceRelatable = ko.observable();
        this.filters = {
            'paging-filter': ko.observable(),
            'search-results': ko.observable(),
        };
        this.termFilter = ko.observable();
        this.totalResults = ko.observable();
        this.query = ko.observable(getQueryObject());
        this.selectedTerm = ko.observable();
        this.targetResources = ko.observableArray([]);
        this.targetResourceSearchValue = ko.observable();
        this.termOptions = [];
        this.value = ko.observableArray([]).extend({
            rateLimit: 100
        });
        this.startValue = ko.observableArray();
        this.selectedResources = ko.observableArray([]);
        this.addedValues = ko.observableArray();
        this.removedValues = ko.observableArray();

        this.dirty = ko.pureComputed(function() {
            if (self.startValue() && self.value()){
                return !!(self.startValue().find(x => !self.value().includes(x))
                    || self.value().find(x => !self.startValue().includes(x)));
            } else {
                return false;
            }
        });
        this.dirty.subscribe(function(dirty) {
            params.dirty(dirty);
        });

        this.value.subscribe(function(a) {
            a.forEach(function(action) {
                if (action.status === 'added') {
                    $.ajax({
                        url: arches.urls.api_resources(ko.unwrap(action.value)),
                        data: {
                            format: 'json',
                            includetiles: 'false'
                        }
                    }).done(function(data) {
                        self.selectedResources.push(data);
                    });
                } else if (action.status === 'deleted') {
                    self.selectedResources().forEach(function(val) {
                        if (val.resourceinstanceid === ko.unwrap(action.value)) {
                            self.selectedResources.remove(val);
                        }
                    });
                }
            });
        }, null, "arrayChange");

        const loadExistingCollection = async function(){
            const projectRelatedResources = await (await window.fetch(`${arches.urls.related_resources}${self.projectResourceId()}`)).json();
            const existingCollection = projectRelatedResources.related_resources.related_resources.find(x=>x.graph_id==="1b210ef3-b25c-11e9-a037-a4d18cec433a");
            if (existingCollection) {
                self.collectionResourceId(existingCollection.resourceinstanceid);

                const collectionRelatedResources = await (await window.fetch(`${arches.urls.related_resources}${self.collectionResourceId()}`)).json();
    
                self.startValue(
                    collectionRelatedResources.related_resources.related_resources
                        .filter(rr =>
                            rr.graph_id === "9519cb4f-b25b-11e9-8c7b-a4d18cec433a"
                        )
                        .map(rr => rr.resourceinstanceid)
                );
    
                self.startValue().forEach(function(val){
                    self.value.push(val);
                });    
            }
        };

        this.initialize = function(){
            if (params.value()) {
                const cachedValue = ko.unwrap(params.value);
                if (cachedValue['collectionResourceId']){
                    self.collectionResourceId(cachedValue['collectionResourceId']);
                }
                if (cachedValue['collectionTileId']){
                    self.collectionTileId(cachedValue['collectionTileId']);
                }
                if (cachedValue['usedSetTileId']){
                    self.usedSetTileId(cachedValue['usedSetTileId']);
                }
                if (cachedValue["value"]){
                    self.startValue(ko.unwrap(cachedValue["value"]));
                    self.startValue().forEach(function(val){
                        self.value.push(val);
                    });
                }
            } else if (params.action === "update") {
                loadExistingCollection();
            }
        };

        this.resetTile = function() {
            if (self.startValue()) {
                self.value.removeAll();
                self.startValue().forEach(function(val){
                    self.value.push(val);
                });
            }
        };
        params.form.reset = this.resetTile;

        this.updateTileData = function(resourceid) {
            var val = self.value().find(function(item) {
                return ko.unwrap(item) === resourceid;
            });

            if (!!val) {
                // remove item, we don't want users to add the same item twice
                self.value.remove(val);
            } else {
                self.value.push(resourceid);
            }
        };

        const createResourceListToUpdate = () => {
            let resourcesToUpdate = [];
            self.addedValues(self.value().filter(val => !self.startValue().includes(val)));
            self.removedValues(self.startValue().filter(val => !self.value().includes(val)));

            self.addedValues().map(function(value){
                resourcesToUpdate.push({
                    resourceid: value,
                    action: 'add',
                });
            });

            self.removedValues().map(function(value){
                resourcesToUpdate.push({
                    resourceid: value,
                    action: 'remove',
                });
            });

            return resourcesToUpdate;
        };

        this.submit = function() {
            self.complete(false);
            self.saving(true);

            const resourcesToUpdate = createResourceListToUpdate();
            $.ajax({
                url: arches.urls.root + 'updateresourcelist',
                type: 'POST',
                data: {
                    projectresourceid: ko.unwrap(self.projectResourceId),
                    collectionresourceid: ko.unwrap(self.collectionResourceId),
                    transactionid : params.form.workflowId,
                    data: JSON.stringify(resourcesToUpdate)
                }})
                .then((response) => {
                    self.collectionResourceId(response.result.collectionResourceid || ko.unwrap(self.collectionResourceId));
                    self.collectionTileId(response.result.collectionNameTileId || ko.unwrap(self.collectionTileId));
                    self.usedSetTileId(response.result.projectUsedSetTileId || ko.unwrap(self.usedSetTileId));
                    self.savedData(
                        {
                            value: ko.unwrap(self.value),
                            projectResourceId: ko.unwrap(self.projectResourceId),
                            collectionResourceId: ko.unwrap(self.collectionResourceId),
                            collectionTileId: ko.unwrap(self.collectionTileId), 
                            usedSetTileId: ko.unwrap(self.usedSetTileId),
                        }
                    );
                    if (params.action === "update") {
                        params.form.lockExternalStep("select-project", true);
                    }
                })
                .fail((err) => {
                    // eslint-disable-next-line no-console
                    console.log(err);
                    const startValue = ko.unwrap(self.startValue);
                    self.value(startValue);
                }).always(() => {
                    self.saving(false);
                    self.complete(true);
                });
        };

        params.form.save = self.submit;
        params.form.onSaveSuccess = function() {};

        this.targetResourceSelectConfig = {
            value: self.selectedTerm,
            minimumInputLength: 2,
            placeholder: 'find a physical thing: enter an artist, object name, artwork title or object number',
            clickBubble: true,
            multiple: false,
            closeOnSlect: false,
            allowClear: true,
            ajax: {
                url: arches.urls.search_terms,
                dataType: 'json',
                quietMillis: 250,
                data: function(term, page) {
                    var data = {
                        start: (page - 1) * limit,
                        // eslint-disable-next-line camelcase
                        page_limit: limit,
                        q: term
                    };
                    return data;
                },
                results: function(data, page) {
                    const value = window.document.getElementsByClassName('select2-input')[0].value;
                    const results = data.terms;
                    results.unshift({
                        type: 'string',
                        context: '',
                        context_label: 'Search Term',
                        id: value,
                        text: value,
                        value: value
                    });
                    self.termOptions = results;

                    const filteredResults = results.filter(function(result){
                        return result.context_label.includes("Physical Thing") ||
                        result.context_label.includes("Search Term");
                    });
                    return {
                        results: filteredResults,
                        more: data.count >= (page * limit)
                    };
                }
            },
            id: function(item) {
                return item.id;
            },
            formatResult: function(item) {
                if (item.context_label === 'Search Term') {
                    return `<strong><u>${item.text}</u></strong>`;
                }
                return item.text;
            },
            formatSelection: function(item) {
                return item.text;
            },
            clear: function() {
                self.selectedTerm();
            },
            isEmpty: ko.computed(function() {
                return self.selectedTerm() === '' || !self.selectedTerm();
            }, this),
            initSelection: function() {
                return;
            }
        };
        
        var getResultData = function(termFilter, pagingFilter) {
            var filters = {};
            // let's empty our termFilters
            _.each(self.filters, function(_value, key) {
                if (key !== 'paging-filter' && key !== 'search-results') {
                    delete self.filters[key];
                }
            });

            if (termFilter) {
                termFilter['inverted'] = false;
                filters["term-filter"] = JSON.stringify([termFilter]);
            } 

            if (pagingFilter) {
                filters['paging-filter'] = pagingFilter;
                self.filters['paging-filter'](pagingFilter);
            } else {
                filters['paging-filter'] = 1;
            }

            self.reportDataLoading(true);

            const setUpReports = function() {
                const filterParams = Object.entries(filters).map(([key, val]) => `${key}=${val}`).join('&');
                fetch(arches.urls.physical_thing_search_results + '?' + filterParams)
                    .then(response => response.json())
                    .then(data => {
                        _.each(self.searchResults, function(_value, key) {
                            if (key !== 'timestamp') {
                                delete self.searchResults[key];
                            }
                        });
                        _.each(data, function(value, key) {
                            if (key !== 'timestamp') {
                                self.searchResults[key] = value;
                            }
                        });
                        self.searchResults.timestamp(data.timestamp);
        
                        self.totalResults(data['total_results']);
                        var resources = data['results']['hits']['hits'].map(source => {
                            source._source.tiles.forEach((tile) => {
                                if (tile.data['22c15cfa-b498-11e9-b5e3-a4d18cec433a'] && 
                                    tile.data['22c15cfa-b498-11e9-b5e3-a4d18cec433a'].length &&
                                    tile.data['22c15cfa-b498-11e9-b5e3-a4d18cec433a'][0] === '26094e9c-2702-4963-adee-19ad118f0f5a') {
                                    source.identifier = tile.data['22c169b5-b498-11e9-bdad-a4d18cec433a'];
                                }
                            });
                            return source;
                        });
                        self.targetResources(resources);
                        self.reportDataLoading(false);
                    });
            };
            setUpReports();
        };

        this.updateSearchResults = function(termFilter, pagingFilter) {
            getResultData(termFilter, pagingFilter);
        };

        this.selectedTerm.subscribe(function(val) {
            self.termFilter(self.termOptions.find(x => val == x.id));
            self.updateSearchResults(self.termFilter());
        });

        this.query.subscribe(function(query) {
            self.updateSearchResults(self.termFilter(), query['paging-filter']);
        });

        this.initialize();

        this.stripTags = (original) => {
            return original?.replace(/(<([^>]+)>)/gi, "");
        };

        this.getStringValue = (value) => {
            return value.find(str => str.language == arches.activeLanguage)?.value;
        };
    }

    ko.components.register('add-things-step', {
        viewModel: viewModel,
        template: addThingsStepTemplate
    });

    return viewModel;
});
