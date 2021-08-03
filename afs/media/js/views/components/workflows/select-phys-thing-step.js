define([
    'knockout',
    'utils/resource',
    'viewmodels/card',
], function(ko, resourceUtils) {
    
    function viewModel(params) {
        var self = this;
        var componentParams = params.form.componentData.parameters;
        this.physThingSetNodegroupId = 'cc5d6df3-d477-11e9-9f59-a4d18cec433a';
        this.physicalThingPartOfSetNodeId = '63e49254-c444-11e9-afbe-a4d18cec433a';
        this.partNodeGroupId = 'fec59582-8593-11ea-97eb-acde48001122';
        this.partManifestNodeId = '97c30c42-8594-11ea-97eb-acde48001122';
        this.manifestConcepts = [
            '1497d15a-1c3b-4ee9-a259-846bbab012ed', 
            '00d5a7a6-ff2f-4c44-ac85-7a8ab1a6fb70',
            '305c62f0-7e3d-4d52-a210-b451491e6100'
        ]
        this.digitalReferenceTypeNodeId = 'f11e4d60-8d59-11eb-a9c4-faffc265b501';
        this.digitalReferenceNodeGroupId = '8a4ad932-8d59-11eb-a9c4-faffc265b501';
        this.save = params.form.save;
        this.physicalThingGraphId = componentParams.graphids[0];
        this.projectGraphId = componentParams.graphids[1];
        this.projectValue = ko.observable();
        this.physicalThingValue = ko.observable();
        this.physicalThingSetValue = ko.observable();
        this.hasSetWithPhysicalThing = ko.observable();
        this.isPhysicalThingValid = ko.observable();
        
        this.updateValues = function(val){
            if (val === null) {
                self.physicalThingValue(null);
                self.physicalThingSetValue(null);
                self.projectValue(null);
            } else {
                self.physicalThingValue(val.physicalThing);
                self.physicalThingSetValue(val.physicalThingSet);
                self.projectValue(val.project);
            }
        };

        if (params.value()) { 
            this.updateValues(params.value());
        }

        this.locked = params.form.locked;

        params.form.value.subscribe(function(val){
            this.updateValues(val);
        }, this);
        
        this.projectValue.subscribe(function(val){
            self.isPhysicalThingValid("");
            if (val) {
                var res = resourceUtils.lookupResourceInstanceData(val);
                res.then(
                    function(data){
                        let setTileResourceInstanceIds;
                        let setTile = data._source.tiles.find(function(tile){
                            return tile.nodegroup_id === self.physThingSetNodegroupId;
                        });
                        if (setTile && Object.keys(setTile.data).includes(self.physThingSetNodegroupId) && setTile.data[self.physThingSetNodegroupId].length) {
                            self.physicalThingSetValue(null);
                            setTileResourceInstanceIds = setTile.data[self.physThingSetNodegroupId].map((instance) => instance.resourceId);
                            if (setTileResourceInstanceIds) {
                                self.physicalThingSetValue(setTileResourceInstanceIds);
                            }
                            self.physicalThingValue(null);
                        } else {
                            self.hasSetWithPhysicalThing(false);
                        }
                    }
                );
            } else {
                self.updateValues(null);
            }
        });

        this.termFilter = ko.pureComputed(function(){
            if (ko.unwrap(self.physicalThingSetValue)) {
                self.hasSetWithPhysicalThing(true);
                var query = {"op": "and"};
                query[self.physicalThingPartOfSetNodeId] = {
                    "op": "or",
                    "val":  ko.unwrap(self.physicalThingSetValue)
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

        this.physicalThingValue.subscribe(async (val) => {
            if (!val) { return; }
            const physThing = (await resourceUtils.lookupResourceInstanceData(val))?._source;
            
            const digitalReferencesWithManifest = physThing.tiles.
                filter(x => x.nodegroup_id == self.digitalReferenceNodeGroupId &&
                    self.manifestConcepts.includes(x?.data?.[self.digitalReferenceTypeNodeId]));
            const partsWithManifests = physThing.tiles.filter(x => 
                x.nodegroup_id == self.partNodeGroupId &&
                x.data?.[self.partManifestNodeId]?.features?.[0]?.properties?.manifest)

            if(digitalReferencesWithManifest.length && partsWithManifests.length) {
                params.value({
                    physThingName: physThing.displayname,
                    physicalThing: val,
                    physicalThingSet: self.physicalThingSetValue(),
                    project: self.projectValue(),
                });
                self.isPhysicalThingValid(true);
            } else {
                self.isPhysicalThingValid(false);
            }
        });
        
    }

    ko.components.register('select-phys-thing-step', {
        viewModel: viewModel,
        template: {
            require: 'text!templates/views/components/workflows/upload-dataset/select-phys-thing-step.htm'
        }
    });

    return viewModel;
});
