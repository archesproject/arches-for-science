define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'views/components/workflows/new-tile-step'
], function(_, $, arches, ko, koMapping, NewTileStep) {

    function viewModel(params) {
        if (!params.resourceid()) {
            params.resourceid(params.workflow.state.resourceid);
        }
        if (params.workflow.state.steps[params._index]) {
            params.tileid(params.workflow.state.steps[params._index].tileid);
        }

        this.physicalResources=ko.observableArray([]);
        var self = this;

        $.ajax({
            url: arches.urls.search_results,
            data: {
                "paging-filter": 1,
                "resource-type-filter": [{"graphid":"9519cb4f-b25b-11e9-8c7b-a4d18cec433a","inverted":false}]
            }
        }).done(function(data){
            self.physicalResources(data['results']['hits']['hits']);
        });

        this.workflowStepClass = ko.unwrap(params.class());
        params.getStateProperties = function(){
            return {
                resourceid: ko.unwrap(params.resourceid),
                tile: !!(ko.unwrap(params.tile)) ? koMapping.toJS(params.tile().data) : undefined,
                tileid: !!(ko.unwrap(params.tile)) ? ko.unwrap(params.tile().tileid): undefined,
            };
        };
    }

    ko.components.register('object-search-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/object-search-step.htm' }
    });
    return viewModel;
});
