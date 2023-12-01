define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/alert',
    'templates/views/components/plugins/add-chemical-analysis-images-workflow.htm',
    'viewmodels/workflow-step',
    'views/components/workflows/select-observation-step',
    'views/components/workflows/add-chemical-analysis-images-workflow/add-chemical-analysis-images-image-step',
    'views/components/workflows/add-chemical-analysis-images-workflow/add-chemical-analysis-images-final-step',
], function(ko, $, arches, Workflow, AlertViewModel, analysisAreasWorkflowTemplate) {
    return ko.components.register('add-chemical-analysis-images-workflow', {
        viewModel: function(params) {
            this.componentName = 'add-chemical-analysis-images-workflow';

            this.stepConfig = [
                {
                    title: 'Project Info',
                    name: 'select-project',  /* unique to workflow */
                    required: true,
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'select-observation-step',
                                    uniqueInstanceName: 'select-observation', /* unique to step */
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Image',
                    name: 'image-step', /* unique to workflow */
                    required: true,
                    lockableExternalSteps: ['select-project'],
                    layoutSections: [
                        {
                            sectionTitle: 'Image Service',
                            componentConfigs: [
                                { 
                                    componentName: 'add-chemical-analysis-images-image-step',
                                    uniqueInstanceName: 'image-service-instance', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '707cbd78-ca7a-11e9-990b-a4d18cec433a',  /* Digital Resources */
                                        physicalThingResourceId: "['select-project']['select-observation']['physicalThingResourceId']",
                                        observationResourceId: "['select-project']['select-observation']['observation']"
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Summary',
                    name: 'add-chemical-analysis-images-complete',  /* unique to workflow */
                    description: 'Summary',
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'add-chemical-analysis-images-final-step',
                                    uniqueInstanceName: 'add-chemical-analysis-images-final',
                                    tilesManaged: 'none',
                                    parameters: {
                                        observationResourceId: "['select-project']['select-observation']['observation']",
                                        relatedProjectData: "['select-project']['select-observation']",
                                        imageStepData: "['image-step']['image-service-instance'][0]['data']",
                                        digitalResourcesIds: "['image-step']['image-service-instance']['digitalResourcesIds']",
                                        manifestResourceId: "['image-step']['image-service-instance']['manifestResourceId']",
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
                        'Are you sure you would like to delete this workflow?',
                        'All data created during the course of this workflow will be deleted.',
                        function(){}, //does nothing when canceled
                        () => {
                            params.loading('Cleaning up...');
                            this.reverseWorkflowTransactions();
                        },
                    )
                );
            };
            
            this.quitUrl = arches.urls.plugin('init-workflow');
        },
        template: analysisAreasWorkflowTemplate
    });
});
