define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/workflow-step'
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
                    wastebin: {resourceid: null, description: 'a sampling activity instance'}
                },
                {
                    title: 'Sample Info',
                    name: 'object-sample-info',  /* unique to workflow */
                    description: 'The date that the sample was taken',
                    informationboxdata: {
                        heading: 'Sampling Information',
                        text: 'Enter the people, date, method, and notes describing the sampling activities on the object',
                    },
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                    nodegroupid: '0b925e3a-ca85-11e9-a308-a4d18cec433a',
                    hiddenNodes: ['0b92f57d-ca85-11e9-a353-a4d18cec433a', '0b931623-ca85-11e9-b235-a4d18cec433a', '0b930905-ca85-11e9-8aca-a4d18cec433a'],
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false,
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
                    externalstepdata: { 
                        relatedsetstep: 'activity-collection',
                    },
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
                    externalstepdata: { 
                        physicalthingidstep: 'select-physical-thing',
                        visualworkidstep: 'activity-collection',
                    },
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
                    parenttileid: null
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
