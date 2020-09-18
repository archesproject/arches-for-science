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
                "onClick": function(cardComp){if (ko.unwrap(cardComp.loading) !== true) cardComp.deleteTile();},
                "visible": function(cardComp){return !!cardComp.tile ? !!cardComp.tile.tileid && !!cardComp.deleteTile : false;}
            },
            {
                "label": "Cancel Alt",
                "classes": "btn btn-shim btn-danger btn-labeled btn-lg fa fa-times",
                "onClick": function(cardComp){if (cardComp.tile && ko.unwrap(cardComp.loading) !== true) {cardComp.tile.reset();}},
                "visible": function(cardComp){return !!cardComp.provisionalTileViewModel && !cardComp.provisionalTileViewModel.tileIsFullyProvisional() && !!cardComp.card.isWritable && cardComp.tile.dirty();}
            },
            {
                "label": "Save Alt",
                "classes": "btn btn-shim btn-labeled btn-lg fa fa-plus",
                "onClick": function(cardComp){if (ko.unwrap(cardComp.loading) !== true) cardComp.saveTile();},
                "visible": function(cardComp){return !!cardComp.tile ? !!cardComp.tile.tileid : false;}
            },
            {
                "label": "Add Alt",
                "classes": "btn btn-shim btn-labeled btn-lg btn-mint fa fa-plus",
                "onClick": function(cardComp){if (ko.unwrap(cardComp.loading) !== true) cardComp.saveTile();},
                "visible": function(cardComp){return !!cardComp.tile ? !cardComp.tile.tileid : true;}
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
