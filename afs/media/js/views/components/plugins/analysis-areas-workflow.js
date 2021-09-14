define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/workflow-step',
    'views/components/workflows/analysis-areas-workflow/analysis-areas-image-step',
    'views/components/workflows/analysis-areas-workflow/analysis-areas-annotation-step',
    'views/components/workflows/analysis-areas-workflow/analysis-areas-final-step',
], function(ko, $, arches, Workflow) {
    return ko.components.register('analysis-areas-workflow', {
        viewModel: function(params) {
            this.componentName = 'analysis-areas-workflow';

            this.stepConfig = [
                {
                    title: 'Object',
                    name: 'object-step', /* unique to workflow */
                    required: true,
                    informationboxdata: {
                        heading: 'Workflow Goal: Record Locations and Regions of Interest',
                        text: `
                            Regions of interest are the areas on a physical object (whole object or sample) in which a measurement -- whether non-invasive or minimally invasive -- was performed.
                            To be meaningful, you need to describe the location or region of a physical object that is being described/measured.
                            This workflow will guide you through the steps to document the location of your regions of interest.
                        `,
                    },
                    layoutSections: [
                        {
                            sectionTitle: 'Object or Sample',
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
                    title: 'Image',
                    name: 'image-step', /* unique to workflow */
                    required: true,
                    informationboxdata: {
                        heading: 'Image Services',
                        text: `
                            Image Services provide you with picture(s) of an object, often from multiple vantage points, that can be annotated to indicate the location or region of an observation. 
                            If you wish, you can upload photographs and automatically create a new image service to document the location of your observations of an object.
                        `,
                    },
                    lockableExternalSteps: ['object-step'],
                    layoutSections: [
                        {
                            sectionTitle: 'Image Service',
                            componentConfigs: [
                                { 
                                    componentName: 'analysis-areas-image-step',
                                    uniqueInstanceName: 'image-service-instance', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '707cbd78-ca7a-11e9-990b-a4d18cec433a',  /* Digital Resources */
                                        physicalThingResourceId: "['object-step']['sample-object-resource-instance']"
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Regions',
                    name: 'regions-step', /* unique to workflow */
                    required: true,
                    workflowstepclass: 'analysis-areas-workflow-regions-step',
                    lockableExternalSteps: ['image-step'],
                    hiddenWorkflowButtons: ['undo', 'save'],
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'analysis-areas-annotation-step',
                                    uniqueInstanceName: 'annotation-instance', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '9519cb4f-b25b-11e9-8c7b-a4d18cec433a',  /* physical thing */
                                        physicalThingResourceId: "['object-step']['sample-object-resource-instance']",
                                        imageStepData: "['image-step']['image-service-instance'][0]['data']"
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Summary',
                    name: 'analysis-areas-complete',  /* unique to workflow */
                    description: 'Summary',
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'analysis-areas-final-step',
                                    uniqueInstanceName: 'analysis-areas-final',
                                    tilesManaged: 'none',
                                    parameters: {
                                        sampleObjectResourceId: "['object-step']['sample-object-resource-instance']",
                                        regionsStepData: "['regions-step']['annotation-instance']",
                                        imageStepData: "['image-step']['image-service-instance'][0]['data']",
                                        digitalReferenceResourceId: "['image-step']['image-service-instance'][0]['resourceinstance_id']"
                                    },
                                },
                            ], 
                        },
                    ],
                }
            ];

            Workflow.apply(this, [params]);
        },
        template: { require: 'text!templates/views/components/plugins/analysis-areas-workflow.htm' }
    });
});
