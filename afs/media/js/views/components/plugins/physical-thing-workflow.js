define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/workflow-step'
], function(ko, $, arches, Workflow) {
    return ko.components.register('physical-thing-workflow', {
        viewModel: function(params) {

            var self = this;

            params.steps = [
                {
                    title: 'Physical Thing Name',
                    name: 'physicalthingname',
                    description: 'Preliminary information about this physical thing',
                    component: 'views/components/workflows/physical-thing-step',
                    componentname: 'physical-thing-step',
                    graphid: '9519cb4f-b25b-11e9-8c7b-a4d18cec433a',
                    nodegroupid: 'b9c1ced7-b497-11e9-a4da-a4d18cec433a',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                    icon: 'fa-asterisk',
                    wastebin: {resourceid: null, description: 'a physical thing instance'}
                },
                {
                    title: 'Physical Thing Statement',
                    name: 'physicalthingstatement',
                    description: 'Preliminary information about this physical thing',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '9519cb4f-b25b-11e9-8c7b-a4d18cec433a',
                    nodegroupid: '1952bb0a-b498-11e9-a679-a4d18cec433a',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                    icon: 'fa-file-text',
                    wastebin: {resourceid: null, description: 'a physical thing instance'}
                },
                {
                    title: 'Physical Thing Type',
                    name: 'physicalthingtype',
                    description: 'Preliminary information about this physical thing',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '9519cb4f-b25b-11e9-8c7b-a4d18cec433a',
                    nodegroupid: '8ddfe3ab-b31d-11e9-aff0-a4d18cec433a',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                    icon: 'fa-list',
                    wastebin: {resourceid: null, description: 'a physical thing instance'}
                },
                {
                    title: 'Digital Resource File',
                    name: 'digitalresourcefile',
                    description: 'Upload a file to this digital resource',
                    component: 'views/components/workflows/digital-resource-file-step',
                    componentname: 'digital-resource-file-step',
                    graphid: '707cbd78-ca7a-11e9-990b-a4d18cec433a',
                    nodegroupid: '7c486328-d380-11e9-b88e-a4d18cec433a',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                    icon: 'fa-file-image-o',
                    wastebin: {resourceid: null, description: 'a digital resource instance'}
                },
                {
                    title: 'IIIF',
                    name: 'iiif_step',
                    description: 'annotate image',
                    component: 'views/components/workflows/iiif-step',
                    componentname: 'iiif-step',
                    graphid: '9519cb4f-b25b-11e9-8c7b-a4d18cec433a',
                    nodegroupid: 'fec59582-8593-11ea-97eb-acde48001122',
                    physicalthingidstep: 0,
                    visualworkidstep: 0,
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                    icon: 'fa-pencil',
                    class: 'fa-search',
                    wastebin: {resourceid: null, description: 'an activity instance'}
                },
                {
                    title: 'Physical Thing Workflow Complete',
                    description: 'Choose an option below',
                    component: 'views/components/workflows/afs-final-step',
                    componentname: 'afs-final-step',
                    graphid: '9519cb4f-b25b-11e9-8c7b-a4d18cec433a',
                    nodegroupid: '',
                    icon: 'fa-check',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null
                },
            ];

            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
            self.getJSON('physical-thing-workflow');

            self.activeStep.subscribe(this.updateState);

            self.ready(true);
        },
        template: { require: 'text!templates/views/components/plugins/physical-thing-workflow.htm' }
    });
});
