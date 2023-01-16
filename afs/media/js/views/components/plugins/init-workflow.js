define([
    'knockout',
    'arches',
    'templates/views/components/plugins/init-workflow.htm'
], function(ko, arches, initWorkflowTemplate) {

    var InitWorkflow = function(params) {
        this.workflows = params.workflows.map(function(wf){
            wf.url = arches.urls.plugin(wf.slug);
            return wf;
        }, this);
    };

    return ko.components.register('init-workflow', {
        viewModel: InitWorkflow,
        template: initWorkflowTemplate
    });
});
