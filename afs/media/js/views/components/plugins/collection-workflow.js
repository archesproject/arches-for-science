define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/workflow-step'
], function(ko, $, arches, Workflow) {
    return ko.components.register('collection-workflow', {
        viewModel: function(params) {

            var self = this;

            params.steps = [
                {
                    title: 'Create Physical Things Set',
                    name: 'createphysicalthingsset',
                    description: 'Create a Set of Physical Things',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '1b210ef3-b25c-11e9-a037-a4d18cec433a',
                    nodegroupid: '52aa1673-c450-11e9-8640-a4d18cec433a',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false,
                    icon: 'fa-picture-o',
                    wastebin: {resourceid: null, description: 'an activity instance'}
                },
                {
                    title: 'Add Things to Your Set',
                    name: 'objectsearchstep',
                    description: 'Add Physical Things to Your Set',
                    component: 'views/components/workflows/object-search-step',
                    componentname: 'object-search-step',
                    graphid: '1b210ef3-b25c-11e9-a037-a4d18cec433a',
                    nodegroupid: '466f81d4-c451-11e9-b7c9-a4d18cec433a',
                    nodeid: '466fa421-c451-11e9-9a6d-a4d18cec433a',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                    icon: 'fa-search',
                    class: 'fa-search',
                },
                {
                    title: 'Set Complete',
                    description: 'Choose an option below',
                    component: 'views/components/workflows/afs-final-step',
                    componentname: 'afs-final-step',
                    graphid: '1b210ef3-b25c-11e9-a037-a4d18cec433a',
                    nodegroupid: '',
                    icon: 'fa-check',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null
                }
            ];

            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
            self.getJSON('collection-workflow');

            self.activeStep.subscribe(this.updateState);

            self.ready(true);
        },
        template: { require: 'text!templates/views/components/plugins/workflow.htm' }
    });
});
