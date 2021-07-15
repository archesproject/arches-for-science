define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/workflow-step',
    'views/components/workflows/select-phys-thing-step',
    'views/components/workflows/sample-taking-workflow/sampling-info-step',
    'views/components/workflows/sample-taking-workflow/sample-taking-sample-location-step',
    'views/components/workflows/sample-taking-workflow/sample-taking-image-step',
    'views/components/workflows/sample-taking-workflow/sample-taking-final-step'
], function(ko, $, arches, Workflow) {
    return ko.components.register('sample-taking-workflow', {
        viewModel: function(params) {
            var self = this;

            this.resourceId = ko.observable();

            params.steps = [
                {
                    title: 'Project Info',
                    name: 'select-project',  /* unique to workflow */
                    description: 'Select the project and object',
                    informationboxdata: {
                        heading: 'Projects and related object',
                        text: 'Select the project and object that your are sampling',
                    },
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false,
                    shoudltrackresource: true,
                    layoutSections: [
                        {
                            sectionTitle: null,
                            componentConfigs: [
                                { 
                                    componentName: 'select-phys-thing-step',
                                    uniqueInstanceName: 'select-phys-thing', /* unique to step */
                                    parameters: {
                                        graphids: [
                                            '9519cb4f-b25b-11e9-8c7b-a4d18cec433a', /* Project */
                                            '0b9235d9-ca85-11e9-9fa2-a4d18cec433a'/* Physical Thing */
                                        ],  
                                        renderContext: 'workflow',
                                        value: null,
                                    },
                                    required: true,
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Sample Info',
                    name: 'sample-info',  /* unique to workflow */
                    description: 'The date that the sample was taken',
                    informationboxdata: {
                        heading: 'Sampling Information',
                        text: 'Enter the people, date, method, and notes describing the sampling activities on the object',
                    },
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false,
                    lockableExternalSteps: ['select-project'],
                    externalstepdata: {
                        selectprojectstep: 'select-project',
                    },
                    layoutSections: [
                        {
                            sectionTitle: null,
                            componentConfigs: [
                                { 
                                    componentName: 'sampling-info-step',
                                    uniqueInstanceName: 'sampling-info', /* unique to step */
                                    parameters: {
                                        renderContext: 'workflow',
                                    },
                                    required: true,
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Image',
                    name: 'image-step',  /* unique to workflow */
                    informationboxdata: {
                        heading: 'Image Services',
                        text: 'Image services provide you with picture(s) of an object, often from multiple vantage points, \
                        that can be annotated to indicate the location or region of an observation. \
                        If you wish, you can upload photographs and automatically create a new image service \
                        to document the location of your observations of an object',
                    },
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    required: true,
                    externalstepdata: {
                        selectprojectstep: 'select-project',
                    },
                    layoutSections: [
                        {
                            sectionTitle: 'Image Service',
                            componentConfigs: [
                                { 
                                    componentName: 'sample-taking-image-step',
                                    uniqueInstanceName: 'image-service-instance', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '707cbd78-ca7a-11e9-990b-a4d18cec433a'  /* Digital Resources */
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Sample Location',
                    name: 'sample-location-step', /* unique to workflow */
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    required: true,
                    externalstepdata: {
                    },
                    workflowstepclass: 'analysis-areas-workflow-regions-step',
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'sample-taking-sample-location-step',
                                    uniqueInstanceName: 'sample-location-instance', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '9519cb4f-b25b-11e9-8c7b-a4d18cec433a',  /* physical thing */
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Summary',
                    name: 'add-project-complete',  /* unique to workflow */
                    description: 'Summary',
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                    nodegroupid: '',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'sample-taking-final-step',
                                    uniqueInstanceName: 'sample-taking-final',
                                    tilesManaged: 'none',
                                    parameters: {
                                    },
                                },
                            ], 
                        },
                    ],

                }
            ];

            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
            self.getJSON('sample-taking-workflow');

            self.ready(true);
        },
        template: { require: 'text!templates/views/components/plugins/sample-taking-workflow.htm' }
    });
});
