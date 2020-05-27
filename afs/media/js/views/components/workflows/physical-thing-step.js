define([
    'underscore',
    'knockout',
    'knockout-mapping',
    'arches',
    'views/components/workflows/new-tile-step',
    'bindings/select2-query',
], function(_, ko, koMapping, arches, NewTileStep) {

    function viewModel(params) {

        this.visualworkid;
        this.digitalresourceid;
        NewTileStep.apply(this, [params]);
        var self = this;
        this.onSaveSuccess = function(tile) {
            params.resourceid(tile.resourceinstance_id);
            params.tileid(tile.tileid);
            self.resourceId(tile.resourceinstance_id);
            // 'Creates a visual work that references the current physical thing',
            $.ajax({
                url: arches.urls.api_tiles,
                type: 'POST',
                data: {
                    'nodeid': '5513933a-c062-11e9-9e4b-a4d18cec433a', // depicts (physical thing)
                    'data': JSON.stringify([tile.resourceinstance_id]), // resourceid of the physical thing
                    'tileid': null 
                }
            }).done(function(data) {
                console.log(data);
                self.visualworkid = data.resourceinstance_id
                // 'Creates a digital resource that references the visual work',
                $.ajax({
                    url: arches.urls.api_tiles,
                    type: 'POST',
                    data: {
                        'nodeid': 'c1e732b0-ca7a-11e9-b369-a4d18cec433a', // shows (visual work)
                        'data': JSON.stringify([data.resourceinstance_id]),  // resourceid of the visual work
                        'tileid': null
                    }
                }).done(function(data) {
                    console.log(data)
                    self.digitalresourceid = data.resourceinstance_id;
                    self.setStateProperties();
                    if (params.workflow) {
                        params.workflow.updateUrl();
                    }
                    if (self.completeOnSave === true) { self.complete(true); }
                });
            });
        };

        params.defineStateProperties = function(){
            var tileid = undefined;
            if (!!(ko.unwrap(params.tile))) {
                tileid = ko.unwrap(params.tile().tileid);
            } else if (!!(ko.unwrap(params.tileid))) {
                tileid = ko.unwrap(params.tileid);
            }
            return {
                digitalresourceid: self.digitalresourceid,
                visualworkid: self.visualworkid,
                resourceid: ko.unwrap(params.resourceid),
                tile: !!(ko.unwrap(params.tile)) ? koMapping.toJS(params.tile().data) : undefined,
                tileid: tileid,
            };
        };
    }

    ko.components.register('physical-thing-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/new-tile-step.htm' }
    });
    return viewModel;
});
