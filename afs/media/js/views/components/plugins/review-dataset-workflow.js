define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/workflow-step',
    'views/components/workflows/review-dataset/select-dataset',
    'views/components/workflows/review-dataset/review-dataset-final-step',
], function(ko, $, arches, Workflow) {
    return ko.components.register('review-dataset-workflow', {
        viewModel: function(params) {
            this.componentName = 'review-dataset-workflow';

            this.stepConfig = [
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
                // {
                //     title: 'File Interpretation',
                //     name: 'physical-thing-type', /* unique to workflow */
                //     description: 'Preliminary information about this physical thing',
                //     component: 'views/components/workflows/new-tile-step',
                //     componentname: 'new-tile-step',
                //     graphid: '9519cb4f-b25b-11e9-8c7b-a4d18cec433a',
                //     nodegroupid: '8ddfe3ab-b31d-11e9-aff0-a4d18cec433a',
                //     resourceid: null,
                //     tileid: null,
                //     parenttileid: null,
                //     required: true
                // },
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
        },
        template: { require: 'text!templates/views/components/plugins/review-dataset-workflow.htm' }
    });
});
