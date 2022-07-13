define([
    'knockout',
    'arches',
    'viewmodels/workflow',
    'views/components/workflows/project-report-workflow/project-report-select',
    'views/components/workflows/project-report-workflow/generate-report'
], function(ko, arches, Workflow) {
    return ko.components.register('project-report-workflow', {
        viewModel: function(params) {
            this.componentName = 'project-report-workflow';

            this.stepConfig = [
                {
                    title: 'Select Project',
                    name: 'select-project',
                    informationboxdata: {
                        heading: 'Select Project',
                        text: 'Select a project and report template to create a report',
                    },
                    required: true,
                    layoutSections: [
                        {
                            sectionTitle: 'Select Project',
                            componentConfigs: [
                                {
                                    componentName: 'project-report-select',
                                    uniqueInstanceName: 'select-project', /* unique to step */
                                    parameters: {
                                        projectGraphId: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a' /* Project */
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Generate Report',
                    name: 'generate-report',
                    lockableExternalSteps: ['select-project'],
                    informationboxdata: {
                        heading: 'Generate Report',
                        text: 'A report is being generated',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'generate-report',
                                    uniqueInstanceName: 'generate-report',
                                    tilesManaged: 'none',
                                    parameters: {
                                        templateId: "['select-project']['select-project']['template']",
                                        projectId: "['select-project']['select-project']['project']"
                                    }
                                },
                            ], 
                        },
                    ],
                }
            ];

            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
        },
        template: { require: 'text!templates/views/components/plugins/project-report-workflow.htm' }
    });
});
