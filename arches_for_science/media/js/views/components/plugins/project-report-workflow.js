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
                    title: arches.translations.selectProject,
                    name: 'select-project',
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
                    title: arches.translations.selectTemplate,
                    name: 'select-report-template',
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
                    title: arches.translations.addAnnotations,
                    name: 'add-annotations',
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'views/components/workflows/project-workflow-report/add-annotations',
                                    uniqueInstanceName: 'add-annotations',
                                    tilesManaged: 'none',
                                    parameters: {
                                        projectId: "['select-project']['select-project']['project']",
                                        physicalThings: "['select-project']['select-project']['physicalThings']",
                                    }
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: arches.translations.selectFiles,
                    name: 'download-project-files',
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'download-project-files',
                                    uniqueInstanceName: 'download-project-files',
                                    tilesManaged: 'none',
                                    parameters: {
                                        projectId: "['select-project']['select-project']['project']",
                                        physicalThings: "['select-project']['select-project']['physicalThings']",
                                    }
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: arches.translations.downloadReport,
                    name: 'download-report',
                    lockableExternalSteps: ['select-project'],
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
                                        physicalThingIds: "['select-project']['select-project']['physicalThings']",
                                        annotationStepData: "['add-annotations']['add-annotations']",
                                        projectFiles: "['download-project-files']['download-project-files']['files']",
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
