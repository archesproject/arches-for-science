define([
    'knockout',
    'utils/resource',
    'viewmodels/card',
], function(ko, resourceUtils) {
   
    function viewModel(params) {
        var self = this;
        var componentParams = params.form.componentData.parameters;
        params.value;
        this.save = params.form.save;
        this.physicalThingGraphId = componentParams.graphids[0];
        this.projectGraphId = componentParams.graphids[1];
        this.physThingSetNodegroupId = 'cc5d6df3-d477-11e9-9f59-a4d18cec433a';
        this.projectValue = ko.observable();
        this.physicalThingValue = ko.observable();
        this.physicalThingSetValue = ko.observable();
        this.hasSetWithPhysicalThing = ko.observable();
        if (params.value()) { 
            this.physicalThingValue(params.value().physicalThing);
            this.physicalThingSetValue(params.value().physicalThingSet);
            this.projectValue(params.value().project);
        }
        this.projectValue.subscribe(function(val){
            if (val) {
                var res = resourceUtils.lookupResourceInstanceData(val);
                res.then(
                    function(data){
                        var setTileResourceInstanceId;
                        var setTile = data._source.tiles.find(function(tile){
                            return tile.nodegroup_id === self.physThingSetNodegroupId;
                        });
                        if (setTile) {
                            self.physicalThingSetValue(null);
                            setTileResourceInstanceId = setTile.data[self.physThingSetNodegroupId][0].resourceId;
                            if (setTileResourceInstanceId) {
                                self.physicalThingSetValue(setTileResourceInstanceId);
                            }
                            self.physicalThingValue(null);
                        } else {
                            self.hasSetWithPhysicalThing(false);
                        }
                    }
                );
            }
        });

        this.termFilter = ko.pureComputed(function(){
            if (ko.unwrap(self.physicalThingSetValue)) {
                self.hasSetWithPhysicalThing(true);
                var query = {"op": "and"};
                query['63e49254-c444-11e9-afbe-a4d18cec433a'] = {
                    "op": "",
                    "val":  [ko.unwrap(self.physicalThingSetValue)]
                };
                return function(term, data) {
                    data["advanced-search"] = JSON.stringify([query]);
                    if (term) {
                        data["term-filter"]=JSON.stringify([{"context":"", "id": term,"text": term,"type":"term","value": term,"inverted":false}]);
                    }
                };
            } else {
                return null;
            }
        });

        this.projectValue.subscribe(function(val) {
            if (!val) {
                self.hasSetWithPhysicalThing(null);
                self.physicalThingSetValue(null);
                self.physicalThingValue(null);
            }
        });

        this.physicalThingValue.subscribe(function(){
            params.value({
                physicalThing: self.physicalThingValue(),
                physicalThingSet: self.physicalThingSetValue(),
                project: self.projectValue(),
            });
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
