define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/workflow-step'
], function(ko, $, arches, Workflow) {
    return ko.components.register('research-activity-workflow', {
        viewModel: function(params) {
            var self = this;

            this.resourceId = ko.observable();

            params.steps = [
                {
                    title: 'Activity Name',
                    name: 'set-activity-name',  /* unique to workflow */
                    description: 'Identify the project and its objectives',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                    nodegroupid: '0b926359-ca85-11e9-ac9c-a4d18cec433a',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                    shouldtrackresource: true,
                    wastebin: {resourceid: null, description: 'an activity instance'}
                },
                {
                    title: 'Activity Statement',
                    name: 'set-activity-statement',  /* unique to workflow */
                    description: 'Set the Activity Statement',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                    nodegroupid: '0b92a414-ca85-11e9-b725-a4d18cec433a',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false,
                },
                {
                    title: 'Activity Timespan',
                    name: 'set-activity-timespan',  /* unique to workflow */
                    description: 'Consultation Dates',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    hiddenNodes: ['0b92f57d-ca85-11e9-a353-a4d18cec433a', '0b931623-ca85-11e9-b235-a4d18cec433a', '0b930905-ca85-11e9-8aca-a4d18cec433a'],
                    graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                    nodegroupid: '0b925e3a-ca85-11e9-a308-a4d18cec433a',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                },
                {
                    title: 'Project Team',
                    name: 'set-project-team',  /* unique to workflow */
                    description: 'Consultation Details',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                    nodegroupid: 'dbaa2022-9ae7-11ea-ab62-dca90488358a',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false,
                },
                {
                    title: 'Add Things to Your Set',
                    name: 'object-search-step',  /* unique to workflow */
                    description: 'Add Physical Things to Your Set',
                    component: 'views/components/workflows/research-collection-step',
                    componentname: 'research-collection-step',
                    graphid: '1b210ef3-b25c-11e9-a037-a4d18cec433a',
                    nodegroupid: '466f81d4-c451-11e9-b7c9-a4d18cec433a',
                    nodeid: '466fa421-c451-11e9-9a6d-a4d18cec433a',
                    externalstepdata: { 
                        researchactivitystep: 'set-activity-name',
                    },
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
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
            self.getJSON('research-activity-workflow');

            self.ready(true);
        },
        template: { require: 'text!templates/views/components/plugins/research-activity-workflow.htm' }
    });
});
