define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/workflow-step',
    'views/components/workflows/review-dataset/select-dataset',
    'views/components/workflows/review-dataset/review-dataset-final-step',
    'views/components/workflows/upload-dataset/file-interpretation-step',
], function(ko, $, arches, Workflow) {
    return ko.components.register('review-dataset-workflow', {
        viewModel: function(params) {
            this.componentName = 'review-dataset-workflow';

            this.stepConfig = [
                {
                    title: 'Datasets',
                    name: 'select-datasets', /* unique to workflow */
                    required: true,
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'select-dataset',
                                    uniqueInstanceName: 'select-dataset-instances', /* unique to step */
                                    tilesManaged: 'none',
                                    parameters: {
                                        graphids: [
                                            '9519cb4f-b25b-11e9-8c7b-a4d18cec433a',  /* physical thing */
                                        ],
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'File Interpretation',
                    name: 'file-interpretation',
                    required: false,
                    workflowstepclass: 'upload-dataset-step-workflow-component-based-step',
                    hiddenWorkflowButtons: ['undo', 'save'],
                    informationboxdata: {
                        heading: 'Add interpretations for the uploaded dataset',
                        text: 'Select a file from the dataset, select a reader if necessary, and add any special parameters/interpreation for the individual dataset file',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'file-interpretation-step',
                                    uniqueInstanceName: 'file-interpretation', /* unique to step */
                                    parameters: {
                                        activeTab: 'edit',
                                        datasetInfo: "['select-datasets']['dataset-select-instance']['digitalResources']"
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Summary',
                    name: 'review-dataset-complete', /* unique to workflow */
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'review-dataset-final-step',
                                    uniqueInstanceName: 'review-dataset-final',
                                    tilesManaged: 'none',
                                    parameters: {
                                        sampleObjectResourceInstanceId: "['select-datasets']['select-dataset-instances']['resourceid']",
                                        selectedDatasets: "['select-datasets']['select-dataset-instances']['digitalResources']"
                                    },
                                },
                            ], 
                        },
                    ],
                },
            ];

            Workflow.apply(this, [params]);
        },
        template: { require: 'text!templates/views/components/plugins/review-dataset-workflow.htm' }
    });
});
