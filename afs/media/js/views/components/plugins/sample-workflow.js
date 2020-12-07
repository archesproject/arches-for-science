define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/workflow-step'
], function(ko, $, arches, Workflow) {
    return ko.components.register('sample-workflow', {
        viewModel: function(params) {
            var self = this;
            params.steps = [
                {
                },
            ];
            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
            self.getJSON('sample-workflow');

            self.activeStep.subscribe(this.updateState);

            self.ready(true);
        },
        template: { require: 'text!templates/views/components/plugins/sample-workflow.htm' }
    });
});
