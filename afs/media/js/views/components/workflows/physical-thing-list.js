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
            params.resourceid(params.workflow.state.resourceid);
        }
        if (params.workflow.state.steps[params._index - 1]) {
            params.resourceid(params.workflow.state.steps[params._index - 1].resourceid);
            params.tileid(params.workflow.state.steps[params._index - 1].tileid);
        }
        NewTileStep.apply(this, [params]);

        var self = this;
        this.items = ko.observableArray([]);
        this.setresourceid = params.resourceid() || '';

        this.selectIIIFTile = function(item, annotation) {
            params.tileid(annotation.tileid);
            params.resourceid(item.resourceid);
            params.getStateProperties();
            self.complete(true);
        };

        this.getData = function(){
            $.ajax({
                url: arches.urls.physical_things_set,
                type: 'GET',
                data: { 
                    'resourceid': self.setresourceid,
                }
            }).done(function(data){
                self.items(data.items);
            });
        };

        this.getData();

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

    ko.components.register('physical-thing-list', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/physical-thing-list.htm' }
    });
    return viewModel;
});
