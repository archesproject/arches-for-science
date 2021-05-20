define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/workflow-step',
    'views/components/workflows/select-phys-thing-step',
    'views/components/workflows/sample-taking-workflow/sampling-info-step',
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
                    name: 'select-physical-thing',  /* unique to workflow */
                    description: 'Select a physical thing from the set to annotate',
                    informationboxdata: {
                        heading: 'Image Services',
                        text: 'Image services provide you with picture(s) of an object, often from multiple vantage points, \
                        that can be annotated to indicate the location or region of an observation. \
                        If you wish, you can upload photographs and automatically create a new image service \
                        to document the location of your observations of an object',
                    },
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                    nodegroupid: '466f81d4-c451-11e9-b7c9-a4d18cec433a',
                    nodeid: '466fa421-c451-11e9-9a6d-a4d18cec433a',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false,
                },
                {
                    title: 'Sample Location',
                    name: 'iiif-step',  /* unique to workflow */
                    description: 'annotate image',
                    informationboxdata: {
                        heading: 'Draw Sample Locations',
                        text: 'Draw the location of each sample that you took from the object. \
                        Use the drawing tools to indicate a point, line, or polygon for each sample location',
                    },
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    graphid: '9519cb4f-b25b-11e9-8c7b-a4d18cec433a',
                    nodegroupid: 'fec59582-8593-11ea-97eb-acde48001122',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false,
                    wastebin: {tile: null, description: 'an annotation'}
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
