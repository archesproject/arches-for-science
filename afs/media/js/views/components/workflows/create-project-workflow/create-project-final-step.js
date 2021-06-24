define([
    'knockout',
    'uuid',
    'arches',
    'views/components/workflows/summary-step',
], function(ko, uuid, arches, SummaryStep) {

    function viewModel(params) {
        var self = this;
        SummaryStep.apply(this, [params]);

        this.resourceLoading = ko.observable(true);
        this.collectionLoading = ko.observable(true);

        this.collectionResourceId = params.form.externalStepData['addphysthingstep']['data']['collectionResourceId'];
        this.collectionData = ko.observableArray();
        this.collectionOfPhysThings = ko.observableArray();

        this.getRelatedResources(this.collectionResourceId, this.collectionData);

        this.collectionData.subscribe(function(val){
            var physicalThingGraphId = '9519cb4f-b25b-11e9-8c7b-a4d18cec433a';
            val["related_resources"].forEach(function(rr){
                if (rr.graph_id === physicalThingGraphId) {
                    self.collectionOfPhysThings.push({
                        resourceid: rr.resourceinstanceid,
                        name: rr.displayname,
                    });
                };
            });
            this.collectionLoading(false);
            if (!this.resourceLoading()){
                this.loading(false);
            }
        }, this);

        this.resourceData.subscribe(function(val){
            this.displayName = val['displayname'] || 'unnamed';
            this.reportVals = {
                projectName: {'name': 'Project Name', 'value': this.getResourceValue(val.resource['Name'][0],['Name_content','@value'])},
                projectStatement: {'name': 'Project Statement', 'value': this.getResourceValue(val.resource['Statement'][0], ['Statement_content','@value'])},
                projectTimespan: {'name': 'Project Timespan', 'value': this.getResourceValue(val.resource, ['TimeSpan','TimeSpan_begin of the begin','@value'])},
                projectTeam: {'name': 'Project Team', 'value': this.getResourceValue(val.resource, ['carried out by','@value'])},
                collection: {'name': 'Related Collection', 'value': this.getResourceValue(val.resource['Used Set'][0], ['@value'])},
            };
            this.resourceLoading(false);
            if (!this.collectionLoading()){
                this.loading(false);
            }
        }, this);

    }

    ko.components.register('create-project-final-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/create-project-workflow/create-project-final-step.htm' }
    });
    return viewModel;
});
