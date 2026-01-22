import ko from 'knockout';
import datasetStepTemplate from 'templates/views/components/workflows/upload-dataset/dataset-step.htm';

function viewModel(params) {
    this.value = params.value;
    this.locked = params.form.locked;
}

ko.components.register('dataset-step', {
    viewModel: viewModel,
    template: datasetStepTemplate
});

export default viewModel;