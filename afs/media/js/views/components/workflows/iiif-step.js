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

        params.resourceid(params.workflow.state.steps[params.physicalthingidstep()].physicalthingid);
        NewTileStep.apply(this, [params]);
        
        this.tile.subscribe(function(t){
            if (t) {
                var physicalthingInstanceRef = [{
                    'resourceId': params.workflow.state.steps[params.physicalthingidstep()].physicalthingid,  // resourceid of the visual work
                    'ontologyProperty': '',
                    'inverseOntologyProperty':'',
                    'resourceXresourceId':''
                }];
                t.data["b240c366-8594-11ea-97eb-acde48001122"](physicalthingInstanceRef); // set resourceid from physical thing
                if(!!params.workflow.state.steps[params.visualworkidstep()].visualworkInstanceRef) {
                    t.data["5d440fea-8651-11ea-97eb-acde48001122"](params.workflow.state.steps[params.visualworkidstep()].visualworkInstanceRef); // set resourceid from related visual work
                }
            }
        });

        params.defineStateProperties = function(){
            return {
                resourceid: params.resourceid(),
                tile: !!(ko.unwrap(params.tile)) ? koMapping.toJS(params.tile().data) : undefined,
                tileid: !!(ko.unwrap(params.tile)) ? ko.unwrap(params.tile().tileid): undefined
            };
        };
    }

    ko.components.register('iiif-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/new-tile-step.htm' }
    });
    return viewModel;
});
