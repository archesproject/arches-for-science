define([
    'jquery',
    'underscore',
    'knockout',
    'knockout-mapping',
    'arches',
    'models/graph',
    'models/report',
    'viewmodels/card',
    'viewmodels/provisional-tile',
    'report-templates',
    'card-components',
    'bindings/select2-query',
    'views/components/search/paging-filter',
], function($, _, ko, koMapping, arches, GraphModel, ReportModel, CardViewModel, ProvisionalTileViewModel, reportLookup) {

    var graphId = '9519cb4f-b25b-11e9-8c7b-a4d18cec433a'; // Physical Thing graph
    var collectionNameNodeId = '52aa2007-c450-11e9-b5d4-a4d18cec433a'; // Name_content in Collection resource
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

        var researchActivityStepData = params.researchActivityStepData;
        var researchActivityName = JSON.parse(researchActivityStepData["tileData"])[activityNameNodeId];
        this.projectResourceId(researchActivityStepData.resourceInstanceId);

        this.selectedTab = ko.observable();
        this.searchResults = {'timestamp': ko.observable()};
        this.targetResource = ko.observable();
        this.toggleRelationshipCandidacy = ko.observable();
        this.isResourceRelatable = ko.observable();
        this.reportLookup = reportLookup;
        this.filters = {
            'paging-filter': ko.observable(),
            'search-results': ko.observable(),
        };
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

        this.initialize = function(){
            if (params.value()) {
                var cachedValue = ko.unwrap(params.value);
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
            }
        }

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

        this.submit = function() {
            self.complete(false);
            self.saving(true);

            $.ajax({
                url: arches.urls.api_node_value,
                type: 'POST',
                dataType: 'json',
                data: {
                    'nodeid': collectionNameNodeId,
                    'data':  ("Collection for " + researchActivityName),
                    'tileid': ko.unwrap(self.collectionTileId),
                    'resourceinstanceid': ko.unwrap(self.collectionResourceId)
                }
            }).done(function(data) {
                self.collectionResourceId(data.resourceinstance_id);
                self.collectionTileId(data.tileid)

                self.removedValues(self.startValue().filter(val => !self.value().includes(val)));
                self.addedValues(self.value().filter(val => !self.startValue().includes(val)));

                Promise.all(saveCollectionRelationships()).then(
                    Promise.all(removeCollectionRelationships()).then(
                        createActivityUsedSet().then(function(){
                            console.log("finished", ko.unwrap(self.value))
                            self.savedData(
                                {
                                    value: ko.unwrap(self.value),
                                    projectResourceId: ko.unwrap(self.projectResourceId),
                                    collectionResourceId: ko.unwrap(self.collectionResourceId),
                                    collectionTileId: ko.unwrap(self.collectionTileId),                            
                                    usedSetTileId: ko.unwrap(self.usedSetTileId),
                                }
            
                            );
                            self.saving(false);
                            self.complete(true);
                        })
                    )
                )
            })
        };
        params.form.save = self.submit;
        params.form.onSaveSuccess = function() {};
        
        const createActivityUsedSet = () => {
            const activityUsedSetToCreate = 
                $.ajax({
                    url: arches.urls.api_node_value,
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        'nodeid': activityUsedSetNodeId, // used_set (of Activity)
                        'data': JSON.stringify(
                            [{
                                'resourceId': ko.unwrap(self.collectionResourceId),
                                'ontologyProperty': '',
                                'inverseOntologyProperty':'',
                                'resourceXresourceId':''
                            }]
                        ), 
                        'tileid': ko.unwrap(self.usedSetTileId),
                        'resourceinstanceid': ko.unwrap(self.projectResourceId)
                    }
                }).done(function(data){
                    self.usedSetTileId(data.tileid);
                    console.log("usedSet is created")
                });
            return activityUsedSetToCreate;
        }

        const saveCollectionRelationships = () => {
            console.log("adding is running")
            const memberOfSetNodeid = '63e49254-c444-11e9-afbe-a4d18cec433a';
            const rrTemplate = [{ 
                "resourceId": ko.unwrap(self.collectionResourceId),
                "ontologyProperty": "",
                "resourceXresourceId": "",
                "inverseOntologyProperty": ""
            }];
            const relationshipsToCreate = self.addedValues().map(function(resourceid) {
                return $.ajax({
                    url: arches.urls.api_node_value,
                    type: 'POST',
                    data: {
                        'nodeid': memberOfSetNodeid,
                        'data': koMapping.toJSON(rrTemplate),
                        'resourceinstanceid': resourceid,
                        'tileid': ''
                    }
                }).done(function() {
                    // eslint-disable-next-line no-console
                    console.log(resourceid, "related resource is created");
                }).fail(function(){
                    self.value.remove(resourceid);
                    // eslint-disable-next-line no-console
                    console.log(resourceid, "related resource failed to create");
                });
            });
            return relationshipsToCreate;
        };

        const removeCollectionRelationships = () => {
            console.log("removing is running")
            const memberOfSetNodeid = '63e49254-c444-11e9-afbe-a4d18cec433a';
            const relationshipsToRemove = self.removedValues().map(function(resourceid) {
                return $.ajax({
                    url: arches.urls.related_resources + resourceid + "?paginate=false",
                }).done(function(data) {
                    console.log("2nd ajax is starting")
                    const tileid = data.resource_relationships.find(x => 
                        x.nodeid === memberOfSetNodeid && x.resourceinstanceidto === self.collectionResourceId()
                    ).tileid;

                    return $.ajax({
                        url: arches.urls.tile,
                        type: 'DELETE',
                        data: {'tileid': tileid},
                    }).done(function() {
                        // eslint-disable-next-line no-console
                        console.log(resourceid, "related resource is removed");
                    }).fail(function(){
                        self.value.push(resourceid);
                        // eslint-disable-next-line no-console
                        console.log(resourceid, "related resource failed to remove");
                    });
                })
            });
            return relationshipsToRemove;
        };

        this.targetResourceSelectConfig = {
            value: self.selectedTerm,
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
                    var results = data.terms;
                    var filteredResults = results.filter(function(result){ return result.context_label.includes("Physical Thing"); });
                    self.termOptions = results;
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
                return item.text + ' (' + item.context_label + ')';
            },
            formatSelection: function(item) {
                return item.text + ' (' + item.context_label + ')';
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

            const setUpReports = function(reportData) {
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
                            var tileData = {
                                "tiles": source._source.tiles,
                                "related_resources": [],
                                "displayname": source._source.displayname,
                                "resourceid": source._source.resourceinstanceid
                            };
                            
                            tileData.templates = reportLookup;
                            source.report = new ReportModel(_.extend(tileData, {
                                graphModel: self.graphModel,
                                graph: reportData[graphId].graph,
                                datatypes: reportData[graphId].graph.datatypes
                            }));
                            return source;
                        });
                        self.targetResources(resources);
                    });
            };
            fetch(arches.urls.api_bulk_resource_report + `?graph_ids=${[graphId]}&exclude=cards`)
                .then(result => {
                    return result.json();
                }).then(function(data){
                    if (!self.graphModel) {
                        self.graphModel = new GraphModel({
                            data: data[graphId].graph,
                            datatypes: data[graphId].datatypes
                        });
                    }
                    setUpReports(data);
                }).then(function(){
                    self.reportDataLoading(false);
                });
        };

        this.updateSearchResults = function(termFilter, pagingFilter) {
            getResultData(termFilter, pagingFilter);
        };

        this.selectedTerm.subscribe(function(val) {
            var termFilter = self.termOptions[val];
            self.updateSearchResults(termFilter);
        });

        this.query.subscribe(function(query) {
            self.updateSearchResults(null, query['paging-filter']);
        });

        this.initialize();
    }

    ko.components.register('add-things-step', {
        viewModel: viewModel,
        template: {
            require: 'text!templates/views/components/workflows/create-project-workflow/add-things-step.htm'
        }
    });

    return viewModel;
});
