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
        var parameterNodeId = '8ec331a1-c457-11e9-8d7a-a4d18cec433a';
        var parameterNodeGroupId = '8ec30d3a-c457-11e9-81dc-a4d18cec433a'; // parameter are 'Statement' cards
        var nameNodeGroupId = '87e3d6a1-c457-11e9-9ec9-a4d18cec433a';
        var nameNodeId = '87e40cc5-c457-11e9-8933-a4d18cec433a';
        var physThingName = params.form.externalStepData.projectinfo.data['select-phys-thing-step'][0][1].physThingName;
        var getProp = function(key, prop) {
            if (ko.unwrap(params.value) && params.value()[key])
                return params.value()[key][prop] || params.value()[key];
            else {
                return null;
            } 
        };
        var parameterTileId = getProp('parameter', 'tileid');
        var instrumentTileId = getProp('instrument', 'tileid');
        var procedureTileId = getProp('procedure', 'tileid');
        var nameTileId = getProp('name', 'tileid');
        this.instrumentValue = ko.observable(getProp('instrument', 'value'));
        this.procedureValue = ko.observable(getProp('procedure', 'value'));
        this.parameterValue = ko.observable(getProp('parameter', 'value'));
        this.nameValue = ko.observable(getProp('name', 'value'));
        this.observationInstanceId = ko.observable(getProp('observationInstanceId'));
        this.showName = ko.observable(false);

        this.createRelatedInstance = function(val){
            return [{
                resourceId: val,
                ontologyProperty: "",
                inverseOntologyProperty: ""
            }];
        };

        this.instrumentInstance = ko.observable(this.instrumentValue() ? this.createRelatedInstance(this.instrumentValue()) : null);
        this.procedureInstance = ko.observable(this.procedureValue() ? this.createRelatedInstance(this.procedureValue()) : null);

        this.instrumentValue.subscribe(function(val){
            if (val) {
                var instrumentData = resourceUtils.lookupResourceInstanceData(val);
                self.instrumentInstance(self.createRelatedInstance(val));
                instrumentData.then(function(data){
                    self.nameValue("Observation of " + physThingName + " with " + data._source.displayname);
                });
            }
        });

        this.procedureValue.subscribe(function(val){
            self.procedureInstance(self.createRelatedInstance(val));
        });

        this.updatedValue = ko.pureComputed(function(){
            return {
                instrument: {value: self.instrumentValue(), tileid: instrumentTileId},
                procedure: {value: self.procedureValue(), tileid: procedureTileId},
                parameter: {value: self.parameterValue(), tileid: parameterTileId},
                name: {value: self.nameValue(), tileid: nameTileId},
                observationInstanceId: self.observationInstanceId()
            };
        });

        this.updatedValue.subscribe(function(val){
            params.value(val);
        });

        this.buildTile = function(data, nodeGroupId, resourceid, tileid) {
            var res = {
                "tileid": tileid || "",
                "nodegroup_id": nodeGroupId,
                "parenttile_id": null,
                "resourceinstance_id": resourceid,
                "sortorder": 0,
                "tiles": {},
                "data": {}
            };
            res.data = data;
            return res;
        };

        this.saveTile = function(data, nodeGroupId, resourceid, tileid) {
            var tile = self.buildTile(data, nodeGroupId, resourceid, tileid);
            return window.fetch(arches.urls.api_tiles(tileid || uuid.generate()), {
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
            var nameData = {};
            nameData[nameNodeId] = self.nameValue();
            self.saveTile(nameData, nameNodeGroupId, self.observationInstanceId(), nameTileId)
                .then(function(data) {
                    var instrumentData = {};
                    instrumentData[instrumentNodeId] = self.instrumentInstance();
                    nameTileId = data.tileid;
                    return self.saveTile(instrumentData, instrumentNodeId, data.resourceinstance_id, instrumentTileId);
                })
                .then(function(data) {
                    var procedureData = {};
                    procedureData[procedureNodeId] = self.procedureInstance();
                    instrumentTileId = data.tileid;
                    return self.saveTile(procedureData, procedureNodeId, data.resourceinstance_id, procedureTileId);
                })
                .then(function(data) {
                    var parameterData = {};
                    parameterData[parameterNodeId] = self.parameterValue();
                    procedureTileId = data.tileid;
                    return self.saveTile(parameterData, parameterNodeGroupId, data.resourceinstance_id, parameterTileId);
                })
                .then(function(data) {
                    parameterTileId = data.tileid;
                    self.observationInstanceId(data.resourceinstance_id); // mutates updateValue to refresh value before saving.
                    params.form.complete(true);
                    params.form.savedData(params.form.addedData());
                });
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
