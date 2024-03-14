define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/alert',
    'templates/views/components/plugins/upload-dataset-workflow.htm',
    'viewmodels/workflow-step',
    'views/components/file-upload',
    'views/components/workflows/select-phys-thing-step',
    'views/components/workflows/upload-dataset/dataset-step',
    'views/components/workflows/upload-dataset/instrument-info-step',
    'views/components/workflows/upload-dataset/upload-dataset-final-step',
    'views/components/workflows/upload-dataset/file-interpretation-step',
    'views/components/workflows/upload-dataset/select-renderer-step',
    'views/components/workflows/upload-dataset/select-dataset-files-step',
    'views/components/workflows/upload-dataset/upload-files-step',
], function(ko, $, arches, Workflow, AlertViewModel, uploadDatasetWorkflowTemplate) {
    return ko.components.register('upload-dataset-workflow', {
        viewModel: function(params) {
            this.componentName = 'upload-dataset-workflow';

            var sampleLocationStep = {
                title: arches.translations.dataFilesLocation,
                name: 'select-dataset-files-step',
                required: true,
                workflowstepclass: 'upload-dataset-step-workflow-component-based-step',
                lockableExternalSteps: ['select-instrument-and-files'],
                hiddenWorkflowButtons: ['undo', 'save'],
                layoutSections: [
                    {
                        componentConfigs: [
                            { 
                                componentName: 'select-dataset-files-step',
                                uniqueInstanceName: 'select-dataset-files-step', /* unique to step */
                                parameters: {
                                    projectInfo: "['project-info']['select-phys-thing-step']",
                                    observationInfo: "['select-instrument-and-files']['instrument-info']"
                                },
                            },
                        ], 
                    },
                ],
            };

            var uploadDatasetStep = {
                title: arches.translations.uploadFiles,
                name: 'upload-files',
                // TODO(i18n): seems wrong
                description: arches.translations.dateSampleTaken,
                component: 'views/components/workflows/component-based-step',
                componentname: 'component-based-step',
                workflowstepclass: 'upload-dataset-step-workflow-component-based-step',
                autoAdvance: false,
                required: true,
                hiddenWorkflowButtons: ['undo', 'save'],
                layoutSections: [
                    {
                        sectionTitle: null,
                        componentConfigs: [
                            { 
                                componentName: 'upload-files-step',
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
            };

            this.stepConfig = [
                {
                    title: arches.translations.datasetType,
                    name: 'dataset-step', /* unique to workflow */
                    required: true,
                    layoutSections: [
                        {
                            sectionTitle: arches.translations.datasetType,
                            componentConfigs: [
                                { 
                                    componentName: 'dataset-step',
                                    uniqueInstanceName: 'dataset-step', /* unique to step */
                                    tilesManaged: 'none',
                                    parameters: {},
                                },
                            ], 
                        },
                    ],
                    stepInjectionConfig: {
                        defaultStepChoice: null,  /* optional param to show tab on new workflow creation */ 
                        stepNameToInjectAfter: function(_step) {  /* step = self-introspection */ 
                            return 'select-instrument-and-files';
                        },
                        injectionLogic: function(step) {  /* step = self-introspection */ 
                            if (
                                step.workflowComponentAbstractLookup() 
                                && step.workflowComponentAbstractLookup()['dataset-step'].savedData() === 'non-destructive'
                            ) {
                                return sampleLocationStep;
                            }
                            if (step.workflowComponentAbstractLookup() && step.workflowComponentAbstractLookup()['dataset-step'].savedData() === 'destructive') {
                                return uploadDatasetStep;
                            }
                        }
                    },
                },
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
                                            '9519cb4f-b25b-11e9-8c7b-a4d18cec433a', /* Project */
                                            '0b9235d9-ca85-11e9-9fa2-a4d18cec433a'/* Physical Thing */
                                        ],
                                        validateThing: true,
                                        datasetRoute: "['dataset-step']['dataset-step']"
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
                                    componentName: 'instrument-info-step',
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
                    title: arches.translations.selectRenderers,
                    name: 'select-renderers',
                    required: true,
                    workflowstepclass: 'select-file-renderers-workflow-step',
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'select-renderer-step',
                                    uniqueInstanceName: 'select-renderer-step', /* unique to step */
                                    parameters: {
                                        activeTab: 'edit',
                                        datasetInfo: "['select-dataset-files-step']",
                                        datasetInfoFromUploadFilesStep: "['upload-files']"
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: arches.translations.fileInterpretation,
                    name: 'file-interpretation',
                    workflowstepclass: 'upload-dataset-step-workflow-component-based-step',
                    required: false,
                    hiddenWorkflowButtons: ['undo', 'save'],
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'file-interpretation-step',
                                    uniqueInstanceName: 'file-interpretation', /* unique to step */
                                    parameters: {
                                        activeTab: 'edit',
                                        datasetInfo: "['select-dataset-files-step']",
                                        datasetInfoFromUploadFilesStep: "['upload-files']"
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: arches.translations.summary,
                    name: 'upload-dataset-complete',  /* unique to workflow */
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'upload-dataset-final-step',
                                    uniqueInstanceName: 'upload-dataset-final',
                                    tilesManaged: 'none',
                                    parameters: {
                                        observationInstanceResourceId: "['select-instrument-and-files']['instrument-info']['observationInstanceId']",
                                        uploadedDatasets: "['select-dataset-files-step']['select-dataset-files-step']['parts']",
                                        uploadedDataset: "['upload-files']['upload-files-step']",
                                        parentPhysThingResourceId: "['project-info']['select-phys-thing-step']['physicalThing']"
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
        template: uploadDatasetWorkflowTemplate
    });
});
