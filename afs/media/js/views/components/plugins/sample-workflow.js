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
                    autoAdvance: false,
                    required: true,
                    icon: 'fa-search',
                    class: 'fa-search',
                    wastebin: {},
                    layoutSections: [
                        {
                            sectionTitle: 'Foo',
                            componentConfigs: [
                                { 
                                    componentName: 'text-widget',
                                    uniqueInstanceName: 'foo', /* unique to step */
                                    graphIds: [],  
                                    required: true,
                                },
                            ], 
                        },
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
                },
                {
                    title: 'Project Info',
                    name: 'projectInfo',
                    description: 'Information about the Project',
                    component: 'views/components/workflows/new-step',
                    componentname: 'new-step',
                    required: true,
                    icon: 'fa-search',
                    class: 'fa-search',
                    wastebin: {},
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
                },
            ];
            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
            self.getJSON('sample-workflow');

            self.ready(true);
        },
        template: { require: 'text!templates/views/components/plugins/sample-workflow.htm' }
    });
});
