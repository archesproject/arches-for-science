define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/alert',
    'templates/views/components/plugins/review-dataset-workflow.htm',
    'viewmodels/workflow-step',
    'views/components/workflows/review-dataset/select-dataset',
    'views/components/workflows/review-dataset/review-dataset-final-step',
    'views/components/workflows/upload-dataset/file-interpretation-step',
], function(ko, $, arches, Workflow, AlertViewModel, reviewDatasetWorkflowTemplate) {
    return ko.components.register('review-dataset-workflow', {
        viewModel: function(params) {
            this.componentName = 'review-dataset-workflow';

            this.stepConfig = [
                {
                    title: arches.translations.datasets,
                    name: 'select-datasets', /* unique to workflow */
                    required: true,
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'select-dataset',
                                    uniqueInstanceName: 'select-dataset-instances', /* unique to step */
                                    tilesManaged: 'none',
                                    parameters: {
                                        graphids: [
                                            '9519cb4f-b25b-11e9-8c7b-a4d18cec433a',  /* physical thing */
                                        ],
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: arches.translations.fileInterpretation,
                    name: 'file-interpretation',
                    required: false,
                    workflowstepclass: 'upload-dataset-step-workflow-component-based-step',
                    hiddenWorkflowButtons: ['undo', 'save'],
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'file-interpretation-step',
                                    uniqueInstanceName: 'file-interpretation', /* unique to step */
                                    parameters: {
                                        activeTab: 'edit',
                                        datasetInfo: "['select-datasets']['dataset-select-instance']['digitalResources']"
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: arches.translations.summary,
                    name: 'review-dataset-complete', /* unique to workflow */
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'review-dataset-final-step',
                                    uniqueInstanceName: 'review-dataset-final',
                                    tilesManaged: 'none',
                                    parameters: {
                                        sampleObjectResourceInstanceId: "['select-datasets']['select-dataset-instances']['resourceid']",
                                        selectedDatasets: "['select-datasets']['select-dataset-instances']['digitalResources']"
                                    },
                                },
                            ], 
                        },
                    ],
                },
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
        template: reviewDatasetWorkflowTemplate
    });
});
