define([
    'underscore',
    'knockout',
    'views/components/workflows/new-tile-step'
], function(_, ko, NewTileStep) {

    function viewModel(params) {
        params.getJSONOnLoad = ko.observable(false);
        NewTileStep.apply(this, [params]);
        var self = this;
        params.hideDefaultButtons = ko.observable(true);
        params.altButtons = [
            {
                "label": "Delete Alt",
                "classes": "btn btn-shim btn-labeled btn-lg fa fa-trash",
                "onClick": function(){if (ko.unwrap(self.card.loading) !== true) self.card.deleteTile();},
                "visible": function(){return !!self.card.tile ? !!self.card.tile.tileid && !!self.card.deleteTile : false;}
            },
            {
                "label": "Cancel Alt",
                "classes": "btn btn-shim btn-danger btn-labeled btn-lg fa fa-times",
                "onClick": function(){if (self.card.tile && ko.unwrap(self.card.loading) !== true) {self.card.tile.reset();}},
                "visible": function(){return !!self.card.provisionalTileViewModel && !self.card.provisionalTileViewModel.tileIsFullyProvisional() && !!self.card.card.isWritable && self.card.tile.dirty();}
            },
            {
                "label": "Save Alt",
                "classes": "btn btn-shim btn-labeled btn-lg fa fa-plus",
                "onClick": function(){if (ko.unwrap(self.card.loading) !== true) self.card.saveTile();},
                "visible": function(){return !!self.card.tile ? !!self.card.tile.tileid : false;}
            },
            {
                "label": "Add Alt",
                "classes": "btn btn-shim btn-labeled btn-lg btn-mint fa fa-plus",
                "onClick": function(){if (ko.unwrap(self.card.loading) !== true) self.card.saveTile();},
                "visible": function(){return !!self.card.tile ? !self.card.tile.tileid : true;}
            }
        ];
        self.getJSON();

    }

    ko.components.register('shim-buttons', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/new-tile-step.htm' }
    });
    return viewModel;
});
