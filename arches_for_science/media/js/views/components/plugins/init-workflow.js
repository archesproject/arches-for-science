define([
    'knockout',
    'arches',
    'afs-settings',
    'viewmodels/alert-json',
    'templates/views/components/plugins/init-workflow.htm'
], function(ko, arches, afsSettings, JsonErrorAlertViewModel, initWorkflowTemplate) {

    var InitWorkflow = function(params) {
        this.workflows = ko.observableArray([]);
        this.helpTemplateData = ko.observableArray([]);
        
        fetch(arches.urls.api_plugins).then(resp => {
            if (resp.ok) {
                return resp.json();
            }
            else {
                params.alert(new JsonErrorAlertViewModel('ep-alert-red', resp.responseJSON));
            }
        }).then(respJSON => {
            let workflows = respJSON.reduce((acc, plugin) => {
                if (plugin.config.is_workflow) {
                    plugin.url = arches.urls.plugin(plugin.slug);
                    acc.push(plugin);
                }
                return acc;
            }, []);

            // filters out the chemical analysis and chemical image workflows if cloud storage is not enabled.
            if(!afsSettings.cloudStorage.enabled){
                workflows = workflows.filter(
                    workflow => {
                        return !['c206cfc6-6b4a-481e-a018-8da72aeb7074', "af06e949-5e16-49f0-b23e-e8529e8ce321"].includes(workflow.pluginid);
                    }
                );
            }

            this.workflows(workflows);
            this.helpTemplateData(workflows.reduce((acc, workflow) => {
                if (workflow.helptemplate) {
                    acc.push({'text': workflow.name, 'id': workflow.helptemplate});
                }

                return acc;
            }, []));
        });

        this.shouldShowWorkflowHelp = ko.observable(false);
        this.helpTemplateUrl = ko.observable();
        this.isHelpTemplateLoading = ko.observable();
        this.selectedHelpTemplate = ko.observable();
        this.selectedHelpTemplate.subscribe(helpTemplateName => {
            if (helpTemplateName) {
                this.isHelpTemplateLoading(true);
                this.helpTemplateUrl(arches.urls.help_template + `?template=${helpTemplateName}`);
            }
            else {
                this.helpTemplateUrl(null);
            }
        })

        this.shouldShowIncompleteWorkflowsModal = ko.observable(false);    
        this.requestingUserIsSuperuser = ko.observable(false);

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
                params.alert(new JsonErrorAlertViewModel('ep-alert-red', resp.responseJSON));
            }
        }).then(respJSON => {
            this.incompleteWorkflows(respJSON['incomplete_workflows'].map(workflowData => {
                const datetime = new Date(workflowData['created']);
                workflowData['created'] = datetime.toLocaleString();

                return workflowData;
            }));

            this.requestingUserIsSuperuser(respJSON['requesting_user_is_superuser']);
        });
    };

    return ko.components.register('init-workflow', {
        viewModel: InitWorkflow,
        template: initWorkflowTemplate
    });
});
