define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'views/components/workflows/new-tile-step',
    'bindings/select2-query',
], function(_, $, arches, ko, koMapping, NewTileStep) {

    function viewModel(params) {
        // if (!params.resourceid()) {
        //     params.resourceid(params.workflow.state.resourceid);
        // }
        // if (params.workflow.state.steps[params._index - 1]) {
        //     params.resourceid(params.workflow.state.steps[params._index - 1].resourceid);
        //     params.tileid(params.workflow.state.steps[params._index - 1].tileid);
        // }
        NewTileStep.apply(this, [params]);

        var self = this;
        // this.paginator = ko.observable();
        // this.targetResource = ko.observable();
        // this.selectedTerm = ko.observable();
        // this.totalResults = ko.observable();
        // var limit = 10;
        // this.termOptions = [];
        // this.value = ko.observableArray([]);
        // this.startValue = null;
        // this.tile.subscribe(function(tile){
        //     this.startValue = tile.data[params.nodeid()]();
        //     if (this.startValue) {
        //         this.startValue.forEach(function(item){
        //             self.value.push(item);
        //         });
        //     }
        // });
        // this.items = ko.observableArray([]);

        self.onSaveSuccess = function(tiles) {
            var tile;
            var relatedSetNodeId = 'cc5d6df3-d477-11e9-9f59-a4d18cec433a';
            if (tiles.length > 0 || typeof tiles == 'object') {
                tile = tiles[0] || tiles;
                params.resourceid(tile.data[relatedSetNodeId]()[0]);
                params.tileid(tile.tileid);
                self.resourceId(tile.data[relatedSetNodeId]()[0]);
            }
            if (params.workflow) {
                params.workflow.updateUrl();
            }
            if (self.completeOnSave === true) { self.complete(true); }
        };

 

        params.getStateProperties = function(){
            var tileid = undefined;
            if (!!(ko.unwrap(params.tile))) {
                tileid = ko.unwrap(params.tile().tileid);
            } else if (!!(ko.unwrap(params.tileid))) {
                tileid = ko.unwrap(params.tileid);
            }
            return {
                resourceid: ko.unwrap(params.resourceid),
                tile: !!(ko.unwrap(params.tile)) ? koMapping.toJS(params.tile().data) : undefined,
                tileid: tileid,
            };
        };
    }

    ko.components.register('related-set-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/new-tile-step.htm' }
    });
    return viewModel;
});
