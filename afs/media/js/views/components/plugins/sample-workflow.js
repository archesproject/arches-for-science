define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/workflow-step'
], function(ko, $, arches, Workflow) {
    return ko.components.register('sample-workflow', {
        viewModel: function(params) {
            var self = this;

            params.steps = [
                {
                    title: 'Project Info',
                    name: 'project-info', /* unique to workflow */
                    description: 'Information about the Project',
                    informationboxdata: {
                        heading: 'Workflow Step: Project and related object',
                        text: 'Select the project and object that you\'re sampling',
                    },
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    autoAdvance: false,
                    required: true,
                    layoutSections: [
                        {
                            sectionTitle: 'Project',
                            componentConfigs: [
                                { 
                                    componentName: 'resource-instance-select-widget',
                                    uniqueInstanceName: 'project-resource-instance', /* unique to step */
                                    parameters: {
                                        graphids: [
                                            '0b9235d9-ca85-11e9-9fa2-a4d18cec433a', /* Activity */
                                        ],
                                        renderContext: 'workflow',
                                    },
                                    required: true,
                                },
                            ], 
                        },
                        {
                            sectionTitle: 'Sampled Object',
                            componentConfigs: [
                                { 
                                    componentName: 'resource-instance-select-widget',
                                    uniqueInstanceName: 'sample-object-resource-instance', /* unique to step */
                                    parameters: {
                                        graphids: [
                                            '615b11ee-c457-11e9-910c-a4d18cec433a', /* Observation */
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
                    title: 'Project Info',
                    name: 'project-info-2', /* unique to workflow */
                    description: 'Information about the Project',
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    required: true,
                    layoutSections: [
                        {
                            sectionTitle: 'FOOBAR',
                            componentConfigs: [
                                { 
                                    componentName: 'resource-instance-select-widget',
                                    uniqueInstanceName: 'project-resource-instance', /* unique to step */
                                    parameters: {
                                        graphids: [
                                            '0b9235d9-ca85-11e9-9fa2-a4d18cec433a', /* Activity */
                                        ],
                                        renderContext: 'workflow',
                                    },
                                    required: true,
                                },
                            ], 
                        },
                    ],
                },
            ];

            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
            self.getJSON('sample-workflow');

            self.ready(true);
        },
        template: { require: 'text!templates/views/components/plugins/sample-workflow.htm' }
    });
});
