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
                    layoutSections: [
                        {
                            sectionTitle: 'Project',
                            componentConfigs: [
                                { 
                                    componentName: 'resource-instance-select-widget',
                                    uniqueInstanceName: 'project-resource-instance', /* unique to step */
                                    graphIds: [
                                        '0b9235d9-ca85-11e9-9fa2-a4d18cec433a', /* Activity */
                                    ],  
                                    required: true,
                                },
                            ], 
                        },
                        {
                            sectionTitle: 'Sample Object',
                            componentConfigs: [
                                { 
                                    componentName: 'resource-instance-select-widget',
                                    uniqueInstanceName: 'sample-object-resource-instance', /* unique to step */
                                    graphIds: [
                                        '615b11ee-c457-11e9-910c-a4d18cec433a', /* Observation */
                                    ],  
                                    required: true,
                                },
                            ], 
                        },
                    ],
                    required: true,
                    icon: 'fa-search',
                    class: 'fa-search',
                    wastebin: {}
                },
                {
                    title: 'Project Info',
                    name: 'projectInfo',
                    description: 'Information about the Project',
                    component: 'views/components/workflows/new-step',
                    componentname: 'new-step',
                    layoutSections: [
                        {
                            sectionTitle: 'FOOBAR',
                            componentConfigs: [
                                { 
                                    componentName: 'resource-instance-select-widget',
                                    uniqueInstanceName: 'project-resource-instance', /* unique to step */
                                    graphIds: [
                                        '0b9235d9-ca85-11e9-9fa2-a4d18cec433a', /* Activity */
                                    ],  
                                    required: true,
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
