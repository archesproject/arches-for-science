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

            params.steps = [
                {
                    title: 'Activity Name',
                    name: 'setactivityname',
                    description: 'Identify the project and its objectives',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                    nodegroupid: '0b926359-ca85-11e9-ac9c-a4d18cec433a',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                    icon: 'fa-code-fork',
                    wastebin: {resourceid: null, description: 'an activity instance'}
                },
                {
                    title: 'Activity Statement',
                    name: 'setactivitystatement',
                    description: 'Set the Activity Statement',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                    nodegroupid: '0b92a414-ca85-11e9-b725-a4d18cec433a',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false,
                    icon: 'fa-map-marker'
                },
                {
                    title: 'Activity Timespan',
                    name: 'setactivitytimespan',
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
                    icon: 'fa-calendar-o'
                },
                {
                    title: 'Project Team',
                    name: 'setprojectteam',
                    description: 'Consultation Details',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                    nodegroupid: 'dbaa2022-9ae7-11ea-ab62-dca90488358a',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false,
                    icon: 'fa-list-alt'
                },
                {
                    title: 'Physical Things',
                    customCardLabel: 'Set or Collection Used in Research Activity',
                    name: 'createphysicalthingsset',
                    description: 'Create a set of physical things',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                    nodegroupid: 'cc5d6df3-d477-11e9-9f59-a4d18cec433a',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false,
                    icon: 'fa-archive'
                },
                {
                    title: 'Add Project Complete',
                    description: 'Choose an option below',
                    component: 'views/components/workflows/afs-final-step',
                    componentname: 'afs-final-step',
                    graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                    nodegroupid: '',
                    icon: 'fa-check',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null
                }
            ];

            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
            self.getJSON('research-activity-workflow');

            self.activeStep.subscribe(this.updateState);

            self.ready(true);
        },
        template: { require: 'text!templates/views/components/plugins/research-activity-workflow.htm' }
    });
});
