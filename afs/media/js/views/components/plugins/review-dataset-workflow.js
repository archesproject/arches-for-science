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
                    title: 'Object',
                    name: 'review-dataset-object',  /* unique to workflow */
                    required: true,
                    layoutSections: [
                        {
                            sectionTitle: 'Select an Object',
                            componentConfigs: [
                                { 
                                    componentName: 'resource-instance-select-widget',
                                    uniqueInstanceName: 'sample-object-resource-instance', /* unique to step */
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
                    title: 'Datasets',
                    name: 'select-datasets', /* unique to workflow */
                    required: true,
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'select-dataset',
                                    uniqueInstanceName: 'dataset-select-instance', /* unique to step */
                                    tilesManaged: 'none',
                                    parameters: {
                                        graphids: [
                                            '9519cb4f-b25b-11e9-8c7b-a4d18cec433a',  /* physical thing */
                                        ],
                                        physicalThingResourceId: "['review-dataset-object']['sample-object-resource-instance'][0][1]"
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'File Interpretation',
                    name: 'file-interpretation',
                    required: true,
                    workflowstepclass: 'upload-dataset-step-workflow-component-based-step',
                    informationboxdata: {
                        heading: 'Select the instrument used for the analysis',
                        text: 'Select the instrument, add any special parameters/configuration for the instrument, and upload the dataset files',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'file-interpretation-step',
                                    uniqueInstanceName: 'file-interpretation', /* unique to step */
                                    parameters: {
                                        activeTab: 'edit',
                                        datasetInfo: "['select-datasets']"
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
                                        sampleObjectResourceInstanceId: "['review-datasets-object']['sample-object-resource-instance'][0][1]",
                                        selectedDatasets: "['select-datasets']['dataset-select-instance'][0][1]"
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
