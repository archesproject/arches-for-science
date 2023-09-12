define([
    'knockout',
    'arches',
    'viewmodels/workflow',
    'templates/views/components/plugins/project-report-workflow.htm',
    'views/components/workflows/project-report-workflow/project-report-select',
    'views/components/workflows/project-report-workflow/report-template-select',
    'views/components/workflows/project-report-workflow/download-report',
    'views/components/workflows/project-report-workflow/download-project-files',
    'views/components/workflows/project-report-workflow/add-annotations'
], function(ko, arches, Workflow, projectReportWorkflow) {
    return ko.components.register('project-report-workflow', { 
        viewModel: function(params) {
            this.componentName = 'project-report-workflow';

            this.stepConfig = [
                {
                    title: 'Select Project',
                    name: 'select-project',
                    informationboxdata: {
                        heading: 'Select Project',
                        text: 'Select a project to create a report',
                    },
                    required: true,
                    layoutSections: [
                        {
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
                    title: 'Select Template',
                    name: 'select-report-template',
                    informationboxdata: {
                        heading: 'Select Template',
                        text: 'Select a report template to create a report',
                    },
                    required: true,
                    layoutSections: [
                        {
                            componentConfigs: [
                                {
                                    componentName: 'report-template-select',
                                    uniqueInstanceName: 'select-template', /* unique to step */
                                    tilesManaged: 'none',
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Add Annotations',
                    name: 'add-annotations',
                    informationboxdata: {
                        heading: 'Add Annotations',
                        text: 'Add Annotations to the Report',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'views/components/workflows/project-workflow-report/add-annotations',
                                    uniqueInstanceName: 'add-annotations',
                                    tilesManaged: 'none',
                                    parameters: {
                                        projectId: "['select-project']['select-project']['project']"
                                    }
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Download Files',
                    name: 'download-project-files',
                    informationboxdata: {
                        heading: 'Download Files',
                        text: 'Download from a list of files related to the project',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'download-project-files',
                                    uniqueInstanceName: 'download-project-files',
                                    tilesManaged: 'none',
                                    parameters: {
                                        projectId: "['select-project']['select-project']['project']",
                                    }
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Download Report',
                    name: 'download-report',
                    lockableExternalSteps: ['select-project'],
                    informationboxdata: {
                        heading: 'Download Report',
                        text: 'A report is being generated',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'download-report',
                                    uniqueInstanceName: 'download-report',
                                    tilesManaged: 'none',
                                    parameters: {
                                        templates: "['select-report-template']['select-template']['templates']",
                                        projectId: "['select-project']['select-project']['project']",
                                        physicalThings: "['add-annotations']['add-annotations']['physicalThings']",
                                        projectRelations: "['add-annotations']['add-annotations']['projectRelations']",
                                        annotationScreenshots: "['add-annotations']['add-annotations']['screenshots']"
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
        template: projectReportWorkflow 
    });
});
