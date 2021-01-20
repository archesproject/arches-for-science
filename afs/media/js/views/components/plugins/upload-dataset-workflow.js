define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/workflow-step'
], function(ko, $, arches, Workflow) {
    return ko.components.register('upload-dataset-workflow', {
        viewModel: function(params) {
            var self = this;
            params.steps = [
                {
                    title: 'Project Info',
                    name: 'upoaddatasetselect',
                    description: 'Provide a name for the sample',
                    component: 'views/components/workflows/project-object-select-step',
                    componentname: 'project-object-select-step',
                    graphid: '707cbd78-ca7a-11e9-990b-a4d18cec433a',
                    nodegroupid: null,
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false, // temporarily false for ease of development on other steps
                    // required: true,
                    wastebin: {resourceid: null, description: 'a sampling activity instance'}
                },
                {
                    title: 'Instrument',
                    name: 'uploaddataset',
                    description: 'Upload the dataset',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '707cbd78-ca7a-11e9-990b-a4d18cec433a',
                    nodegroupid: '7c486328-d380-11e9-b88e-a4d18cec433a',
                    hiddenNodes: [],
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false, // temporarily false for ease of development on other steps
                    // required: true,
                },
                {
                    title: 'Sample Location',
                    name: 'objectsamplelocation',
                    description: '',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '707cbd78-ca7a-11e9-990b-a4d18cec433a',
                    nodegroupid: '',
                    hiddenNodes: [],
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false, // temporarily false for ease of development on other steps
                    // required: true,
                },
                {
                    title: 'File Interpretation',
                    name: 'fileinterpretation',
                    description: 'The date that the sample was taken',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '707cbd78-ca7a-11e9-990b-a4d18cec433a',
                    nodegroupid: '812c7086-9471-11ea-ae26-3af9d3b32b71',
                    hiddenNodes: [],
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false, // temporarily false for ease of development on other steps
                    // required: true,
                },
                {
                    title: 'Summary',
                    description: 'Choose an option below',
                    component: '',
                    componentname: '',
                    graphid: '707cbd78-ca7a-11e9-990b-a4d18cec433a',
                    nodegroupid: '',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null
                }
            ];
            
            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
            self.getJSON('upload-dataset-workflow');

            self.ready(true);
        },
        template: { require: 'text!templates/views/components/plugins/upload-dataset-workflow.htm' }
    });
});
