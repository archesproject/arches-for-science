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
        params.workflow.state.resourceid = null;
        
        NewTileStep.apply(this, [params]);
        if (params.workflow.state.steps[params._index]) {
            params.resourceid(params.workflow.state.steps[params._index].resourceid);
        } else {
            params.resourceid(null);
        }

        if (params.workflow.state.steps[params._index]) {
            params.tileid(params.workflow.state.steps[params._index].tileid);
        }

        var self = this;

        this.tile.subscribe(function(t){
            if (t && params.workflow.state.steps[params._index - 1]) {
                t.data[params.nodegroupid()]([params.workflow.state.steps[params._index - 1].resourceid]);
                t.save(null, function(){
                    self.onSaveSuccess(t);
                }, this);
            }
        });

        params.defineStateProperties = function() {
            return {
                resourceid: ko.unwrap(params.resourceid),
                tile: !!(ko.unwrap(params.tile)) ? koMapping.toJS(params.tile().data) : undefined,
                tileid: !!(ko.unwrap(params.tile)) ? ko.unwrap(params.tile().tileid) : undefined,
            };
        };

    }

    ko.components.register('insert-prev-resource-as-related-resource-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/new-tile-step.htm' }
    });
    return viewModel;
});
