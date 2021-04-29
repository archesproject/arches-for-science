define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
], function(_, $, arches, ko, koMapping) {
    function viewModel(params) {
        var self = this;

        this.manifestManagerUrl = arches.urls.plugin('image-service-manager');
        
        this.isManifestManagerHidden = ko.observable(true);

        this.initialize = function() {};

        this.toggleManifestManagerHidden = function() {
            self.isManifestManagerHidden(!self.isManifestManagerHidden());
        };

        this.initialize();
    };

    ko.components.register('workflow-manifest-manager', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/workflow-manifest-manager.htm' }
    });
    return viewModel;
});
