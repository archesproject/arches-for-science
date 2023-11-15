define([
    'knockout',
    'utils/resource',
    'templates/views/components/workflows/select-observation-step.htm',
    'viewmodels/card',
], function(ko, resourceUtils, selectObservationTemplate) {
    
    function viewModel(params) {
        var self = this;

        this.projectGraphId = "0b9235d9-ca85-11e9-9fa2-a4d18cec433a";
        this.observationPartOfNodegroupId = "736f06a4-c54d-11ea-9f58-024e0d439fdb";
        this.observationPartOfPhysicalThingNodeId = 'cd412ac5-c457-11e9-9644-a4d18cec433a';

        this.projectValue = ko.observable();
        this.projectNameValue = ko.observable();
        this.observationValue = ko.observable();

        this.previouslySavedData = params.form.value();
        this.locked = params.form.locked;
        
        if (params.value()) { 
            const previouslySavedData = params.value();

            self.observationValue(previouslySavedData.observation);
            self.projectValue(previouslySavedData.project);
        }

        this.termFilter = ko.pureComputed(function(){
            if (ko.unwrap(self.projectValue)) {
                const query = {"op": "and"};
                query[self.observationPartOfNodegroupId] = {
                    "op": "or",
                    "val":  ko.unwrap(self.projectValue)
                };

                return function(term, queryString) {
                    queryString.set('advanced-search', JSON.stringify([query]));
                    if (term) {
                        queryString.set('term-filter', JSON.stringify([{"context":"", "id": term,"text": term,"type":"term","value": term,"inverted":false}]));
                    }
                };
            } else {
                return null;
            }
        });

        this.projectValue.subscribe(async(val) => {
            if (val) {
                const project = (await resourceUtils.lookupResourceInstanceData(val))?._source;
                self.projectNameValue(project.displayname);
            }
        });

        this.observationValue.subscribe(async(val) => {
            if (!val) { 
                params.value(self.previouslySavedData); 
                return; 
            }

            const observation = (await resourceUtils.lookupResourceInstanceData(val))?._source;
            
            physicalThingObervationTile = observation.tiles.find(function(tile){
                return tile.nodegroup_id === self.observationPartOfPhysicalThingNodeId;
            });
            
            physicalThingResourceId = physicalThingObervationTile.data[self.observationPartOfPhysicalThingNodeId][0].resourceId

            params.value({
                observation: val,
                observationName: observation.displayname,
                project: self.projectValue(),
                projectName: self.projectNameValue(),
                physicalThingResourceId: physicalThingResourceId,
            });
        });
    }

    ko.components.register('select-observation-step', {
        viewModel: viewModel,
        template: selectObservationTemplate
    });

    return viewModel;
});
