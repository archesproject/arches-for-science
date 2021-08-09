define([
    'jquery',
    'knockout',
    'arches',
], function($, ko, arches) {
    function viewModel(params) {
        this.value = params.value;
    };

    ko.components.register('dataset-step', {
        viewModel: viewModel,
        template: {
            require: 'text!templates/views/components/workflows/upload-dataset/dataset-step.htm'
        }
    });
});