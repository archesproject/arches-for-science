define([
    'arches',
    'uuid',
    'knockout',
    'utils/resource',
    'viewmodels/card',
], function(arches, uuid, ko, resourceUtils) {
   
    function viewModel(params) {

        var self = this;
        var instrumentNodeId = '1acc9d59-c458-11e9-99e4-a4d18cec433a';
        var procedureNodeId =  '51416e9c-c458-11e9-b70e-a4d18cec433a';
        var parametersNodeId = '8ec331a1-c457-11e9-8d7a-a4d18cec433a';
        var parametersNodeGroupId = '8ec30d3a-c457-11e9-81dc-a4d18cec433a';
        var parameterTypeNodeId = '8ec31b7d-c457-11e9-8550-a4d18cec433a';
        var nameNodeGroupId = '87e3d6a1-c457-11e9-9ec9-a4d18cec433a';
        var nameNodeId = '87e40cc5-c457-11e9-8933-a4d18cec433a';
        var physThingName = params.form.externalStepData.projectinfo.data['select-phys-thing-step'][0][1].physThingName;
        var getValue = function(key) {
            return ko.unwrap(params.value) ? params.value()[key] : null; 
        }
        this.instrumentValue = ko.observable(getValue('instrumentValue'));
        this.procedureValue = ko.observable(getValue('procedureValue'));
        this.parameterValue = ko.observable(getValue('parameterValue'));
        this.nameValue = ko.observable(getValue('nameValue'));
        this.observationInstanceId = ko.observable();
        this.showName = ko.observable(false);
        this.instrumentInstance = ko.observable(null);
        this.procedureInstance = ko.observable(null);

        this.init = function(){
            this.instrumentValue.valueHasMutated(); // call this to get the instrument display name to reconstruct the nameValue. See instrumentValue subscription.
        };

        this.instrumentValue.subscribe(function(val){
            var instrumentData = resourceUtils.lookupResourceInstanceData(val);
            self.instrumentInstance({
                resourceId: val,
                ontologyProperty: "",
                inverseOntologyProperty: ""
            });
            instrumentData.then(function(data){
                self.nameValue("Observation of " + physThingName + " with " + data._source.displayname);
            });
        });

        this.procedureValue.subscribe(function(val){
            self.procedureInstance({
                resourceId: val,
                ontologyProperty: "",
                inverseOntologyProperty: ""
            });
        });

        this.updatedValue = ko.pureComputed(function(){
            return {
                instrumentValue: self.instrumentValue(),
                procedureValue: self.procedureValue(),
                parameterValue: self.parameterValue(),
                nameValue: self.nameValue(),
                observationInstanceId: self.observationInstanceId()
            };
        });

        this.updatedValue.subscribe(function(val){
            params.value(val);
        });

        this.buildTile = function(value, nodeId, nodeGroupId, resourceid, tileid) {
            var res = {
                "tileid": tileid || "",
                "nodegroup_id": nodeGroupId,
                "parenttile_id": null,
                "resourceinstance_id": resourceid,
                "sortorder": 0,
                "tiles": {},
                "data": {}
            };
            res.data[nodeId] = value();
            return res;
        };

        this.saveTile = function(tile) {
            return window.fetch(arches.urls.api_tiles(uuid.generate()), {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify(tile),
                headers: {
                    'Content-Type': 'application/json'
                },
            }).then(function(response) {
                if (response.ok) {
                    return response.json();
                }
            });
        };

        params.form.save = function() {
            var nameTile = self.buildTile(self.nameValue, nameNodeId, nameNodeGroupId);
            self.saveTile(nameTile).then(
                function(nameData){
                    var instrumentTile = self.buildTile(self.instrumentInstance, instrumentNodeId, instrumentNodeId, nameData.resourceinstance_id);
                    self.saveTile(instrumentTile).then(
                        function(instrumentData){
                            var procedureTile = self.buildTile(self.procedureInstance, procedureNodeId, procedureNodeId, instrumentData.resourceinstance_id);
                            self.saveTile(procedureTile).then(
                                function(procedureData){
                                    params.form.complete(true);
                                    params.form.savedData(params.form.addedData());
                                }
                            );
                        }
                    );
                }
            );
        };

        this.init();

    }

    ko.components.register('instrument-info-step', {
        viewModel: viewModel,
        template: {
            require: 'text!templates/views/components/workflows/upload-dataset/instrument-info-step.htm'
        }
    });

    return viewModel;
});
