define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'uuid',
], function(_, $, arches, ko, uuid) {
    function viewModel(params) {
        var self = this;

        const getProp = function(key, prop) {
            if (ko.unwrap(params.value) && params.value()[key])
                return params.value()[key][prop] || params.value()[key];
            else {
                return undefined;
            } 
        };

        this.samplingActivityResourceId = ko.observable(getProp("samplingActivityResourceId"));
        this.samplers = ko.observable(getProp("samplers"));
        this.samplingDate = ko.observable(getProp("samplingDate"));
        this.samplingTechnique = ko.observable(getProp("samplingTechnique"));
        this.samplingMotivation = ko.observable(getProp("samplingMotivation"));
        this.samplingName = ko.observable(getProp("samplingName"));
        this.projectTile = ko.observable(getProp("projectTile"));
        this.physicalThingTile = ko.observable(getProp("physicalThingTile"));
        this.samplersTile = ko.observable(getProp("samplersTile"));
        this.samplingNameTile = ko.observable(getProp("samplingNameTile"));
        this.samplingDateTile = ko.observable(getProp("samplingDateTile"));
        this.samplingTechniqueTile = ko.observable(getProp("samplingTechniqueTile"));
        this.samplingMotivationTile = ko.observable(getProp("samplingMotivationTile"));
        this.showName = ko.observable(false);

        const snapshot = {
            samplingActivityResourceId: self.samplingActivityResourceId(),
            samplingDate: self.samplingDate(),
            samplers: self.samplers(),
            samplingTechnique: self.samplingTechnique(),
            samplingMotivation: self.samplingMotivation(),
            samplingName: self.samplingName(),
            projectTile: self.projectTile(),
            physicalThingTile: self.physicalThingTile(),
            samplersTile: self.samplersTile(),
            samplingNameTile: self.samplingNameTile(),
            samplingDateTile: self.samplingDateTile(),
            samplingTechniqueTile: self.samplingTechniqueTile(),
            samplingMotivationTile: self.samplingMotivationTile()
        };

        var samplersNode = '03357870-1d9d-11eb-a29f-024e0d439fdb'; //also a nodegroupid
        var sampleStatementNodegroup = '0335786d-1d9d-11eb-a29f-024e0d439fdb';
        var samplingNameNode = '033578c0-1d9d-11eb-a29f-024e0d439fdb';
        var parentProjectNode = '03357879-1d9d-11eb-a29f-024e0d439fdb'; //related project
        var overallObjectSampleNode = 'b3e171aa-1d9d-11eb-a29f-024e0d439fdb'; //related phys thing
        var samplingDateNodegroup = '03357852-1d9d-11eb-a29f-024e0d439fdb';

        this.updatedValue = ko.pureComputed(function(){
            return {
                samplingActivityResourceId: self.samplingActivityResourceId(),
                samplingName: self.samplingName(),
                samplers: self.samplers(),
                samplingDate: self.samplingDate(),
                samplingTechnique: self.samplingTechnique(),
                samplingMotivation: self.samplingMotivation(),
                projectTile: self.projectTile(),
                physicalThingTile: self.physicalThingTile(),      
                samplingNameTile: self.samplingNameTile(),
                samplersTile: self.samplersTile(),
                samplingDateTile: self.samplingDateTile(),
                samplingTechniqueTile: self.samplingTechniqueTile(),
                samplingMotivationTile: self.samplingMotivationTile(),
            };
        });

        this.updatedValue.subscribe(function(val){
            params.value(val);
        });
        
        this.samplingDate.subscribe(function(val){
            self.samplingName(["Sample for", self.physicalThingNameValue, val].join(' '));
        });

        var selectPhysThingData = params.selectPhysThingData;
        this.projectValue = selectPhysThingData["project"];
        this.physicalThingNameValue = selectPhysThingData["physThingName"];
        this.physicalThingValue = selectPhysThingData["physicalThing"];

        params.form.save = async function(){
            const sampelingNameResponse = await self.saveName();
            self.samplingActivityResourceId(sampelingNameResponse.resourceinstance_id);
            self.samplingNameTile(sampelingNameResponse.tileid);

            $.when(
                self.saveProject(),
                self.savePhysicalThing(),
                self.saveSamplers(),
                self.saveSamplingDate(),
                self.saveSamplingTechnique(),
                self.saveSamplingMotivation()
            ).done(function(response1, response2, response3, response4, response5, response6){
                self.projectTile(response1[0].tileid);
                self.physicalThingTile(response2[0].tileid);
                self.samplersTile(response3[0].tileid);
                self.samplingDateTile(response4[0].tileid);
                self.samplingTechniqueTile(response5[0].tileid);
                self.samplingMotivationTile(response6[0].tileid);

                params.form.savedData(params.form.value());
                params.form.lockExternalStep("select-project", true);
                params.form.complete(true);
            });
        };

        this.saveNodeValue = function(nodeid, data, resourceinstanceid, tileid) {
            return $.ajax({
                url: arches.urls.api_node_value,
                type: 'POST',
                data: {
                    'nodeid': nodeid,
                    'data': data,
                    'resourceinstanceid': resourceinstanceid,
                    'tileid': tileid,
                    'transaction_id': params.form.workflowId
                }
            });
        };

        this.saveTile = function(tileid, tile){
            let formData = new window.FormData();
            formData.append('data', JSON.stringify(tile));
            formData.append('transaction_id', params.form.workflowId);
            return $.ajax({
                url: arches.urls.api_tiles(tileid),
                type: 'POST',
                processData: false,
                contentType: false,
                data: formData
            });
        };

        this.saveName = function(){
            return self.saveNodeValue(samplingNameNode,self.samplingName(), self.samplingActivityResourceId(),self.samplingNameTile());
        };

        this.saveProject = function() {
            var data = [{
                'resourceId': self.projectValue,  // resourceid of the project
                'ontologyProperty': '',
                'inverseOntologyProperty':'',
                'resourceXresourceId':''
            }];
            return self.saveNodeValue(parentProjectNode, JSON.stringify(data), self.samplingActivityResourceId(), self.projectTile());
        };

        this.savePhysicalThing = function() {
            var data = [{
                'resourceId': self.physicalThingValue,  // resourceid of the physical thing
                'ontologyProperty': '',
                'inverseOntologyProperty':'',
                'resourceXresourceId':''
            }];
            return self.saveNodeValue(overallObjectSampleNode, JSON.stringify(data), self.samplingActivityResourceId(), self.physicalThingTile());
        };

        this.saveSamplers = function() {
            var samplersData = [];
            if (self.samplers()) {
                self.samplers().forEach(function(sampler){
                    samplersData.push({
                        'resourceId': sampler,  // resourceid of the person
                        'ontologyProperty': '',
                        'inverseOntologyProperty':'',
                        'resourceXresourceId':''
                    });
                }); 
            }
            return self.saveNodeValue(samplersNode, JSON.stringify(samplersData), self.samplingActivityResourceId(), self.samplersTile());
        };

        this.saveSamplingDate = function() {
            var samplingDateTileData = {
                "tileid": ko.unwrap(self.samplingDateTile) || "",
                "nodegroup_id": samplingDateNodegroup,
                "parenttile_id": null,
                "resourceinstance_id": ko.unwrap(self.samplingActivityResourceId) || "",
                "sortorder": 0,
                "tiles": {},
                'data': {
                    "03357892-1d9d-11eb-a29f-024e0d439fdb": self.samplingDate(), //begin of the begin
                    "0335789d-1d9d-11eb-a29f-024e0d439fdb": self.samplingDate(), //begin of the end
                    "033578a1-1d9d-11eb-a29f-024e0d439fdb": self.samplingDate(), //end of the begin
                    "033578ae-1d9d-11eb-a29f-024e0d439fdb": null,  //label
                    "033578af-1d9d-11eb-a29f-024e0d439fdb": null,  //type
                    "033578c2-1d9d-11eb-a29f-024e0d439fdb": self.samplingDate()  //end of the end
                },
                'transaction_id': params.form.workflowId
            };
            var samplingDateTileid = ko.unwrap(self.samplingDateTile) || uuid.generate();
            return self.saveTile(samplingDateTileid, samplingDateTileData);
        };

        this.saveSamplingTechnique = function() {
            var samplingTechniqueTileData = {
                "tileid": ko.unwrap(self.samplingTechniqueTile) || "",
                "nodegroup_id": sampleStatementNodegroup,
                "parenttile_id": null,
                "resourceinstance_id": ko.unwrap(self.samplingActivityResourceId) || "",
                "sortorder": 0,
                "tiles": {},
                'data': {
                    '0335789a-1d9d-11eb-a29f-024e0d439fdb': ['bc35776b-996f-4fc1-bd25-9f6432c1f349'],
                    '033578a8-1d9d-11eb-a29f-024e0d439fdb': null,
                    '033578b6-1d9d-11eb-a29f-024e0d439fdb': null,
                    '033578b7-1d9d-11eb-a29f-024e0d439fdb': ['df8e4cf6-9b0b-472f-8986-83d5b2ca28a0','72202a9f-1551-4cbc-9c7a-73c02321f3ea'],
                    '033578c1-1d9d-11eb-a29f-024e0d439fdb': self.samplingTechnique()
                },
                'transaction_id': params.form.workflowId        
            };
            var samplingTechniqueTileid = ko.unwrap(self.samplingTechniqueTile) || uuid.generate();
            return self.saveTile(samplingTechniqueTileid, samplingTechniqueTileData);
        };

        this.saveSamplingMotivation = function() {
            var samplingMotivationTileData = {
                "tileid": ko.unwrap(self.samplingMotivationTile) || "",
                "nodegroup_id": sampleStatementNodegroup,
                "parenttile_id": null,
                "resourceinstance_id": ko.unwrap(self.samplingActivityResourceId) || "",
                "sortorder": 0,
                "tiles": {},
                'data': {
                    '0335789a-1d9d-11eb-a29f-024e0d439fdb': ['bc35776b-996f-4fc1-bd25-9f6432c1f349'],
                    '033578a8-1d9d-11eb-a29f-024e0d439fdb': null,
                    '033578b6-1d9d-11eb-a29f-024e0d439fdb': null,
                    '033578b7-1d9d-11eb-a29f-024e0d439fdb': ['7060892c-4d91-4ab3-b3de-a95e19931a61'],
                    '033578c1-1d9d-11eb-a29f-024e0d439fdb': self.samplingMotivation()
                },
                'transaction_id': params.form.workflowId        
            };
            var samplingMotivationTileid = ko.unwrap(self.samplingMotivationTile) || uuid.generate();
            return self.saveTile(samplingMotivationTileid, samplingMotivationTileData);
        };

        params.form.reset = function() {
            self.samplingActivityResourceId(snapshot.samplingActivityResourceId);
            self.samplers(snapshot.samplers);
            self.samplingDate(snapshot.samplingDate);
            self.samplingTechnique(snapshot.samplingTechnique);
            self.samplingMotivation(snapshot.samplingMotivation);
            self.samplingName(snapshot.samplingName);
            self.projectTile(snapshot.projectTile);
            self.physicalThingTile(snapshot.physicalThingTile);
            self.samplersTile(snapshot.samplersTile);
            self.samplingNameTile(snapshot.samplingNameTile);
            self.samplingDateTile(snapshot.samplingDateTile);
            self.samplingTechniqueTile(snapshot.samplingTechniqueTile);
            self.samplingMotivationTile(snapshot.samplingMotivationTile);
        };
    }

    ko.components.register('sampling-info-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/sample-taking-workflow/sampling-info-step.htm' }
    });
    return viewModel;
});
