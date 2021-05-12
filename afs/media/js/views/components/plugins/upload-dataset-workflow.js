define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/workflow-step',
    'views/components/file-upload',
    'views/components/workflows/upload-dataset/select-phys-thing-step'
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
                    autoAdvance: false,
                    informationboxdata: {
                        heading: 'Select the instrument used for the analysis',
                        text: 'Select the instrument, add any special parameters/configuration for the instrument, and upload the dataset files',
                    },
                    required: true,
                    layoutSections: [
                        {
                            sectionTitle: 'Instrument',
                            componentConfigs: [
                                { 
                                    componentName: 'resource-instance-select-widget',
                                    uniqueInstanceName: 'instrument-type', /* unique to step */
                                    parameters: {
                                        graphids: [
                                            'b6c819b8-99f6-11ea-a9b7-3af9d3b32b71', /* Instrument */
                                        ],
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
                    name: 'object-sample-location',
                    description: '',
                    component: 'views/components/workflows/upload-dataset/select-dataset-files-step',
                    componentname: 'select-dataset-files-step',
                    graphid: '707cbd78-ca7a-11e9-990b-a4d18cec433a',
                    nodegroupid: '',
                    hiddenNodes: [],
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true
                },
                {
                    title: 'File Interpretation',
                    name: 'fileinterpretation',
                    description: 'The date that the sample was taken',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '707cbd78-ca7a-11e9-990b-a4d18cec433a',
                    nodegroupid: '812c7086-9471-11ea-ae26-3af9d3b32b71',
                    hiddenNodes: [],
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false, // temporarily false for ease of development on other steps
                    // required: true,
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
