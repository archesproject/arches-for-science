define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/workflow-step'
], function(ko, $, arches, Workflow) {
    return ko.components.register('sampling-activity-workflow', {
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
                }
            ];
            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
            self.getJSON('sampling-activity-workflow');

            self.activeStep.subscribe(this.updateState);

            self.ready(true);
        },
        template: { require: 'text!templates/views/components/plugins/sampling-activity-workflow.htm' }
    });
});
