define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/workflow-step',
    'views/components/file-upload',
    'views/components/workflows/select-phys-thing-step',
    'views/components/workflows/upload-dataset/instrument-info-step',
    'views/components/workflows/upload-dataset/file-interpretation-step',
    'views/components/workflows/upload-dataset/select-dataset-files-step',
], function(ko, $, arches, Workflow) {
    return ko.components.register('upload-dataset-workflow', {
        viewModel: function(params) {
            var self = this;
            params.steps = [
                {
                    title: 'Project Info',
                    name: 'project-info',
                    description: 'Information about the Project',
                    informationboxdata: {
                        heading: 'Workflow Step: Project and related object',
                        text: 'Select the project and object that you\'re sampling',
                    },
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    autoAdvance: true,
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
                                    required: true,
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Instrument',
                    name: 'select-instrument-and-files',
                    description: 'Select the instrument and corresponding files',
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    autoAdvance: true,
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
                                    required: true,
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Sample Location',
                    name: 'select-dataset-files-step',
                    description: '',
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    required: true,
                    workflowstepclass: 'upload-dataset-step-workflow-component-based-step',
                    autoAdvance: false,
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
                                    required: true,
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
                                    },
                                    required: true,
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Summary',
                    description: 'Choose an option below',
                    component: '',
                    componentname: '',
                    graphid: '707cbd78-ca7a-11e9-990b-a4d18cec433a',
                    nodegroupid: '',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null
                }
            ];
            
            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
            self.getJSON('upload-dataset-workflow');

            self.ready(true);
        },
        template: { require: 'text!templates/views/components/plugins/upload-dataset-workflow.htm' }
    });
});
