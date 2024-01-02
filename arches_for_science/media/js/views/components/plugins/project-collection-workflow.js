define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/alert',
    'templates/views/components/plugins/project-collection-workflow.htm',
    'viewmodels/workflow-step',
    'views/components/workflows/select-phys-thing-step',
    'views/components/workflows/create-project-workflow/add-things-step',
    'views/components/workflows/project-collection-workflow/project-collection-final-step'
], function(ko, $, arches, Workflow, AlertViewModel, projectCollectionWorkflowTemplate) {
    return ko.components.register('project-collection-workflow', {
        viewModel: function(params) {
            this.componentName = 'project-collection-workflow';

            this.stepConfig = [
                {
                    title: arches.translations.selectProject,
                    name: 'select-project',  /* unique to workflow */
                    required: true,
                    layoutSections: [
                        {
                            sectionTitle: arches.translations.selectProject,
                            componentConfigs: [
                                {
                                    componentName: 'resource-instance-select-widget',
                                    uniqueInstanceName: 'select-project', /* unique to step */
                                    parameters: {
                                        graphids: [
                                            '0b9235d9-ca85-11e9-9fa2-a4d18cec433a'/* Project */
                                        ],
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: arches.translations.addObjects,
                    name: 'object-search-step',  /* unique to workflow */
                    required: true,
                    workflowstepclass: 'create-project-add-things-step',
                    lockableExternalSteps: ['select-project'],
                    layoutSections: [
                        {
                            componentConfigs: [
                                {
                                    componentName: 'add-things-step',
                                    uniqueInstanceName: 'add-phys-things',
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '1b210ef3-b25c-11e9-a037-a4d18cec433a', //Collection graph
                                        nodegroupid: '466f81d4-c451-11e9-b7c9-a4d18cec433a', //Curation in Collection
                                        nodeid: '466fa421-c451-11e9-9a6d-a4d18cec433a', //Curation_used in Collection (physical thing)
                                        resourceid: "['select-project']['select-project']",
                                        action: "update",
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    title: arches.translations.summary,
                    name: 'project-collection-complete',  /* unique to workflow */
                    description: arches.translations.summary,
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'project-collection-final-step',
                                    uniqueInstanceName: 'project-collection-final',
                                    tilesManaged: 'none',
                                    parameters: {
                                        projectResourceId: "['select-project']['select-project']",
                                        resourceid: "['object-search-step']['add-phys-things'][0]['collectionResourceId']",
                                    },
                                },
                            ], 
                        },
                    ],
                }
            ];

            Workflow.apply(this, [params]);

            this.reverseWorkflowTransactions = function() {
                const quitUrl = this.quitUrl;
                return $.ajax({
                    type: "POST",
                    url: arches.urls.transaction_reverse(this.id())
                }).then(function() {
                    params.loading(false);
                    window.location.href = quitUrl;
                });
            };

            this.quitWorkflow = function(){
                this.alert(
                    new AlertViewModel(
                        'ep-alert-red',
                        arches.translations.deleteWorkflowTitle,
                        arches.translations.deleteWorkflowWarning,
                        function(){}, //does nothing when canceled
                        () => {
                            params.loading(arches.translations.cleaningUp);
                            this.reverseWorkflowTransactions()
                        },
                    )
                );
            };

            this.quitUrl = arches.urls.plugin('init-workflow');
        },
        template: projectCollectionWorkflowTemplate
    });
});
