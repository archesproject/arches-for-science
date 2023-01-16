define([
    'knockout',
    'views/components/workflows/summary-step',
    'templates/views/components/workflows/project-collection-workflow/project-collection-final-step.htm'
], function(ko, SummaryStep, projectCollectionFinalStepTemplate) {

    function viewModel(params) {
        var self = this;

        SummaryStep.apply(this, [params]);

        this.projectResourceId = params.projectResourceId;
        this.collectionOfParentPhysThings = ko.observableArray();
        this.collectionOfChildPhysThings = ko.observableArray();

        this.relatedResources.subscribe(function(val){
            const physicalThingNodeId = '8ddfe3ab-b31d-11e9-aff0-a4d18cec433a';
            const physicalThingGraphId = '9519cb4f-b25b-11e9-8c7b-a4d18cec433a';
            const childPhysicalThingsValueIds = [
                '77d8cf19-ce9c-4e0a-bde1-9148d870e11c', //sample
                '7375a6fb-0bfb-4bcf-81a3-6180cdd26123', //sample location
                '31d97bdd-f10f-4a26-958c-69cb5ab69af1', //anlysis area
            ];

            self.collectionName = self.getResourceValue(val, ["resource_instance","displayname"]);
            self.projectName = val["related_resources"].find(rr =>
                rr.resourceinstanceid === self.projectResourceId
            ).displayname;

            const collectionOfPhysThings = val['related_resources'].filter(rr =>
                rr.graph_id === physicalThingGraphId
            );

            self.collectionOfParentPhysThings(collectionOfPhysThings.filter(rr =>
                !rr.tiles.find(tile =>
                    tile.nodegroup_id === physicalThingNodeId &&
                    tile.data[physicalThingNodeId].find(value =>
                        childPhysicalThingsValueIds.includes(value))
                )
            ).map(rr => {return {'name': rr.displayname, resourceid: rr.resourceinstanceid};}));

            self.collectionOfChildPhysThings(collectionOfPhysThings.filter(rr =>
                rr.tiles.find(tile =>
                    tile.nodegroup_id === physicalThingNodeId &&
                    tile.data[physicalThingNodeId].find(value =>
                        childPhysicalThingsValueIds.includes(value))
                )
            ).map(rr => {return {'name': rr.displayname, resourceid: rr.resourceinstanceid};}));

            this.loading(false);
        }, this);
    }

    ko.components.register('project-collection-final-step', {
        viewModel: viewModel,
        template: projectCollectionFinalStepTemplate
    });
    return viewModel;
});
