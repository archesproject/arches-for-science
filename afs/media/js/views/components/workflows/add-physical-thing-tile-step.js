define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'views/components/workflows/new-tile-step'
], function(_, $, arches, ko, koMapping, NewTileStep) {
    function viewModel(params) {

        // if (params.workflow) {
        //     params.workflow.state.resourceid = undefined;
        //     params.resourceid();
        // }

        NewTileStep.apply(this, [params]);

        // if (!params.resourceid()) {
        //     params.resourceid(params.workflow.state.resourceid);
        // }
        // if (params.workflow.state.steps[params._index]) {
        //     params.tileid(params.workflow.state.steps[params._index].tileid);
        // }

        // params.defineStateProperties = function(){
        //     return {
        //         resourceid: ko.unwrap(params.resourceid),
        //         tile: !!(ko.unwrap(params.tile)) ? koMapping.toJS(params.tile().data) : undefined,
        //         tileid: !!(ko.unwrap(params.tile)) ? ko.unwrap(params.tile().tileid): undefined,
        //     };
        // };

        var props = params.defineStateProperties();
        var previousStep =  params.workflow.state.steps[params.workflow.state.previousstep].tile;
        console.log(props);
        console.log(params);
    }

    return ko.components.register('add-physical-thing-tile-step', {
        viewModel: viewModel,
        template: {
            require: 'text!templates/views/components/workflows/new-tile-step.htm'
        }
    });
});