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

        this.tile.subscribe(function(t){
            if (t) {
                t.data["5d440fea-8651-11ea-97eb-acde48001122"](params.workflow.state.steps[3].resourceid); // set resourceid from related visual work
                t.data["b240c366-8594-11ea-97eb-acde48001122"](params.workflow.state.steps[0].resourceid); // set resourceid from physical thing
            }
        });

        params.defineStateProperties = function(){
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
