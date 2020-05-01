define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/workflow-step'
], function(ko, $, arches, Workflow) {
    return ko.components.register('project-workflow', {
        viewModel: function(params) {

            var self = this;

            params.steps = [
                {
                    title: 'Project Details',
                    name: 'setprojectdetails',
                    description: 'Identify the project and its objectives',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                    nodegroupid: '8d41e4ba-a250-11e9-9b20-00224800b26d',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                    icon: 'fa-code-fork',
                    wastebin: {resourceid: null, description: 'a consulation instance'}
                },
                {
                    title: 'Consultation GeoJSON',
                    name: 'consultationlocation',
                    description: 'Set geospatial data for this consultation',
                    component: 'views/components/workflows/consultation-map-step',
                    componentname: 'consultation-map-step',
                    graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                    nodegroupid: '8d41e4c6-a250-11e9-a54d-00224800b26d',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false,
                    icon: 'fa-map-marker'
                },
                {
                    title: 'Consultation Dates',
                    name: 'setdatedetails',
                    description: 'Consultation Dates',
                    component: 'views/components/workflows/consultation-dates-step',
                    componentname: 'consultation-dates-step',
                    graphid: '8d41e49e-a250-11e9-9eab-002s24800b26d',
                    nodegroupid: '8d41e4a5-a250-11e9-840c-00224800b26d',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                    class: 'hide-completion-date',
                    icon: 'fa-calendar-o'
                },
                {
                    title: 'Consultation Details',
                    name: 'setconsdetails',
                    description: 'Consultation Details',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                    nodegroupid: '8d41e4c0-a250-11e9-a7e3-00224800b26d',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: true,
                    icon: 'fa-list-alt'
                },
                {
                    title: 'Reference Numbers',
                    name: 'setrefnumbers',
                    description: 'Application Reference Numbers',
                    component: 'views/components/workflows/new-multi-tile-step',
                    componentname: 'new-multi-tile-step',
                    graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                    nodegroupid: '8d41e4a2-a250-11e9-82f1-00224800b26d',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false,
                    icon: 'fa-hashtag'
                },
                {
                    title: 'Application Proposal',
                    description: 'Summary of the Application that will be reviewed under this Consultation',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                    nodegroupid: '8d41e4bd-a250-11e9-89e8-00224800b26d',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false,
                    icon: 'fa-clipboard'
                },
                {
                    title: 'Contacts',
                    description: 'Identify the key people/organizations associated with this consultation',
                    component: 'views/components/workflows/new-tile-step',
                    componentname: 'new-tile-step',
                    graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                    nodegroupid: '8d41e4a8-a250-11e9-aff0-00224800b26d',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null,
                    required: false,
                    icon: 'fa-users'
                },
                {
                    title: 'Add Consulation Complete',
                    description: 'Choose an option below',
                    component: 'views/components/workflows/consultations-final-step',
                    componentname: 'consultations-final-step',
                    graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                    nodegroupid: '6a773228-db20-11e9-b6dd-784f435179ea', // consultation status
                    icon: 'fa-check',
                    resourceid: null,
                    tileid: null,
                    parenttileid: null
                }
            ];

            Workflow.apply(this, [params]);
            this.quitUrl = "/arches-her" + arches.urls.plugin('init-workflow');
            console.log(this.quitUrl);
            self.getJSON('consultation-workflow');

            self.activeStep.subscribe(this.updateState);

            self.ready(true);
        },
        template: { require: 'text!templates/views/components/plugins/consultation-workflow.htm' }
    });
});
