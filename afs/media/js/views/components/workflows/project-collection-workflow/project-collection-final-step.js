define([
    'knockout',
    'views/components/workflows/summary-step',
], function(ko, SummaryStep) {

    function viewModel(params) {
        var self = this;

        SummaryStep.apply(this, [params]);

        this.projectResourceId = params.projectResourceId;
        this.collectionOfPhysThings = ko.observableArray();

        this.relatedResources.subscribe(function(val){
            const physicalThingGraphId = '9519cb4f-b25b-11e9-8c7b-a4d18cec433a';
            self.collectionName = val["resource_instance"]["displayname"];
            val["related_resources"].forEach(function(rr){
                if (rr.graph_id === physicalThingGraphId) {
                    self.collectionOfPhysThings.push({
                        resourceid: rr.resourceinstanceid,
                        name: rr.displayname,
                    });
                }
                if (rr.resourceinstanceid === params.projectResourceId){
                    self.projectName = rr.displayname;
                }
            });
            this.loading(false);
        }, this);
    }

    ko.components.register('project-collection-final-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/project-collection-workflow/project-collection-final-step.htm' }
    });
    return viewModel;
});
