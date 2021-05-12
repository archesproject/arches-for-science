define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'views/components/plugins/manifest-manager',
], function(_, $, arches, ko, koMapping) {
    function viewModel(params) {
        var self = this;

        this.isManifestManagerHidden = ko.observable(true);

        this.initialize = function() {};

        this.toggleManifestManagerHidden = function() {
            self.isManifestManagerHidden(!self.isManifestManagerHidden());
        };

        this.initialize();
    }

    ko.components.register('workflow-manifest-manager', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/workflow-manifest-manager.htm' }
    });
    return viewModel;
});
