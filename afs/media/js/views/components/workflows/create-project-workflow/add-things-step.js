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

        this.nodeLookupUpdated = ko.observable(true);
        var collectionGraphId = "1b210ef3-b25c-11e9-a037-a4d18cec433a";
        $.getJSON(( arches.urls.api_card + collectionGraphId), function(data) {
            var handlers = {
                'after-update': [],
                'tile-reset': []
            };
            var displayname = ko.observable(data.displayname);
            var createLookup = function(list, idKey) {
                return _.reduce(list, function(lookup, item) {
                    lookup[item[idKey]] = item;
                    return lookup;
                }, {});
            };

            self.reviewer = data.userisreviewer;
            self.provisionalTileViewModel = new ProvisionalTileViewModel({
                tile: self.tile,
                reviewer: data.userisreviewer
            });

            var graphModel = new GraphModel({
                data: {
                    nodes: data.nodes,
                    nodegroups: data.nodegroups,
                    edges: []
                },
                datatypes: data.datatypes
            });

            self.graphModel = graphModel;

            self.topCards = _.filter(data.cards, function(card) {
                var nodegroup = _.find(data.nodegroups, function(group) {
                    return group.nodegroupid === card.nodegroup_id;
                });
                return !nodegroup || !nodegroup.parentnodegroup_id;
            }).map(function(card) {
                self.componentData.parameters.nodegroupid = self.componentData.parameters.nodegroupid || card.nodegroup_id;
                return new CardViewModel({
                    card: card,
                    graphModel: graphModel,
                    tile: null,
                    resourceId: self.resourceId,
                    displayname: displayname,
                    handlers: handlers,
                    cards: data.cards,
                    tiles: data.tiles,
                    provisionalTileViewModel: self.provisionalTileViewModel,
                    cardwidgets: data.cardwidgets,
                    userisreviewer: data.userisreviewer,
                    loading: self.loading
                });
            });

            self.card.subscribe(function(card){
                if (ko.unwrap(card.widgets) && self.componentData.parameters.hiddenNodes) {
                    card.widgets().forEach(function(widget){
                        if (self.componentData.parameters.hiddenNodes.indexOf(widget.node_id()) > -1) {
                            widget.visible(false);
                        }
                    });
                }
            });

            self.topCards.forEach(function(topCard) {
                topCard.topCards = self.topCards;
            });

            self.widgetLookup = createLookup(
                data.widgets,
                'widgetid'
            );
            self.cardComponentLookup = createLookup(
                data['card_components'],
                'componentid'
            );
            self.nodeLookup = createLookup(
                graphModel.get('nodes')(),
                'nodeid'
            );
            self.on = function(eventName, handler) {
                if (handlers[eventName]) {
                    handlers[eventName].push(handler);
                }
            };

            /*
                If a step modifies a child tile, get the correct parent tile id from the step that created the parent tile. 
                This requires that your step has a parameter 'parenttilesourcestep' that identifies the step with the parent tile.
            */
            if (self.externalStepData[self.componentData.parameters.parenttilesourcestep]){
                self.componentData.parameters.parenttileid = self.externalStepData[self.componentData.parameters.parenttilesourcestep].data.tileid;
            }

            self.flattenTree(self.topCards, []).forEach(function(item) {
                if (item.constructor.name === 'CardViewModel' && item.nodegroupid === ko.unwrap(self.componentData.parameters.nodegroupid)) {
                    if (ko.unwrap(self.componentData.parameters.parenttileid) && item.parent && ko.unwrap(self.componentData.parameters.parenttileid) !== item.parent.tileid) {
                        return;
                    }
                    if (self.customCardLabel) item.model.name(ko.unwrap(self.customCardLabel));
                    self.card(item);
                    if (ko.unwrap(self.componentData.parameters.tileid)) {
                        ko.unwrap(item.tiles).forEach(function(tile) {
                            if (tile.tileid === ko.unwrap(self.componentData.parameters.tileid)) {
                                self.tile(tile);
                            }
                        });
                    } else if (ko.unwrap(self.componentData.parameters.createTile) !== false) {
                        self.tile(item.getNewTile());
                    }
                }
            });

            self.componentData.parameters.card = self.card();
            self.componentData.parameters.tile = self.tile();
            self.componentData.parameters.loading = self.loading;
            self.componentData.parameters.provisionalTileViewModel = self.provisionalTileViewModel;
            self.componentData.parameters.reviewer = data.userisreviewer;
            self.componentData.parameters.dirty = self.isDirty;
            self.componentData.parameters.saveFunction = self.saveFunction;
            self.componentData.parameters.tiles = self.tiles;

            self.loading(false);
        });

        var limit = 7;
        this.projectResourceId = ko.observable();
        this.collectionResourceId = ko.observable();
        this.usedSetTileId = ko.observable();
        this.reportDataLoading = ko.observable(params.loading());

        var researchActivityStepData = params.researchActivityStepData;
        var researchActivityName = JSON.parse(researchActivityStepData["tileData"])[activityNameNodeId];
        this.projectResourceId(researchActivityStepData.resourceInstanceId);

        if (ko.unwrap(self.previouslyPersistedComponentData)){
            var cachedValue = ko.unwrap(self.previouslyPersistedComponentData)[0];
            if (cachedValue['collectionResourceId']){
                self.collectionResourceId(cachedValue['collectionResourceId']);
            }
            if (cachedValue['usedSetTileId']){
                self.usedSetTileId(cachedValue['usedSetTileId']);
            }
        }

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
        this.selectedResources = ko.observableArray([]);
        this.startValue = null;

        this.dirty = ko.pureComputed(function() {
            return ko.unwrap(self.tile) ? self.tile().dirty() : false;
        });
        this.dirty.subscribe(function(dirty) {
            if (self.hasUnsavedData) {
                self.hasUnsavedData(dirty);
            }
        });

        this.value.subscribe(function(a) {
            a.forEach(function(action) {
                if (action.status === 'added') {
                    $.ajax({
                        url: arches.urls.api_resources(ko.unwrap(action.value['resourceId'])),
                        data: {
                            format: 'json',
                            includetiles: 'false'
                        }
                    }).done(function(data) {
                        self.selectedResources.push(data);
                    });
                } else if (action.status === 'deleted') {
                    self.selectedResources().forEach(function(val) {
                        if (val.resourceinstanceid === ko.unwrap(action.value['resourceId'])) {
                            self.selectedResources.remove(val);
                        }
                    });
                }
            });
        }, null, "arrayChange");

        this.tile.subscribe(function(tile) {
            self.startValue = tile.data[ko.unwrap(params.nodeid)]();
            if (self.startValue) {
                self.startValue.forEach(function(item) {
                    self.value.push(koMapping.toJS(item));
                });
            }
        });

        this.resetTile = function() {
            self.tile().data[ko.unwrap(params.nodeid)](self.startValue);
            self.value.removeAll();
            if (self.startValue) {
                self.startValue.forEach(function(item) {
                    self.value.push(koMapping.toJS(item));
                });
            }
        };
        params.form.reset = this.resetTile;

        this.updateTileData = function(resourceid) {
            var tilevalue = self.tile().data[ko.unwrap(params.nodeid)];
            var val = self.value().find(function(item) {
                return ko.unwrap(item['resourceId']) === resourceid;
            });

            if (!!val) {
                // remove item, we don't want users to add the same item twice
                self.value.remove(val);
            } else {
                var nodeConfig;
                var nodeData = ko.unwrap(self.nodeLookup)[ko.unwrap(params.nodeid)];

                if (nodeData) {
                    nodeConfig = nodeData.config.graphs().find(function(config) {
                        return config.graphid === graphId;
                    });

                    self.value.push({'resourceId': resourceid, 'ontologyProperty': nodeConfig['ontologyProperty'], 'inverseOntologyProperty': nodeConfig['inverseOntologyProperty']});
                }
            }
            if (self.value().length === 0 && self.startValue === null) {
                tilevalue(null);
            } else {
                tilevalue(self.value());
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
                    'tileid': null,
                    'resourceinstanceid': ko.unwrap(self.collectionResourceId)
                }
            }).done(function(data) {
                self.collectionResourceId(data.resourceinstance_id);
                $.ajax({
                    url: arches.urls.api_node_value,
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        'nodeid': activityUsedSetNodeId, // used_set (of Activity)
                        'data': JSON.stringify(
                            [{
                                'resourceId': data.resourceinstance_id,
                                'ontologyProperty': '',
                                'inverseOntologyProperty':'',
                                'resourceXresourceId':''
                            }]
                        ), 
                        'tileid': ko.unwrap(self.usedSetTileId),
                        'resourceinstanceid': self.projectResourceId()
                    }
                }).done(function(data){
                    self.usedSetTileId(data.tileid);
                    $.ajax({
                        url: arches.urls.api_node_value,
                        type: 'POST',
                        data: {
                            'nodeid': ko.unwrap(params.nodeid),
                            'data': koMapping.toJSON(self.value),
                            'resourceinstanceid': ko.unwrap(self.collectionResourceId),
                            'tileid': self.tile().tileid
                        }
                    }).done(function(data) {
                        if (data.tileid && self.tile().tileid === "") {
                            self.tile().tileid = data.tileid;
                        }
                        self.startValue = data.data[ko.unwrap(params.nodeid)];
                        self.tile()._tileData(koMapping.toJSON(data.data));

                        self.savedData([data].map(function(savedDatum) {
                            return {
                                tileData: JSON.stringify(savedDatum.data),
                                tileId: savedDatum.tileid,
                                nodegroupId: savedDatum.nodegroup_id,
                                resourceInstanceId: savedDatum.resourceinstance_id,
                                projectResourceId: ko.unwrap(self.projectResourceId),
                                collectionResourceId: ko.unwrap(self.collectionResourceId),
                                usedSetTileId: ko.unwrap(self.usedSetTileId),
                            };    
                        }));

                        self.saving(false);
                        self.complete(true);
                    });
                });
            });
        };
        params.form.save = self.submit;
        params.form.onSaveSuccess = function() {};
        
        params.form.saveOnQuit(function() {
            var memberOfSetNodeid = '63e49254-c444-11e9-afbe-a4d18cec433a';
            var rrTemplate = [{ 
                "resourceId": ko.unwrap(self.collectionResourceId),
                "ontologyProperty": "",
                "resourceXresourceId": "",
                "inverseOntologyProperty": ""
            }];
            self.value().forEach(function(value) {
                $.ajax({
                    url: arches.urls.api_node_value,
                    type: 'POST',
                    data: {
                        'nodeid': memberOfSetNodeid,
                        'data': koMapping.toJSON(rrTemplate),
                        'resourceinstanceid': value.resourceId,
                        'tileid': ''
                    }
                }).done(function() {
                    // eslint-disable-next-line no-console
                    console.log(value.resourceId, "related resource is created");
                });
            });
        });

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
    }

    ko.components.register('add-things-step', {
        viewModel: viewModel,
        template: {
            require: 'text!templates/views/components/workflows/create-project-workflow/add-things-step.htm'
        }
    });

    return viewModel;
});
