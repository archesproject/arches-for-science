define([
    'underscore',
    'knockout',
    'knockout-mapping',
    'views/components/workflows/new-tile-step',
    'bindings/select2-query',
], function(_, ko, koMapping, NewTileStep) {

    function viewModel(params) {
        var relatedSetNodeId = 'cc5d6df3-d477-11e9-9f59-a4d18cec433a';

        NewTileStep.apply(this, [params]);

        params.defineStateProperties = function(){
            var tileid = undefined;
            if (!!(ko.unwrap(params.tile))) {
                tileid = ko.unwrap(params.tile().tileid);
            } else if (!!(ko.unwrap(params.tileid))) {
                tileid = ko.unwrap(params.tileid);
            }
            return {
                relatedresourceid: params.tile() && params.tile().data[relatedSetNodeId] && params.tile().data[relatedSetNodeId]()[0] ? params.tile().data[relatedSetNodeId]()[0] : null,
                resourceid: ko.unwrap(params.resourceid) || this.workflow.state.resourceid,
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
