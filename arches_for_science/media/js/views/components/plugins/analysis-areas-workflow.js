define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/alert',
    'templates/views/components/plugins/analysis-areas-workflow.htm',
    'viewmodels/workflow-step',
    'views/components/workflows/select-phys-thing-step',
    'views/components/workflows/analysis-areas-workflow/analysis-areas-image-step',
    'views/components/workflows/analysis-areas-workflow/analysis-areas-annotation-step',
    'views/components/workflows/analysis-areas-workflow/analysis-areas-final-step',
], function(ko, $, arches, Workflow, AlertViewModel, analysisAreasWorkflowTemplate) {
    return ko.components.register('analysis-areas-workflow', {
        viewModel: function(params) {
            this.componentName = 'analysis-areas-workflow';

            this.stepConfig = [
                {
                    title: arches.translations.projectInfo,
                    name: 'select-project',  /* unique to workflow */
                    required: true,
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'select-phys-thing-step',
                                    uniqueInstanceName: 'select-phys-thing', /* unique to step */
                                    parameters: {
                                        graphids: [
                                            '9519cb4f-b25b-11e9-8c7b-a4d18cec433a', /* Project */
                                            '0b9235d9-ca85-11e9-9fa2-a4d18cec433a'/* Physical Thing */
                                        ],  
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: arches.translations.image,
                    name: 'image-step', /* unique to workflow */
                    required: true,
                    lockableExternalSteps: ['select-project'],
                    layoutSections: [
                        {
                            sectionTitle: arches.translations.imageService,
                            componentConfigs: [
                                { 
                                    componentName: 'analysis-areas-image-step',
                                    uniqueInstanceName: 'image-service-instance', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '707cbd78-ca7a-11e9-990b-a4d18cec433a',  /* Digital Resources */
                                        physicalThingResourceId: "['select-project']['select-phys-thing']['physicalThing']"
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: arches.translations.regions,
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
                                        physicalThingResourceId: "['select-project']['select-phys-thing']['physicalThing']",
                                        projectResourceId: "['select-project']['select-phys-thing']['project']",
                                        imageStepData: "['image-step']['image-service-instance'][0]['data']",
                                        projectSet: "['select-project']['select-phys-thing']['projectSet']"
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: arches.translations.summary,
                    name: 'analysis-areas-complete',  /* unique to workflow */
                    description: arches.translations.summary,
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'analysis-areas-final-step',
                                    uniqueInstanceName: 'analysis-areas-final',
                                    tilesManaged: 'none',
                                    parameters: {
                                        sampleObjectResourceId: "['select-project']['select-phys-thing']['physicalThing']",
                                        relatedProjectData: "['select-project']['select-phys-thing']",
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
