define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/alert',
    'templates/views/components/plugins/chemical-analysis-workflow.htm',
    'viewmodels/workflow-step',
    'views/components/workflows/select-phys-thing-step',
    'views/components/workflows/chemical-analysis-workflow/ca-instrument-info-step',
    'views/components/workflows/chemical-analysis-workflow/ca-upload-files-step',
    'views/components/workflows/chemical-analysis-workflow/ca-final-step'
], function(ko, $, arches, Workflow, AlertViewModel, chemicalAnalysisWorkflow) {
    return ko.components.register('chemical-analysis-workflow', {
        viewModel: function(params) {
            this.componentName = 'chemical-analysis-workflow';

            this.stepConfig = [
                {
                    title: arches.translations.projectInfo,
                    name: 'project-info',
                    required: true,
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'select-phys-thing-step',
                                    uniqueInstanceName: 'select-phys-thing-step', /* unique to step */
                                    parameters: {
                                        graphids: [
                                            '9519cb4f-b25b-11e9-8c7b-a4d18cec433a', /* Physical Thing */
                                            '0b9235d9-ca85-11e9-9fa2-a4d18cec433a', /* Project */
                                        ],
                                        validateThing: false
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: arches.translations.observationInfo,
                    name: 'select-instrument-and-files',
                    required: true,
                    lockableExternalSteps: ['project-info'],
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'ca-instrument-info-step',
                                    uniqueInstanceName: 'instrument-info', /* unique to step */
                                    parameters: {
                                        projectInfoData: "['project-info']['select-phys-thing-step']"
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: arches.translations.uploadFiles,
                    name: 'upload-files',
                    // TODO(i18n): seems wrong
                    description: arches.translations.dateSampleTaken,
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    workflowstepclass: 'upload-dataset-step-workflow-component-based-step',
                    autoAdvance: false,
                    required: true,
                    hiddenWorkflowButtons: ['undo'],
                    layoutSections: [
                        {
                            sectionTitle: null,
                            componentConfigs: [
                                { 
                                    componentName: 'ca-upload-files-step',
                                    uniqueInstanceName: 'upload-files-step', /* unique to step */
                                    parameters: {
                                        renderContext: 'workflow',
                                        projectinfo: '["project-info"]',
                                        observationinfo: '["select-instrument-and-files"]',
                                    },
                                    required: true,
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: arches.translations.summary,
                    name: 'chemical-analysis-complete',  /* unique to workflow */
                    description: arches.translations.summary,
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'ca-final-step',
                                    uniqueInstanceName: 'chemical-analysis-final',
                                    tilesManaged: 'none',
                                    parameters: {
                                        observationInstanceResourceId: "['select-instrument-and-files']['instrument-info']['observationInstanceId']",
                                        uploadedDatasets: "['select-dataset-files-step']['ca-instrument-info-step'']['parts']",
                                        uploadedDataset: "['upload-files']['ca-upload-files-step']",
                                        parentPhysThingResourceId: "['project-info']['select-phys-thing-step']['physicalThing']",
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
        template: chemicalAnalysisWorkflow
    });
});
