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
                    title: 'Project Info',
                    name: 'projectInfo',
                    description: 'Information about the Project',
                    component: 'views/components/workflows/new-step',
                    componentname: 'new-step',
                    graphid: '615b11ee-c457-11e9-910c-a4d18cec433a',  /* Observation */
                    layoutSections: [
                        {
                            'sectionTitle': 'Project',
                            'widgetConfigs': [
                                { 
                                    'widgetInstanceName': 'project-resource-select', /* unique to step */
                                    'widgetid': '31f3728c-7613-11e7-a139-784f435179ea', /* resource-instance-select-widget */
                                    'required': true,
                                },
                            ], 
                        },
                        {
                            'sectionTitle': 'Sample Object',
                            'widgetConfigs': [
                                { 
                                    'widgetInstanceName': 'sample-object-resource-select', /* unique to step */
                                    'widgetid': '31f3728c-7613-11e7-a139-784f435179ea', /* resource-instance-select-widget */
                                    'required': true,
                                },
                            ], 
                        },
                    ],
                    required: true,
                    icon: 'fa-search',
                    class: 'fa-search',
                    wastebin: {}
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
