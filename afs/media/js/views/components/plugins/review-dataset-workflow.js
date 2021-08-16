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
            var self = this;

            this.resourceId = ko.observable();

            params.steps = [
                {
                    title: 'Object',
                    name: 'review-dataset-object',  /* unique to workflow */
                    description: 'Preliminary information about this physical thing',
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                    shouldtrackresource: true,
                    wastebin: {resources:[]},
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
                    description: 'Select a dataset from the Physical Thing selected in the previous step',
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    graphid: '9519cb4f-b25b-11e9-8c7b-a4d18cec433a',
                    nodegroupid: '8a4ad932-8d59-11eb-a9c4-faffc265b501',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                    shouldtrackresource: true,
                    externalstepdata: { 
                        selectobjectstep: 'review-dataset-object',
                    },
                    layoutSections: [
                        {
                            // sectionTitle: 'Select an Object',
                            componentConfigs: [
                                { 
                                    componentName: 'select-dataset',
                                    uniqueInstanceName: 'dataset-select-instance', /* unique to step */
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
                    description: 'The date that the sample was taken',
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    workflowstepclass: 'upload-dataset-step-workflow-component-based-step',
                    autoAdvance: false,
                    informationboxdata: {
                        heading: 'Select the instrument used for the analysis',
                        text: 'Select the instrument, add any special parameters/configuration for the instrument, and upload the dataset files',
                    },
                    required: true,
                    externalstepdata: {
                        datasetinfo: 'select-datasets'
                    },
                    layoutSections: [
                        {
                            sectionTitle: null,
                            componentConfigs: [
                                { 
                                    componentName: 'file-interpretation-step',
                                    uniqueInstanceName: 'file-interpretation', /* unique to step */
                                    parameters: {
                                        renderContext: 'workflow',
                                        activeTab: 'edit'
                                    },
                                    required: true,
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Summary',
                    name: 'review-dataset-complete', /* unique to workflow */
                    description: 'Upload a file to this digital resource',
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    graphid: '9519cb4f-b25b-11e9-8c7b-a4d18cec433a',
                    nodegroupid: '8a4ad932-8d59-11eb-a9c4-faffc265b501',
                    externalstepdata: { 
                        selectobjectstep: 'review-dataset-object',
                        selecteddatasets: 'select-datasets',
                        
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'review-dataset-final-step',
                                    uniqueInstanceName: 'review-dataset-final',
                                    tilesManaged: 'none',
                                    parameters: {
                                    },
                                },
                            ], 
                        },
                    ],
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true
                },
            ];

            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
            self.getJSON('review-dataset-workflow');

            self.ready(true);
        },
        template: { require: 'text!templates/views/components/plugins/review-dataset-workflow.htm' }
    });
});
