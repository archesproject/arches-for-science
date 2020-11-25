define([
    'underscore',
    'knockout',
    'views/components/workflows/new-tile-step'
], function(_, ko, NewTileStep) {

    function viewModel(params) {
        params.getJSONOnLoad = ko.observable(false);
        NewTileStep.apply(this, [params]);
        var self = this;
        this.hideDefaultButtons = ko.observable(true);
        this.saveTile = function(callback) {
            self.loading(true);
            self.tile().save(function(response) {
                self.loading(false);
                // params.pageVm.alert(
                //     new AlertViewModel(
                //         'ep-alert-red',
                //         response.responseJSON.title,
                //         response.responseJSON.message,
                //         null,
                //         function(){}
                //     )
                // );
                if (params.form.onSaveError) {
                    params.form.onSaveError(self.tile);
                }
            }, function() {
                self.loading(false);
                if (typeof self.onSaveSuccess === 'function') self.onSaveSuccess();
                // if (params.form.onSaveSuccess) {
                //     params.form.onSaveSuccess(self.tile);
                // }
                // if (typeof callback === 'function') callback();
            });
        };
        // self.card.subscribe(function(c) {
        //     if(c.newTile) {}
        // })
        this.altButtons = [
            {
                "label": "Delete Alt",
                "classes": "btn btn-shim btn-labeled btn-lg fa fa-trash",
                "onClick": function(){
                    var card = self.card();
                    if (card) card.newTile.deleteTile();
                },
                "visible": ko.computed(function(){
                    var card = self.card();
                    if (!card) return false;
                    return !!card.newTile ? !!card.newTile.tileid && !!card.newTile.deleteTile : false;
                }),
                "disabled": ko.computed(function(){return !self.card.isWritable; })
            },
            {
                "label": "Cancel Alt",
                "classes": "btn btn-shim btn-danger btn-labeled btn-lg fa fa-times",
                "onClick": function(){if (self.card.newTile) {self.card.newTile.reset();}},
                "visible": function(){return !!self.card.provisionalTileViewModel && !self.card.provisionalTileViewModel.tileIsFullyProvisional() && !!self.card.isWritable && self.card.newTile.dirty();},
                "disabled": ko.computed(function(){return !self.card.isWritable; })
            },
            {
                "label": "Save Alt",
                "classes": "btn btn-shim btn-labeled btn-lg fa fa-plus",
                "onClick": function(){
                    var card = self.card();
                    if (card) self.saveTile();
                },
                "visible": function(){return !!self.card.newTile ? !!self.card.newTile.tileid : false;},
                "disabled": ko.computed(function(){
                    var card = self.card();
                    if (!card) return false;
                    return !card.isWritable;
                })
            },
            {
                "label": "Add Alt",
                "classes": "btn btn-shim btn-labeled btn-lg btn-mint fa fa-plus",
                "onClick": function(){
                    var card = self.card();
                    if (card) self.saveTile();
                },
                "visible": function(){return !!self.card.newTile ? !self.card.newTile.tileid : true;},
                "disabled": ko.computed(function(){
                    var card = self.card();
                    if (!card) return false;
                    return !card.isWritable;
                })
            }
        ];
        self.getJSON();

    }

    ko.components.register('alt-buttons', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/new-tile-step.htm' }
    });
    return viewModel;
});
