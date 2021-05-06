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
                    title: 'Sample Name',
                    name: 'object-sample-name',  /* unique to workflow */
                    description: 'Provide a name for the sample',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                    nodegroupid: '0b926359-ca85-11e9-ac9c-a4d18cec433a',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                    shouldtrackresource: true,
                    wastebin: {resourceid: null, description: 'a sampling activity instance'}
                },
                {
                    title: 'Sample Date',
                    name: 'object-sample-date',  /* unique to workflow */
                    description: 'The date that the sample was taken',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                    nodegroupid: '0b925e3a-ca85-11e9-a308-a4d18cec433a',
                    hiddenNodes: ['0b92f57d-ca85-11e9-a353-a4d18cec433a', '0b931623-ca85-11e9-b235-a4d18cec433a', '0b930905-ca85-11e9-8aca-a4d18cec433a'],
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                },
                {
                    title: 'Sample Taker',
                    name: 'object-sample-taker',  /* unique to workflow */
                    description: 'Who took the sample?',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                    nodegroupid: 'dbaa2022-9ae7-11ea-ab62-dca90488358a',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                },
                {
                    title: 'Set or Collection',
                    customCardLabel: 'Set or Collection Used in Sampling Activity',
                    name: 'activity-collection',  /* unique to workflow */
                    description: 'What set or collection is related?',
                    component: 'views/components/workflows/related-set-step',
                    componentname: 'related-set-step',
                    graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                    nodegroupid: 'cc5d6df3-d477-11e9-9f59-a4d18cec433a',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                },
                {
                    title: 'Select Physical Thing',
                    name: 'select-physical-thing',  /* unique to workflow */
                    description: 'Select a physical thing from the set to annotate',
                    component: 'views/components/workflows/physical-thing-list',
                    componentname: 'physical-thing-list',
                    graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                    nodegroupid: '466f81d4-c451-11e9-b7c9-a4d18cec433a',
                    nodeid: '466fa421-c451-11e9-9a6d-a4d18cec433a',
                    externalstepdata: { 
                        relatedsetstep: 'activity-collection',
                    },
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                },
                {
                    title: 'IIIF',
                    name: 'iiif-step',  /* unique to workflow */
                    description: 'annotate image',
                    component: 'views/components/workflows/iiif-step',
                    componentname: 'iiif-step',
                    graphid: '9519cb4f-b25b-11e9-8c7b-a4d18cec433a',
                    nodegroupid: 'fec59582-8593-11ea-97eb-acde48001122',
                    externalstepdata: { 
                        physicalthingidstep: 'select-physical-thing',
                        visualworkidstep: 'activity-collection',
                    },
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                    wastebin: {tile: null, description: 'an annotation'}
                },
                {
                    title: 'Add Project Complete',
                    name: 'add-project-complete',  /* unique to workflow */
                    description: 'Choose an option below',
                    component: 'views/components/workflows/afs-final-step',
                    componentname: 'afs-final-step',
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
