define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/workflow-step',
    'views/components/file-upload',
    'views/components/workflows/select-phys-thing-step',
    'views/components/workflows/upload-dataset/dataset-step',
    'views/components/workflows/upload-dataset/instrument-info-step',
    'views/components/workflows/upload-dataset/file-interpretation-step',
    'views/components/workflows/upload-dataset/select-dataset-files-step',
], function(ko, $, arches, Workflow) {
    return ko.components.register('upload-dataset-workflow', {
        viewModel: function(params) {
            this.componentName = 'upload-dataset-workflow';
            this.v2 = true;

            var sampleLocationStep = {
                title: 'Sample Location',
                name: 'select-dataset-files-step',
                required: true,
                workflowstepclass: 'upload-dataset-step-workflow-component-based-step',
                lockableExternalSteps: ['select-instrument-and-files'],
                externalstepdata: {
                    projectinfo: 'project-info',
                    observationinfo: 'select-instrument-and-files',
                },
                layoutSections: [
                    {
                        sectionTitle: null,
                        componentConfigs: [
                            { 
                                componentName: 'select-dataset-files-step',
                                uniqueInstanceName: 'select-dataset-files-step', /* unique to step */
                                parameters: {
                                    renderContext: 'workflow',
                                },
                            },
                        ], 
                    },
                ],
            };

            this.stepConfig = [
                {
                    title: 'Dataset',
                    name: 'dataset-step', /* unique to workflow */
                    required: true,
                    layoutSections: [
                        {
                            sectionTitle: 'Dataset Type',
                            componentConfigs: [
                                { 
                                    componentName: 'dataset-step',
                                    uniqueInstanceName: 'dataset-step', /* unique to step */
                                    tilesManaged: 'none',
                                    parameters: {},
                                },
                            ], 
                        },
                    ],
                    stepInjectionConfig: {
                        defaultStepChoice: null,  /* optional param to show tab on new workflow creation */ 
                        stepNameToInjectAfter: function(step) {  /* step = self-introspection */ 
                            return 'select-instrument-and-files';
                        },
                        injectionLogic: function(step) {  /* step = self-introspection */ 
                            if (step.value() && step.value()['dataset-step'][0][1] === 'non-destructive') {
                                return sampleLocationStep;
                            }
                        }
                    },
                },
                {
                    title: 'Project Info',
                    name: 'project-info',
                    description: 'Information about the Project',
                    informationboxdata: {
                        heading: 'Workflow Step: Project and related object',
                        text: 'Select the project and object that you\'re sampling',
                    },
                    required: true,
                    layoutSections: [
                        {
                            sectionTitle: null,
                            componentConfigs: [
                                { 
                                    componentName: 'select-phys-thing-step',
                                    uniqueInstanceName: 'select-phys-thing-step', /* unique to step */
                                    parameters: {
                                        graphids: [
                                            '9519cb4f-b25b-11e9-8c7b-a4d18cec433a', /* Project */
                                            '0b9235d9-ca85-11e9-9fa2-a4d18cec433a'/* Physical Thing */
                                        ],
                                        validateThing: true,
                                        renderContext: 'workflow',
                                        value: null
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Instrument',
                    name: 'select-instrument-and-files',
                    componentname: 'component-based-step',
                    informationboxdata: {
                        heading: 'Select the instrument used for the analysis',
                        text: 'Select the instrument, add any special parameters/configuration for the instrument, and upload the dataset files',
                    },
                    required: true,
                    lockableExternalSteps: ['project-info'],
                    externalstepdata: {
                        projectinfo: 'project-info',
                    },
                    layoutSections: [
                        {
                            sectionTitle: null,
                            componentConfigs: [
                                { 
                                    componentName: 'instrument-info-step',
                                    uniqueInstanceName: 'instrument-info', /* unique to step */
                                    parameters: {
                                        renderContext: 'workflow',
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
                        projectinfo: 'project-info',
                        datasetinfo: 'select-dataset-files-step'
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
                                },
                            ], 
                        },
                    ],
                },
                // {
                //     title: 'Summary',
                //     description: 'Choose an option below',
                //     graphid: '707cbd78-ca7a-11e9-990b-a4d18cec433a',
                //     nodegroupid: '',
                //     resourceid: null,
                //     tileid: null,
                //     parenttileid: null
                // }
            ];
            
            Workflow.apply(this, [params]);
        },
        template: { require: 'text!templates/views/components/plugins/upload-dataset-workflow.htm' }
    });
});
