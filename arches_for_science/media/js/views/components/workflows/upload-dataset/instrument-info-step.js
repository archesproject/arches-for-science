define([
    'arches',
    'uuid',
    'knockout',
    'utils/resource',
    'templates/views/components/workflows/upload-dataset/instrument-info-step.htm',
    'viewmodels/card',
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
        const observationTypeNodeId = '7b97ee23-c457-11e9-8ce3-a4d18cec433a';
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

        // relationship valueids
        const parentProjectOfObservation = "5d7372a0-f802-4a94-a03e-4f7c7586dc04";
        const hasObservationActivity = "4c1e9d1a-76a7-4555-8faa-f11d5796ac99";
        const observationActivityProcedure = "e495c9a4-013b-43d2-8992-4a9912834a49";
        const observationProcedureUsedIn = "8808d1e5-49ad-4d47-bf4d-9301ceeb8d68";
        const physicalObjectObserved = "efc8f0f4-ddb8-4e75-ae36-c7908b77fe7c";
        const observedBy = "abe1b5f1-a8e3-42c5-b5a6-3382b75967d2";
        const instrumentUsedInObservation = "a0ed3c16-7b69-4db1-b2a1-2872ca8288d0";
        const observationInstrumentUsedIn = "c643ce0e-ccfa-4980-9346-abb2a959ee39";

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
        let observationTypeTileId = getProp('observationType', 'tileid');
        let dateTileId = getProp('date', 'tileid');
        let nameTileId = getProp('name', 'tileid');

        this.instrumentValue = ko.observable(getProp('instrument', 'value'));
        this.procedureValue = ko.observable(getProp('procedure', 'value'));
        this.parameterValue = ko.observable(getProp('parameter', 'value'));
        this.observationInstanceId = ko.observable(getProp('observationInstanceId'));
        this.observationType = ko.observableArray(getProp("observationType", 'value'));
        this.dateValue = ko.observable(getProp('date', 'value'));
        this.showName = ko.observable(false);
        this.locked = params.form.locked;
        this.procedureSearchString = location.origin + '/search?advanced-search=%5B%7B%22op%22%3A%22and%22%2C%22dc946b1e-c070-11e9-a005-a4d18cec433a%22%3A%7B%22op%22%3A%22%22%2C%22val%22%3A%2260d1e09c-0f14-4348-ae14-57fdb9ef87c4%22%7D%7D%5D';
        this.instrumentName = ko.observable();
        this.nameValue = ko.observable(getProp('name', 'value'));

        const snapshot = {
            dateValue: self.dateValue(),
            observationType: self.observationType(),
            instrumentValue: self.instrumentValue(),
            procedureValue: self.procedureValue(),
            parameterValue: self.parameterValue()
        };

        this.createRelatedInstance = function(val, ontologyProperty, inverseOntologyProperty){
            return [{
                resourceId: val,
                ontologyProperty,
                inverseOntologyProperty
            }];
        };

        this.instrumentInstance = ko.observable(this.instrumentValue() ? this.createRelatedInstance(this.instrumentValue(), instrumentUsedInObservation, observationInstrumentUsedIn) : null);
        this.procedureInstance = ko.observable(this.procedureValue() ? this.createRelatedInstance(this.procedureValue(), observationActivityProcedure, observationProcedureUsedIn) : null);

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
                self.instrumentInstance(self.createRelatedInstance(val, instrumentUsedInObservation, observationInstrumentUsedIn));
                instrumentData.then(function(data){
                    self.instrumentName(data._source.displayname);
                    const formattedName = arches.translations.observationWith
                        .replace('{physicalThingName}', physThingName)
                        .replace('{instrumentName}', data._source.displayname);
                    self.nameValue(`${formattedName} ${self.dateValue()}`);
                });
            }
            if (!val) {
                self.instrumentName(null);
                self.nameValue(null);
            }
        });

        this.dateValue.subscribe(function(val){
            if (self.instrumentName()) {
                const formattedName = arches.translations.observationWith
                    .replace('{physicalThingName}', physThingName)
                    .replace('{instrumentName}', self.instrumentName());
                self.nameValue(`${formattedName} ${val}`);
            }
        });

        this.procedureValue.subscribe(function(val){
            if (val) {
                self.procedureInstance(self.createRelatedInstance(val, observationActivityProcedure, observationProcedureUsedIn));
            }
        });

        this.isEmpty = obj => {
            return Object.values(obj).every(
                val => val === null ||
                Object.values(val).every(
                    innerVal => innerVal === null || innerVal instanceof Array && innerVal.length === 0
                )
            )
        };

        this.updatedValue = ko.pureComputed(function(){
            const updated = {
                instrument: {value: self.instrumentValue(), tileid: instrumentTileId},
                procedure: {value: self.procedureValue(), tileid: procedureTileId},
                parameter: {value: self.parameterValue(), tileid: parameterTileId},
                name: {value: self.nameValue(), tileid: nameTileId},
                date: {value: self.dateValue(), tileid: dateTileId},
                observedThing: {tileid: observedThingTileid},
                project: {tileid: projectTileId},
                observationType: {value: self.observationType(), tileid: observationTypeTileId},
                observationInstanceId: self.observationInstanceId()
            };
            if (self.isEmpty(updated)) {
                return undefined;  // null would trigger dirty state, i.e. null !== undefined
            }
            return updated;
        });

        if (!params.form.savedData()) {
            params.form.savedData(this.updatedValue());
        }

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
            self.observationType(snapshot.observationType);
            self.instrumentValue(snapshot.instrumentValue);
            self.procedureValue(snapshot.procedureValue);
            self.parameterValue(snapshot.parameterValue);
            // Must run after instrument update, reads instrumentName()
            self.dateValue(snapshot.dateValue);
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

            if (self.procedureValue()){
                self.saveTextualWorkType();
            }

            params.form.lockExternalStep("project-info", true);
            

            let data = {
                "transaction_id": params.form.workflowId,
                "resourceinstance_id": self.observationInstanceId(),
            };

            let observedThingData = {};
            observedThingData[observedThingNodeId] = self.createRelatedInstance(observedThingInstanceId, physicalObjectObserved, observedBy);
            data['observedThingTile'] = self.buildTile(observedThingData, observedThingNodeId, self.observationInstanceId(), observedThingTileid);
            
            let observationTypeData = {};
            observationTypeData[observationTypeNodeId] = self.observationType();
            data['observationTypeTile'] = self.buildTile(observationTypeData, observationTypeNodeId, self.observationInstanceId(), observationTypeTileId);

            let partOfProjectData = {};
            partOfProjectData[projectNodeId] = self.createRelatedInstance(projectInstanceId, parentProjectOfObservation, hasObservationActivity);
            data['partOfProjectTile'] = self.buildTile(partOfProjectData, projectNodeId, self.observationInstanceId(), projectTileId);

            let nameData = {};
            nameData[nameNodeId] = createStrObject(self.nameValue());
            nameData[nameTypeNodeId] = nameTypeConceptValue;
            nameData[nameLanguageNodeId] = languageConceptValue;
            data['nameTile'] = self.buildTile(nameData, nameNodeGroupId, self.observationInstanceId(), nameTileId);

            let dateData = {};
            dateData[dateNodeId] = self.dateValue();
            data['dateTile'] = self.buildTile(dateData, dateNodeGroupId, self.observationInstanceId(), dateTileId);

            let instrumentData = {};
            instrumentData[instrumentNodeId] = self.instrumentInstance();
            data['instrumentTile'] = self.buildTile(instrumentData, instrumentNodeId, self.observationInstanceId(), instrumentTileId);

            let procedureData = {};
            if (self.procedureInstance()) {
                procedureData[procedureNodeId] = self.procedureInstance();
                data['procedureTile'] = self.buildTile(procedureData, procedureNodeId, self.observationInstanceId(), procedureTileId);
            }

            let parameterData = {};
            parameterData[parameterNodeId] = self.parameterValue();
            parameterData[statementTypeNodeId] = statementTypeConceptValue;
            parameterData[statementLanguageNodeId] = languageConceptValue;
            data['parameterTile'] = self.buildTile(parameterData, parameterNodeGroupId, self.observationInstanceId(), parameterTileId);

            return window.fetch(arches.urls.root + 'instrument-info-form-save', {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                },
            }).then(function(response) {
                return response.json();
            }).then(function(json){
                observedThingTileid = json.observedThingTile.tileid;
                observationTypeTileId = json.observationTypeTile.tileid;
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
                params.pageVm.alert(
                    new params.form.AlertViewModel(
                        'ep-alert-red',
                        arches.translations.error,
                        arches.translations.issueSavingWorkflowStep,
                    )
                );
                params.form.complete(false);
                params.form.dirty(true);
                params.form.loading(false);
            });

        };
    }

    ko.components.register('instrument-info-step', {
        viewModel: viewModel,
        template: instrumentInfoStepTemplate
    });

    return viewModel;
});
