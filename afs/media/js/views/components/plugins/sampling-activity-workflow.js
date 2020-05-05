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
                    title: 'Sampled Physical Resource',
                    name: 'objectsearchstep',
                    description: 'Select the physical resource',
                    component: 'views/components/workflows/object-search-step',
                    componentname: 'object-search-step',
                    graphid: null,
                    nodegroupid: null,
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                    icon: 'fa-search',
                    class: 'fa-search',
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
