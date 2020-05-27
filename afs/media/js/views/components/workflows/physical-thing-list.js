define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'models/report',
    'models/graph',
    'report-templates',
    'card-components',
    'bindings/select2-query',
], function(_, $, arches, ko, koMapping, ReportModel, GraphModel, reportLookup, cardComponents) {

    function viewModel(params) {
        if (!params.resourceid()) {
            params.resourceid(params.workflow.state.resourceid);
        }
        if (params.workflow.state.steps[params._index - 1]) {
            params.resourceid(params.workflow.state.steps[params._index - 1].resourceid);
            params.tileid(params.workflow.state.steps[params._index - 1].tileid);
        }        

        var self = this;
        var graph;
        this.items = ko.observableArray([]);
        this.setresourceid = params.workflow.state.steps[params._index - 1].relatedresourceid;
        this.complete = params.complete || ko.observable();
        this.completeOnSave = params.completeOnSave === false ? false : true;
        this.selectedPhysicalThingId = ko.observable();

        this.selectIIIFTile = function(item) {
            self.selectedPhysicalThingId(item._id);
            params.resourceid(item._id);
            if (ko.unwrap(self.complete) !== true) {
                self.complete(true);
            } else {
                params.workflow.next();
            }
        };

        this.reportLookup = reportLookup;

        var getResultData = function() {
            params.loading(true);
            $.ajax({
                url: arches.urls.physical_things_set,
                data: {'resourceid': self.setresourceid, nodegroupid: params.nodegroupid, nodeid: params.nodeid},
            }).done(function(data) {
                var resources = data['items'].map(function(source) {
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
                self.items(resources);
                params.loading(false);
            });
        };

        this.getData = function(termFilter) {
            params.loading(true);
            if (graph) {
                getResultData(termFilter);
            } else {
                var graphId = '9519cb4f-b25b-11e9-8c7b-a4d18cec433a';
                $.getJSON(arches.urls.graphs_api + graphId, function(data) {
                    var graphModel = new GraphModel({
                        data: data.graph,
                        datatypes: data.datatypes
                    });
                    graph = {
                        graphModel: graphModel,
                        cards: data.cards,
                        graph: data.graph,
                        datatypes: data.datatypes,
                        cardwidgets: data.cardwidgets
                    };
                    getResultData();
                });
            }
        };

        this.getData();

        params.defineStateProperties = function(){
            var tileid = undefined;
            if (!!(ko.unwrap(params.tile))) {
                tileid = ko.unwrap(params.tile().tileid);
            } else if (!!(ko.unwrap(params.tileid))) {
                tileid = ko.unwrap(params.tileid);
            }
            return {
                selectedPhysicalThingId: self.selectedPhysicalThingId(),
                resourceid: ko.unwrap(params.resourceid),
                tile: !!(ko.unwrap(params.tile)) ? koMapping.toJS(params.tile().data) : undefined,
                tileid: tileid,
            };
        };
    }

    ko.components.register('physical-thing-list', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/physical-thing-list.htm' }
    });
    return viewModel;
});
