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

        NewTileStep.apply(this, [params]);
        var self = this;

        this.digitalResourceId = ko.observable(null);
        this.manifestUrl = ko.observable(null);
        this.getData = function() {
            $.ajax({
                url: arches.urls.api_resources(self.digitalResourceId()),
                type: 'GET',
                data: {
                    'format': 'json'
                }
            }).done(function(data) {
                data.tiles.forEach(function(tile){
                    // get manifest url off digital resource content tile
                    if (tile.nodegroup_id === 'db05b5ca-ca7a-11e9-82ca-a4d18cec433a' && tile.data['db05c421-ca7a-11e9-bd7a-a4d18cec433a']) {
                        self.manifestUrl(tile.data['db05c421-ca7a-11e9-bd7a-a4d18cec433a']);
                    }
                });
            });
        };
        if (params.workflow.state.steps[params._index - 1]) {
            this.digitalResourceId(params.workflow.state.steps[params._index - 1].selectedPhysicalThingId);
        }
        self.getData();

        self.card.subscribe(function(c) {
            self.manifestUrl.subscribe(function(url) {
                if (url) {
                    c.manifest = url;
                }
            });
        });

        this.tile.subscribe(function(t){
            if (t) {
                t.data["5d440fea-8651-11ea-97eb-acde48001122"](params.workflow.state.steps[3].relatedresourceid); // set resourceid from related visual work
                t.data["b240c366-8594-11ea-97eb-acde48001122"](params.workflow.state.steps[0].resourceid); // set resourceid from physical thing
            }
        });

        params.defineStateProperties = function(){
            return {
                resourceid: self.digitalResourceId(),
                tile: !!(ko.unwrap(params.tile)) ? koMapping.toJS(params.tile().data) : undefined,
                tileid: !!(ko.unwrap(params.tile)) ? ko.unwrap(params.tile().tileid): undefined,
            };
        };
    }

    ko.components.register('iiif-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/new-tile-step.htm' }
    });
    return viewModel;
});
