define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/workflow-step',
    'views/components/workflows/create-project-workflow/add-things-step',
    'views/components/workflows/create-project-workflow/create-project-final-step'
], function(ko, $, arches, Workflow) {
    return ko.components.register('create-project-workflow', {
        viewModel: function(params) {
            var self = this;

            this.resourceId = ko.observable();

            params.steps = [
                {
                    title: 'Project Name',
                    name: 'set-project-name',  /* unique to workflow */
                    informationboxdata: {
                        heading: 'Project Name',
                        text: 'Identify the project and its objectives',
                    },
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    required: true,
                    shouldtrackresource: true,
                    layoutSections: [
                        {
                            componentConfigs: [
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'project-name', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                                        nodegroupid: '0b926359-ca85-11e9-ac9c-a4d18cec433a',
                                    },
                                },
                            ], 
                        },
                    ]
                },
                {
                    title: 'Project Statement',
                    name: 'set-project-statement',  /* unique to workflow */
                    informationboxdata: {
                        heading: 'Project Statement',
                        text: 'Set the Project Statement',
                    },
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    required: false,
                    layoutSections: [
                        {
                            componentConfigs: [
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'project-statement', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                                        nodegroupid: '0b92a414-ca85-11e9-b725-a4d18cec433a',
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Project Timespan',
                    name: 'set-project-timespan',  /* unique to workflow */
                    informationboxdata: {
                        heading: 'Project Timespan',
                        text: 'Set the Project Timespan',
                    },
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    required: true,
                    layoutSections: [
                        {
                            componentConfigs: [
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'project-timespan', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                                        nodegroupid: '0b925e3a-ca85-11e9-a308-a4d18cec433a',
                                        hiddenNodes: ['0b92f57d-ca85-11e9-a353-a4d18cec433a', '0b931623-ca85-11e9-b235-a4d18cec433a', '0b930905-ca85-11e9-8aca-a4d18cec433a'],
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Project Team',
                    name: 'set-project-team',  /* unique to workflow */
                    informationboxdata: {
                        heading: 'Project Timespan',
                        text: 'Set the Project Timespan',
                    },                    
                    description: 'Consultation Details',
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    required: false,
                    layoutSections: [
                        {
                            componentConfigs: [
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'project-team', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                                        nodegroupid: 'dbaa2022-9ae7-11ea-ab62-dca90488358a',
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Add Objects to Your Project',
                    name: 'object-search-step',  /* unique to workflow */
                    informationboxdata: {
                        heading: 'Add Objects',
                        text: 'Add Objects to Your Project',
                    },
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    required: true,
                    wastebin: {resourceid: null, description: 'a collection instance'},
                    workflowstepclass: 'create-project-add-things-step',
                    externalstepdata: { 
                        researchactivitystep: 'set-project-name',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                {
                                    componentName: 'add-things-step',
                                    uniqueInstanceName: 'add-phys-things',
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '1b210ef3-b25c-11e9-a037-a4d18cec433a', //Collection graph
                                        nodegroupid: '466f81d4-c451-11e9-b7c9-a4d18cec433a', //Curation in Collection
                                        nodeid: '466fa421-c451-11e9-9a6d-a4d18cec433a', //Curation_used in Collection (physical thing)                    
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    title: 'Summary',
                    name: 'add-project-complete',  /* unique to workflow */
                    description: 'Summary',
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    graphid: '0b9235d9-ca85-11e9-9fa2-a4d18cec433a',
                    nodegroupid: '',
                    externalstepdata: { 
                        addphysthingstep: 'object-search-step',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'create-project-final-step',
                                    uniqueInstanceName: 'create-project-final',
                                    tilesManaged: 'none',
                                    parameters: {
                                    },
                                },
                            ], 
                        },
                    ],
                }
            ];

            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
            self.getJSON('create-project-workflow');

            self.ready(true);
        },
        template: { require: 'text!templates/views/components/plugins/create-project-workflow.htm' }
    });
});
