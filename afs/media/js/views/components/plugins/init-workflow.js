define([
    'knockout',
    'arches',
    'afs-settings',
    'templates/views/components/plugins/init-workflow.htm'
], function(ko, arches, afsSettings, initWorkflowTemplate) {

    var InitWorkflow = function(params) {
        this.workflows = params.workflows.map(function(wf){
            wf.url = arches.urls.plugin(wf.slug);
            return wf;
        }, this);

        // filters out the chemical image workflow, if cloud storage is not enabled.
        if(!afsSettings.cloudStorage.enabled){
            this.workflows = this.workflows.filter(workflow => workflow.workflowid != 'c206cfc6-6b4a-481e-a018-8da72aeb7074');
        }
    };

    return ko.components.register('init-workflow', {
        viewModel: InitWorkflow,
        template: initWorkflowTemplate
    });
});
