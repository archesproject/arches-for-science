import ko from 'knockout';
import $ from 'jquery';
import arches from 'arches';
import Workflow from 'viewmodels/workflow';
import AlertViewModel from 'viewmodels/alert';
import { generateArchesURL } from "@/arches/utils/generate-arches-url.ts";
import sampleTakingWorkflowTemplate from 'templates/views/components/plugins/sample-taking-workflow.htm';
import 'viewmodels/workflow-step';
import 'views/components/workflows/select-phys-thing-step';
import 'views/components/workflows/sample-taking-workflow/sampling-info-step';
import 'views/components/workflows/sample-taking-workflow/sample-taking-sample-location-step';
import 'views/components/workflows/sample-taking-workflow/sample-taking-image-step';
import 'views/components/workflows/sample-taking-workflow/sample-taking-final-step';

export default ko.components.register('sample-taking-workflow', {
    viewModel: function(params) {
        this.componentName = 'sample-taking-workflow';

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
                title: arches.translations.samplingActivityInfo,
                name: 'sample-info',  /* unique to workflow */
                description: arches.translations.dateSampleTaken,
                required: true,
                lockableExternalSteps: ['select-project'],
                layoutSections: [
                    {
                        sectionTitle: null,
                        componentConfigs: [
                            { 
                                componentName: 'sampling-info-step',
                                uniqueInstanceName: 'sampling-info', /* unique to step */
                                parameters: {
                                    selectPhysThingData: "['select-project']['select-phys-thing']"
                                },
                            },
                        ], 
                    },
                ],
            },
            {
                title: arches.translations.image,
                name: 'image-step',  /* unique to workflow */
                required: true,
                layoutSections: [
                    {
                        sectionTitle: arches.translations.imageService,
                        componentConfigs: [
                            { 
                                componentName: 'sample-taking-image-step',
                                uniqueInstanceName: 'image-service-instance', /* unique to step */
                                tilesManaged: 'one',
                                parameters: {
                                    graphid: '707cbd78-ca7a-11e9-990b-a4d18cec433a',  /* Digital Resources */
                                    physicalThingResourceId: "['select-project']['select-phys-thing']['physicalThing']",
                                    samplingInfoData: "['sample-info']['sampling-info']",
                                },
                            },
                        ], 
                    },
                ],
            },
            {
                title: arches.translations.sampleInfo,
                name: 'sample-location-step', /* unique to workflow */
                required: true,
                workflowstepclass: 'analysis-areas-workflow-regions-step',
                hiddenWorkflowButtons: ['undo', 'save'],
                layoutSections: [
                    {
                        componentConfigs: [
                            { 
                                componentName: 'sample-taking-sample-location-step',
                                uniqueInstanceName: 'sample-location-instance', /* unique to step */
                                tilesManaged: 'one',
                                parameters: {
                                    graphid: '9519cb4f-b25b-11e9-8c7b-a4d18cec433a',  /* physical thing */
                                    physicalThingResourceId: "['select-project']['select-phys-thing']['physicalThing']",
                                    physicalThingName: "['select-project']['select-phys-thing']['physThingName']",
                                    imageServiceInstanceData: "['image-step']['image-service-instance'][0]['data']",
                                    projectSet: "['select-project']['select-phys-thing']['projectSet']",
                                    samplingActivityResourceId: "['sample-info']['sampling-info']['samplingActivityResourceId']", 
                                },
                            },
                        ], 
                    },
                ],
            },
            {
                title: arches.translations.summary,
                name: 'add-project-complete',  /* unique to workflow */
                graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                layoutSections: [
                    {
                        componentConfigs: [
                            { 
                                componentName: 'sample-taking-final-step',
                                uniqueInstanceName: 'sample-taking-final',
                                parameters: {
                                    samplingActivityResourceId: "['sample-info']['sampling-info']['samplingActivityResourceId']",
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
                url: generateArchesURL("arches:transaction_reverse", { transactionid: this.id() })
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
        
        this.quitUrl = generateArchesURL("arches:plugins", { slug: 'init-workflow' });
    },
    template: sampleTakingWorkflowTemplate
});