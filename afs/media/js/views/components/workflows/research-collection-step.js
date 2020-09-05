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
    'bindings/select2-query'
], function($, _, ko, koMapping, arches, NewTileStep, ReportModel, GraphModel, reportLookup, cardComponents) {

    var graph = ko.observable();
    var graphId = '9519cb4f-b25b-11e9-8c7b-a4d18cec433a';
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
    
    function viewModel(params) {

        this.researchActivityResourceId = ko.observable();

        var limit = 10;
        var self = this;
        var researchActivityName = ko.unwrap(params.workflow).state.steps[0].tile["0b92cf5c-ca85-11e9-95b1-a4d18cec433a"];
        this.researchActivityResourceId(ko.unwrap(params.workflow).state.steps[0].resourceid);

        this.saveNewSet = function() {
            $.ajax({
                url: arches.urls.api_node_value,
                type: 'POST',
                dataType: 'json',
                data: {
                    'nodeid': "52aa1e1c-c450-11e9-91cc-a4d18cec433a", // name_label (of Collection)
                    'data':  ("Collection for "+ researchActivityName),
                    'tileid': null
                }
            }).done(function(data) {
                // console.log(data);s
                if (data.resourceinstance_id) {
                    params.resourceid(data.resourceinstance_id);
                    $.ajax({
                        url: arches.urls.api_node_value,
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            'nodeid': 'cc5d6df3-d477-11e9-9f59-a4d18cec433a', // used_set (of Activity)
                            'data': JSON.stringify(
                                [{
                                    'resourceId': data.resourceinstance_id,
                                    'ontologyProperty': '',
                                    'inverseOntologyProperty':'',
                                    'resourceXresourceId':''
                                }]
                            ), 
                            'tileid': null,
                            'resourceinstanceid': self.researchActivityResourceId()
                        }
                    });
                }
            });
        };
        this.saveNewSet();
        params.getJSONOnLoad = ko.observable(false);
        
        NewTileStep.apply(this, [params]);
        self.seedCardGraphId = function() {
            return ko.unwrap(params.graphid);
        };
        self.getJSON();

        this.next = params.workflow.next;
        this.paginator = ko.observable();
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
            var tilevalue = null;
            if (ko.unwrap(self.tile)){
                tilevalue = self.tile().data[params.nodeid()];
            }
            var val = self.value().find(function(item) {
                return item['resourceId'] === resourceid;
            });
            if (!!val) {
                // remove item, we don't want users to add the same item twice
                self.value.remove(val);
            } else {
                var nodeConfig = self.nodeLookup[params.nodeid()].config.graphs().find(function(config) {
                    return config.graphid === graphId;
                });
                self.value.push({'resourceId': resourceid, 'ontologyProperty': nodeConfig['ontologyProperty'], 'inverseOntologyProperty': nodeConfig['inverseOntologyProperty']});
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

        this.submit = function() {
            $.ajax({
                url: arches.urls.api_node_value,
                type: 'POST',
                data: {
                    'nodeid': params.nodeid(),
                    'data': JSON.stringify(self.value()),
                    'resourceinstanceid': ko.unwrap(params.resourceid),
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
        
        this.reportLookup = reportLookup;
        var getResultData = function(termFilter, graph) {
            var filters = {
                "paging-filter": 1
            };
            if (termFilter) {
                termFilter['inverted'] = false;
                filters["term-filter"] = JSON.stringify([termFilter]);
            }

            params.loading(true);
            $.ajax({
                url: arches.urls.physical_thing_search_results,
                data: filters,
            }).done(function(data) {
                self.paginator(koMapping.fromJS(data['paging-filter']['paginator']));
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

        this.newPage = function(page) {
            if(page){
                console.log(page);
                // this.page(page);
            }
        },
        
        this.updateSearchResults = function(termFilter) {
            params.loading(true);
            if (graph()) getResultData(termFilter, graph());
            else graph.subscribe(function(graph) {
                getResultData(termFilter, graph);
            });
        };

        this.updateSearchResults();

        this.selectedTerm.subscribe(function(val) {
            var termFilter = self.termOptions[val];
            self.updateSearchResults(termFilter);
        });

        // params.defineStateProperties = function() {
        //     return {
        //         resourceid: ko.unwrap(params.resourceid),
        //         tile: !!(ko.unwrap(params.tile)) ? koMapping.toJS(params.tile().data) : undefined,
        //         tileid: !!(ko.unwrap(params.tile)) ? ko.unwrap(params.tile().tileid) : undefined,
        //     };
        // };
    }

    ko.components.register('research-collection-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/object-search-step.htm' }
    });
    return viewModel;
});
