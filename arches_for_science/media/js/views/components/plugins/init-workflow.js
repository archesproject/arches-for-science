define([
    'knockout',
    'arches',
    'afs-settings',
    'viewmodels/alert-json',
    'templates/views/components/plugins/init-workflow.htm'
], function(ko, arches, afsSettings, JsonErrorAlertViewModel, initWorkflowTemplate) {

    var InitWorkflow = function(params) {
        this.workflows = params.workflows.map(function(wf){
            wf.url = arches.urls.plugin(wf.slug);
            return wf;
        }, this);

        this.shouldShowIncompleteWorkflowsModal = ko.observable(false);

        this.incompleteWorkflows = ko.observableArray([]);
        this.incompleteWorkflows.subscribe(incompleteWorkflows => {
            if (incompleteWorkflows.length) {
                this.shouldShowIncompleteWorkflowsModal(true);
            }
        });

        fetch(arches.urls.api_user_incomplete_workflows).then(resp => {
            if (resp.ok) {
                return resp.json();
            }
            else {
                params.alert(new JsonErrorAlertViewModel('ep-alert-red', resp.responseJSON))
            }
        }).then(respJSON => {
            this.incompleteWorkflows(respJSON['incomplete_workflows'].map(workflowData => {
                const datetime = new Date(workflowData['created']);
                workflowData['created'] = datetime.toLocaleString();

                return workflowData;
            }));
        });

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
