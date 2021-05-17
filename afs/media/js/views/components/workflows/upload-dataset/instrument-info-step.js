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
        var parameterTypeNodeId = '8ec31b7d-c457-11e9-8550-a4d18cec433a';
        var nameNodeGroupId = '87e3d6a1-c457-11e9-9ec9-a4d18cec433a';
        var nameNodeId = '87e4053d-c457-11e9-85c4-a4d18cec433a';
        var physThingName = params.form.externalStepData.projectinfo.data['select-phys-thing-step'][0][1].physThingName
        this.instrumentValue = ko.observable();
        this.procedureValue = ko.observable();
        this.parametersValue = ko.observable();
        this.nameValue = ko.observable();
        this.observationInstanceId = ko.observable();
        this.showName = ko.observable(false);
        this.instrumentValue.subscribe(function(val){
            var instrumentData = resourceUtils.lookupResourceInstanceData(val);
            instrumentData.then(function(data){
                self.nameValue("Observation of " + physThingName + " with " + data._source.displayname);
            });
        });

        this.updatedValue = ko.pureComputed(function(){
            return {
                instrumentNodeId: self.instrumentValue(),
                procedureNodeId: self.procedureValue(),
                parametersNodeId: self.parametersValue(),
                nameNodeId: self.nameValue(),
                observationInstanceId: self.observationInstanceId()
            };
        });

        this.updatedValue.subscribe(function(val){
            params.value(val);
        });

        this.buildNameTile = function(){
            var res = {
                "tileid": "",
                "nodegroup_id": nameNodeGroupId,
                "parenttile_id": null,
                "resourceinstance_id": "",
                "sortorder": 0,
                "tiles": {},
                "data": {}
            };
            res.data[nameNodeId] = self.nameValue();
            return res;
        };

        this.saveObservation = function() {
            var nameTile = this.buildNameTile();
            return window.fetch(arches.urls.api_tiles(uuid.generate()), {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify(nameTile),
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
            self.saveObservation().then(
                function(data){
                    params.form.complete(true);
                    params.form.savedData(params.form.addedData());
                }
            );
        };

    }

    ko.components.register('instrument-info-step', {
        viewModel: viewModel,
        template: {
            require: 'text!templates/views/components/workflows/upload-dataset/instrument-info-step.htm'
        }
    });

    return viewModel;
});
