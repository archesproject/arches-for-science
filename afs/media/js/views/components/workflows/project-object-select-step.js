define([
    'jquery',
    'underscore',
    'knockout',
    'knockout-mapping',
    'arches',
    'views/components/workflows/new-tile-step',
    'bindings/select2-query',
], function($, _, ko, koMapping, arches, NewTileStep) {

    function viewModel(params) {

        this.selectedProject = ko.observable();
        this.selectedObject = ko.observable();
        this,projectResourceId = ko.observable();
        this.objectResourceId = ko.observable();
        // NewTileStep.apply(this, [params]);
        var self = this;
        this.advance = function() {
            params.workflow.activeStep().complete(true);
            params.workflow.next();
        };
    
    }

    ko.components.register('project-object-select-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/project-object-select-step.htm' }
    });
    return viewModel;
});
