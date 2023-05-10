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
                    informationboxdata: {
                        heading: 'Workflow Goal: Record Locations and Regions of Interest',
                        text: `
                            Regions of interest are the areas on a physical object (whole object or sample) in which a measurement -- whether non-invasive or minimally invasive -- was performed.
                            To be meaningful, you need to describe the location or region of a physical object that is being described/measured.
                            This workflow will guide you through the steps to document the location of your regions of interest.
                        `,
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'select-observation-step',
                                    uniqueInstanceName: 'select-observation', /* unique to step */
                                    parameters: {
                                        graphids: [
                                            '615b11ee-c457-11e9-910c-a4d18cec433a', /* Observation */
                                            '0b9235d9-ca85-11e9-9fa2-a4d18cec433a'/* Project */
                                        ],  
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Image',
                    name: 'image-step', /* unique to workflow */
                    required: true,
                    informationboxdata: {
                        heading: 'Image Services',
                        text: `
                            Image Services provide you with picture(s) of an object, often from multiple vantage points, that can be annotated to indicate the location or region of an observation. 
                            If you wish, you can upload photographs and automatically create a new image service to document the location of your observations of an object.
                        `,
                    },
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
                                        physicalThingResourceId: "['select-project']['select-phys-thing']['physicalThing']"
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
                                        sampleObjectResourceId: "['select-project']['select-phys-thing']['physicalThing']",
                                        relatedProjectData: "['select-project']['select-phys-thing']",
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
