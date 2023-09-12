define([
    'arches',
    'uuid',
    'knockout',
    'utils/resource',
    'templates/views/components/workflows/chemical-analysis-workflow/ca-instrument-info-step.htm',
    'viewmodels/card',
    'bindings/ckeditor'
], function(arches, uuid, ko, resourceUtils, instrumentInfoStepTemplate) {
   
    function viewModel(params) {

        var self = this;
        const instrumentNodeId = '1acc9d59-c458-11e9-99e4-a4d18cec433a';
        const procedureNodeId =  '51416e9c-c458-11e9-b70e-a4d18cec433a';
        const parameterNodeId = '8ec331a1-c457-11e9-8d7a-a4d18cec433a';
        const parameterNodeGroupId = '8ec30d3a-c457-11e9-81dc-a4d18cec433a'; // parameter are 'Statement' cards
        const nameNodeGroupId = '87e3d6a1-c457-11e9-9ec9-a4d18cec433a';
        const nameNodeId = '87e40cc5-c457-11e9-8933-a4d18cec433a';
        const dateNodeGroupId = '89f06cba-c457-11e9-916e-a4d18cec433a';
        const dateNodeId = '89f08768-c457-11e9-94db-a4d18cec433a';
        const projectInfo = params.projectInfoData;
        const physThingName = projectInfo.physThingName;
        const observedThingNodeId = 'cd412ac5-c457-11e9-9644-a4d18cec433a';
        const observedThingInstanceId = projectInfo.physicalThing;
        const projectInstanceId = projectInfo.project;
        const projectNodeId = '736f06a4-c54d-11ea-9f58-024e0d439fdb';
        const nameTypeNodeId = '87e4092e-c457-11e9-8036-a4d18cec433a';
        // TODO: the default name type concept value needs to change/be confirmed.  
        const nameTypeConceptValue = ['ec635afd-beb1-426e-a21c-09866ea94d25'];
        const languageConceptValue = ['bc35776b-996f-4fc1-bd25-9f6432c1f349'];
        const nameLanguageNodeId = '87e3ec82-c457-11e9-89d8-a4d18cec433a';
        const statementLanguageNodeId = '8ec31780-c457-11e9-9543-a4d18cec433a';
        const statementTypeNodeId = '8ec31b7d-c457-11e9-8550-a4d18cec433a';
        const statementTypeConceptValue = ['72202a9f-1551-4cbc-9c7a-73c02321f3ea', 'df8e4cf6-9b0b-472f-8986-83d5b2ca28a0'];
        const relatedGraphIds = ['b6c819b8-99f6-11ea-a9b7-3af9d3b32b71'];

        const getProp = function(key, prop) {
            if (ko.unwrap(params.value) && params.value()[key]) {
                return prop ? params.value()[key][prop] : params.value()[key];
            } else {
                return null;
            } 
        };

        let parameterTileId = getProp('parameter', 'tileid');
        let instrumentTileId = getProp('instrument', 'tileid');
        let procedureTileId = getProp('procedure', 'tileid');
        let projectTileId = getProp('project', 'tileid');
        let observedThingTileid = getProp('observedThing', 'tileid');
        let dateTileId = getProp('date', 'tileid');
        let nameTileId = getProp('name', 'tileid');

        this.instrumentValue = ko.observable(getProp('instrument', 'value'));
        this.procedureValue = ko.observable(getProp('procedure', 'value'));
        this.parameterValue = ko.observable(getProp('parameter', 'value'));
        this.observationInstanceId = ko.observable(getProp('observationInstanceId'));
        this.dateValue = ko.observable(getProp('date', 'value'));
        this.showName = ko.observable(false);
        this.locked = params.form.locked;
        this.procedureSearchString = location.origin + '/search?advanced-search=%5B%7B%22op%22%3A%22and%22%2C%22dc946b1e-c070-11e9-a005-a4d18cec433a%22%3A%7B%22op%22%3A%22%22%2C%22val%22%3A%2260d1e09c-0f14-4348-ae14-57fdb9ef87c4%22%7D%7D%5D';
        this.instrumentName = ko.observable();
        this.nameValue = ko.observable(getProp('name', 'value'));

        const snapshot = {
            dateValue: self.dateValue(),
            instrumentValue: self.instrumentValue(),
            procedureValue: self.procedureValue(),
            parameterValue: self.parameterValue()
        };

        this.createRelatedInstance = function(val){
            return [{
                resourceId: val,
                ontologyProperty: "",
                inverseOntologyProperty: ""
            }];
        };

        this.instrumentInstance = ko.observable(this.instrumentValue() ? this.createRelatedInstance(this.instrumentValue()) : null);
        this.procedureInstance = ko.observable(this.procedureValue() ? this.createRelatedInstance(this.procedureValue()) : null);

        const createStrObject = str => {
            return {[arches.activeLanguage]: {
                "value": str,
                "direction": arches.languages.find(lang => lang.code == arches.activeLanguage).default_direction
            }};
        };

        this.instrumentValue.subscribe(function(val){
            params.form.dirty(Boolean(val) && !self.locked());
            if (val && !relatedGraphIds.includes(val)) {
                let instrumentData = resourceUtils.lookupResourceInstanceData(val);
                self.instrumentInstance(self.createRelatedInstance(val));
                instrumentData.then(function(data){
                    self.instrumentName(data._source.displayname);
                    self.nameValue(`Observation of ${physThingName} with ${data._source.displayname} ${self.dateValue()}`);
                });
            }
        });

        this.dateValue.subscribe(function(val){
            if (self.instrumentName()) {
                self.nameValue(`Observation of ${physThingName} with ${self.instrumentName()} ${val}`);
            }
        });

        this.procedureValue.subscribe(function(val){
            if (val) {
                self.procedureInstance(self.createRelatedInstance(val));
            }
        });

        this.updatedValue = ko.pureComputed(function(){
            return {
                instrument: {value: self.instrumentValue(), tileid: instrumentTileId},
                procedure: {value: self.procedureValue(), tileid: procedureTileId},
                parameter: {value: self.parameterValue(), tileid: parameterTileId},
                name: {value: self.nameValue(), tileid: nameTileId},
                date: {value: self.dateValue(), tileid: dateTileId},
                observedThing: {tileid: observedThingTileid},
                project: {tileid: projectTileId},
                observationInstanceId: self.observationInstanceId()
            };
        });

        this.updatedValue.subscribe(function(val){
            params.value(val);
        });

        this.buildTile = function(data, nodeGroupId, resourceid, tileid) {
            let res = {
                "tileid": tileid || "",
                "nodegroup_id": nodeGroupId,
                "parenttile_id": null,
                "resourceinstance_id": resourceid,
                "sortorder": 0,
                "tiles": {},
                "data": {},
                "transaction_id": params.form.workflowId
            };
            res.data = data;

            return res;
        };

        this.saveTile = function(data, nodeGroupId, resourceid, tileid) {
            let tile = self.buildTile(data, nodeGroupId, resourceid, tileid);
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

        params.form.reset = function(){
            self.instrumentValue(snapshot.instrumentValue);
            self.procedureValue(snapshot.procedureValue);
            self.parameterValue(snapshot.parameterValue);
            params.form.hasUnsavedData(false);
        };

        this.saveTextualWorkType = function(){
            const textualWorkTypeNodegroupId= "dc946b1e-c070-11e9-a005-a4d18cec433a";
            const procedureValueId = "60d1e09c-0f14-4348-ae14-57fdb9ef87c4";

            window.fetch(arches.urls.api_resources(self.procedureValue()) + '?format=json&compact=false')
                .then(response => response.json())
                .then(data => {
                    const textualWorkTypeTileId = data.resource.type?.['@tile_id'];
                    if (textualWorkTypeTileId){
                        window.fetch(arches.urls.api_tiles(textualWorkTypeTileId), {
                            method: 'GET',
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                        })
                            .then(response => response.json())
                            .then(tile => {
                                if (!tile.data[textualWorkTypeNodegroupId].includes(procedureValueId)){
                                    tile.data[textualWorkTypeNodegroupId].push(procedureValueId);
                                    window.fetch(arches.urls.api_tiles(textualWorkTypeTileId), {
                                        method: 'POST',
                                        credentials: 'include',
                                        body: JSON.stringify(tile),
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                    });
                                }
                            });
                    } else {
                        const typeTileData = {};
                        typeTileData[textualWorkTypeNodegroupId] = [procedureValueId];
                        return self.saveTile(typeTileData, textualWorkTypeNodegroupId, self.procedureValue())
                    }
                });
        };

        params.form.save = function() {
            params.form.complete(false);
            if (!self.instrumentValue()){
                params.form.error(new Error("Selecting an instrument is required."));
                params.pageVm.alert(new params.form.AlertViewModel('ep-alert-red', "Instrument Required", "Selecting an instrument is required."));
                return;
            }
            if (self.procedureValue()){
                self.saveTextualWorkType();
            }

            params.form.lockExternalStep("project-info", true);
            

            let tiles = {
                "transaction_id": params.form.workflowId
            };
            let observedThingData = {};
            observedThingData[observedThingNodeId] = self.createRelatedInstance(observedThingInstanceId);
            tiles['observedThingTile'] = self.buildTile(observedThingData, observedThingNodeId, self.observationInstanceId(), observedThingTileid);

            let partOfProjectData = {};
            partOfProjectData[projectNodeId] = self.createRelatedInstance(projectInstanceId);
            tiles['partOfProjectTile'] = self.buildTile(partOfProjectData, projectNodeId, self.observationInstanceId(), projectTileId);

            let nameData = {};
            nameData[nameNodeId] = createStrObject(self.nameValue());
            nameData[nameTypeNodeId] = nameTypeConceptValue;
            nameData[nameLanguageNodeId] = languageConceptValue;
            tiles['nameTile'] = self.buildTile(nameData, nameNodeGroupId, self.observationInstanceId(), nameTileId);

            let dateData = {};
            dateData[dateNodeId] = self.dateValue();
            tiles['dateTile'] = self.buildTile(dateData, dateNodeGroupId, self.observationInstanceId(), dateTileId);

            let instrumentData = {};
            instrumentData[instrumentNodeId] = self.instrumentInstance();
            tiles['instrumentTile'] = self.buildTile(instrumentData, instrumentNodeId, self.observationInstanceId(), instrumentTileId);

            let procedureData = {};
            if (self.procedureInstance()) {
                procedureData[procedureNodeId] = self.procedureInstance();
                tiles['procedureTile'] = self.buildTile(procedureData, procedureNodeId, self.observationInstanceId(), procedureTileId);
            }

            let parameterData = {};
            parameterData[parameterNodeId] = self.parameterValue();
            parameterData[statementTypeNodeId] = statementTypeConceptValue;
            parameterData[statementLanguageNodeId] = languageConceptValue;
            tiles['parameterTile'] = self.buildTile(parameterData, parameterNodeGroupId, self.observationInstanceId(), parameterTileId);

            return window.fetch(arches.urls.root + 'instrument-info-form-save', {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify(tiles),
                headers: {
                    'Content-Type': 'application/json'
                },
            }).then(function(response) {
                return response.json();
            }).then(function(json){
                observedThingTileid = json.observedThingTile.tileid;
                projectTileId = json.partOfProjectTile.tileid;
                nameTileId = json.nameTile.tileid;
                dateTileId = json.dateTile.tileid;
                instrumentTileId = json.instrumentTile.tileid;
                procedureTileId = json.procedureTile ? json.procedureTile.tileid : null;
                parameterTileId = json.parameterTile.tileid;
                self.observationInstanceId(json.observedThingTile.resourceinstance_id); // mutates updateValue to refresh value before saving.
                params.form.savedData(params.form.value());
                params.form.complete(true);
                params.form.dirty(false);
                params.pageVm.alert("");
            }).catch(function(error){
                // alert the workflow that something happend
                params.pageVm.alert(new params.form.AlertViewModel('ep-alert-red', "Error", "There was an issue saving the workflow step."));
                params.form.complete(false);
                params.form.dirty(true);
                params.form.loading(false);
            });

        };
    }

    ko.components.register('ca-instrument-info-step', {
        viewModel: viewModel,
        template: instrumentInfoStepTemplate
    });

    return viewModel;
});
