define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
], function(_, $, arches, ko, koMapping) {
    function viewModel(params) {
        var self = this;

        console.log("DS()D", params)

        this.foo = 'bar';
    };

    ko.components.register('workflow-manifest-manager', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/workflow-manifest-manager.htm' }
    });
    return viewModel;
});
