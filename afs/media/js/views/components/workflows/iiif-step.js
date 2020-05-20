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
        if (!params.resourceid()) {
            params.resourceid(params.workflow.state.steps[params._index - 1].resourceid);
        }
        if (params.workflow.state.steps[params._index - 1]) {
            params.tileid(params.workflow.state.steps[params._index - 1].tileid);
        }
        NewTileStep.apply(this, [params]);

        // var self = this;
        this.targetResource = ko.observable();

        params.getStateProperties = function(){
            return {
                resourceid: ko.unwrap(params.resourceid),
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
