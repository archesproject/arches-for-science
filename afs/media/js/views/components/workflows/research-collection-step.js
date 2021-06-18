define([
    'jquery',
    'underscore',
    'knockout',
    'knockout-mapping',
    'arches',
    'views/components/workflows/new-tile-step',
    'models/report',
    'models/graph',
    'report-templates',
    'card-components',
    'bindings/select2-query',
    'views/components/search/paging-filter',
    'views/components/search/search-results'
], function($, _, ko, koMapping, arches, NewTileStep, ReportModel, GraphModel, reportLookup, cardComponents) {

    var graph = ko.observable();

    var graphId = '9519cb4f-b25b-11e9-8c7b-a4d18cec433a'; // Physical Thing graph
    var collectionNameNodeId = '52aa2007-c450-11e9-b5d4-a4d18cec433a'; // Name_content in Collection resource
    var activityUsedSetNodeId = 'cc5d6df3-d477-11e9-9f59-a4d18cec433a'; //Used Set in Project
    var activityNameNodeId = "0b92cf5c-ca85-11e9-95b1-a4d18cec433a"; // Name_content in Project resource

    $.getJSON(arches.urls.graphs_api + graphId, function(data) {
        var graphModel = new GraphModel({
            data: data.graph,
            datatypes: data.datatypes
        });

        graph({
            graphModel: graphModel,
            cards: data.cards,
            graph: data.graph,
            datatypes: data.datatypes,
            cardwidgets: data.cardwidgets
        });
    });

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
        var limit = 10;

        this.projectResourceId = ko.observable();
        this.collectionResourceId = ko.observable();

        var researchActivityStepData = params.externalStepData['researchactivitystep']['data'];
        var researchActivityName = researchActivityStepData.tile[activityNameNodeId];
        this.projectResourceId(researchActivityStepData.resourceid);

        if (ko.unwrap(params.value)){
            cachedValue = ko.unwrap(params.value);
            if (cachedValue['collectionResourceId']){
                self.collectionResourceId(cachedValue['collectionResourceId']);
                params.resourceid(self.collectionResourceId());
            }
        }

        params.getJSONOnLoad = ko.observable(true);
        NewTileStep.apply(this, [params]);

        this.saveNewSet = function() {
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
                if (data.resourceinstance_id) {
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
                            'tileid': null,
                            'resourceinstanceid': self.projectResourceId()
                        }
                    });
                }
            });
        };

        if (!ko.unwrap(self.collectionResourceId)) {
            this.saveNewSet();
        }

        params.getJSONOnLoad = ko.observable(false);

        NewTileStep.apply(this, [params]);
        self.getCardResourceIdOrGraphId = function() {
            return ko.unwrap(params.graphid);
        };
        self.getJSON();

        this.selectedTab = ko.observable();
        this.toggleRelationshipCandidacy = ko.observable();
        this.isResourceRelatable = ko.observable();

        this.filters = {
            'paging-filter': ko.observable(),
            'search-results': ko.observable(),
        };
        this.reportLookup = reportLookup;
        this.query = ko.observable(getQueryObject());
        this.searchResults = {'timestamp': ko.observable()};
        this.targetResource = ko.observable();
        this.selectedTerm = ko.observable();
        this.totalResults = ko.observable();
        this.targetResources = ko.observableArray([]);
        this.targetResourceSearchValue = ko.observable();
        this.termOptions = [];
        this.value = ko.observableArray([]).extend({
            rateLimit: 100
        });
        this.selectedResources = ko.observableArray([]);
        this.startValue = null;

        params.hasDirtyTile(Boolean(self.value().length));

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
            self.startValue = tile.data[params.nodeid()]();
            if (self.startValue) {
                self.startValue.forEach(function(item) {
                    self.value.push(item);
                });
            }
        });

        this.resetTile = function() {
            self.tile().data[params.nodeid()](self.startValue);
            self.value.removeAll();
            if (self.startValue) {
                self.startValue.forEach(function(item) {
                    self.value.push(item);
                });
            }
        };

        this.updateTileData = function(resourceid) {
            var tilevalue = self.tile().data[params.nodeid()];
            var val = self.value().find(function(item) {
                return ko.unwrap(item['resourceId']) === resourceid;
            });

            if (!!val) {
                // remove item, we don't want users to add the same item twice
                self.value.remove(val);
            } else {
                var nodeConfig;
                var nodeData = self.nodeLookup[params.nodeid()];
                
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

        this.dirty = ko.pureComputed(function() {
            return ko.unwrap(self.tile) ? self.tile().dirty() : false;
        });
        this.dirty.subscribe(function(dirty) {
            if (params.hasDirtyTile) {
                params.hasDirtyTile(dirty);
            }
        });

        this.submit = function() {
            $.ajax({
                url: arches.urls.api_node_value,
                type: 'POST',
                data: {
                    'nodeid': params.nodeid(),
                    'data': koMapping.toJSON(self.value()),
                    'resourceinstanceid': ko.unwrap(self.collectionResourceId),
                    'tileid': self.tile().tileid
                }
            }).done(function(data) {
                if (data.tileid && params.tile().tileid === "") {
                    params.tile().tileid = data.tileid;
                }
                self.onSaveSuccess([data]);
                self.startValue = data.data[params.nodeid()];
                self.tile()._tileData(koMapping.toJSON(data.data));
            });
        };
        if (params.preSaveCallback && !ko.unwrap(params.preSaveCallback)) {
            params.preSaveCallback(self.submit);
        }

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
                    self.termOptions = results;
                    return {
                        results: results,
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
        
        var getResultData = function(termFilter, graph, pagingFilter) {
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

            params.loading(true);
            $.ajax({
                url: arches.urls.physical_thing_search_results,
                data: filters
            }).done(function(data) {
                _.each(this.searchResults, function(_value, key) {
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
                var resources = data['results']['hits']['hits'].map(function(source) {
                    var tileData = {
                        "tiles": source._source.tiles,
                        "related_resources": [],
                        "displayname": source._source.displayname,
                        "resourceid": source._source.resourceinstanceid
                    };
                    tileData.cards = [];
                    
                    tileData.templates = reportLookup;
                    tileData.cardComponents = cardComponents;
                    source.report = new ReportModel(_.extend(tileData, {
                        graphModel: graph.graphModel,
                        graph: graph.graph,
                        datatypes: graph.datatypes
                    }));
                    return source;
                });
                self.targetResources(resources);
                params.loading(false);
            });
        };
        
        this.updateSearchResults = function(termFilter, pagingFilter) {
            params.loading(true);

            if (ko.unwrap(graph)) {
                getResultData(termFilter, ko.unwrap(graph), pagingFilter);
            }
        };

        graph.subscribe(function(graph) {
            if (ko.unwrap(graph)) {
                getResultData(null, ko.unwrap(graph));
            }
        });

        params.defineStateProperties = function(){
            var wastebin = !!(ko.unwrap(params.wastebin)) ? koMapping.toJS(params.wastebin) : undefined;
            var resourceId = ko.unwrap(self.collectionResourceId);

            if (resourceId) {
                if (wastebin && 'resourceid' in wastebin) {
                    wastebin.resourceid = resourceId;
                }
            }
            
            ko.mapping.fromJS(wastebin, {}, params.wastebin);
            
            return {
                resourceid: resourceId,
                tile: !!(ko.unwrap(params.tile)) ? koMapping.toJS(params.tile().data) : undefined,
                tileid: !!(ko.unwrap(params.tile)) ? ko.unwrap(params.tile().tileid): undefined,
                wastebin: wastebin,
                projectResourceId: ko.unwrap(self.projectResourceId),
                collectionResourceId: ko.unwrap(self.collectionResourceId),        
            };
        };

        this.selectedTerm.subscribe(function(val) {
            var termFilter = self.termOptions[val];
            self.updateSearchResults(termFilter);
        });

        this.query.subscribe(function(query) {
            self.updateSearchResults(null, query['paging-filter']);
        });
    }

    ko.components.register('research-collection-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/object-search-step.htm' }
    });
    return viewModel;
});
