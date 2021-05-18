define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'uuid',
    'viewmodels/card-component'
], function(_, $, arches, ko, koMapping, uuid, CardComponentViewModel) {
    function viewModel(params) {
        var self = this;

        this.samplingActivityValue = ko.observable();
        this.samplers = ko.observable();
        this.samplingDate = ko.observable();
        this.samplingTechnique = ko.observable();
        this.samplingName = ko.observable();
        this.projectTile = ko.observable();
        this.physicalThingTile = ko.observable();
        this.samplersTile = ko.observable();
        this.samplingNameTile = ko.observable();
        this.samplingDateTile = ko.observable();
        this.samplingTechniqueTile = ko.observable();
        this.showName = ko.observable(false);
        console.log(params.value())
        if (params.value()){
            self.samplers(ko.unwrap(params.value).samplers);
            self.samplingDate(ko.unwrap(params.value).samplingDate);
            self.samplingTechnique(ko.unwrap(params.value).samplingTechnique);
            self.samplingName(ko.unwrap(params.value).samplingName);
            self.projectTile(ko.unwrap(params.value).projectTile);
            self.physicalThingTile(ko.unwrap(params.value).physicalThingTile);
            self.samplersTile(ko.unwrap(params.value).samplersTile);
            self.samplingNameTile(ko.unwrap(params.value).samplingNameTile);
            self.samplingDateTile(ko.unwrap(params.value).samplingDateTile);
            self.samplingTechniqueTile(ko.unwrap(params.value).samplingTechniqueTile);
        }

        var samplersNode = '03357870-1d9d-11eb-a29f-024e0d439fdb'; //also a nodegroupid
        var sampleTechniqueNodegroup = '0335786d-1d9d-11eb-a29f-024e0d439fdb';
        var samplingNameNode = '033578c0-1d9d-11eb-a29f-024e0d439fdb';
        var parentProjectNode = '03357879-1d9d-11eb-a29f-024e0d439fdb'; //related project
        var overallObjectSampleNode = 'b3e171aa-1d9d-11eb-a29f-024e0d439fdb'; //related phys thing
        var samplingDateNodegroup = '03357852-1d9d-11eb-a29f-024e0d439fdb'

        this.saveValues = function(){
            params.value({
                samplers: self.samplers(),
                samplingDate: self.samplingDate(),
                samplingTechnique: self.samplingTechnique(),
                samplingName: self.samplingName(),
                projectTile: self.projectTile(),
                physicalThingTile: self.physicalThingTile(),      
                samplersTile: self.samplersTile(),
                samplingNameTile: self.samplingNameTile(),
                samplingTechniqueTile: self.samplingTechniqueTile(),
            })
            console.log(params.value())
            console.log(params.form.addedData())
            console.log(params.form.savedData())
        }

        this.samplers.subscribe(function(){
            self.saveValues();
        })

        this.samplingDate.subscribe(function(val){
            self.samplingName(["Sample for", self.physicalThingNameValue, val].join(' '));
            self.saveValues();
        })

        this.samplingTechnique.subscribe(function(){
            self.saveValues();
        })

        this.samplingName.subscribe(function(){
            self.saveValues();
        })

        this.projectValue = params.form.externalStepData.selectprojectstep.data['select-phys-thing'][0][1]["project"];
        this.physicalThingNameValue = params.form.externalStepData.selectprojectstep.data['select-phys-thing'][0][1]["physThingName"];
        this.physicalThingValue = params.form.externalStepData.selectprojectstep.data['select-phys-thing'][0][1]["physicalThing"];

        params.form.save = function(){
            $.ajax({
                url: arches.urls.api_node_value,
                type: 'POST',
                data: {
                    'nodeid': samplingNameNode,
                    'data': self.samplingName(),
                    'resourceinstanceid': ko.unwrap(self.samplingActivityValue),
                    'tileid': self.samplingNameTile()
                }
            }).done(function(data) {
                self.samplingActivityValue(data.resourceinstance_id);
                self.samplingNameTile(data.tileid);
                
                self.saveProject();
                self.savePhysicalThing();
                self.saveSamplers();
                self.saveSamplingDate();
                self.saveSamplingTechnique();

                params.form.complete(true);
                params.form.savedData(params.form.addedData());
            })
        }

        this.saveProject = function() {
            $.ajax({
                url: arches.urls.api_node_value,
                type: 'POST',
                data: {
                    'nodeid': parentProjectNode,
                    'data': JSON.stringify([{
                        'resourceId': self.projectValue,  // resourceid of the project
                        'ontologyProperty': '',
                        'inverseOntologyProperty':'',
                        'resourceXresourceId':''
                    }]),
                    'resourceinstanceid': ko.unwrap(self.samplingActivityValue),
                    'tileid': self.projectTile()
                }
            }).done(function(data) {
                self.projectTile(data.tileid);
            });
        }

        this.savePhysicalThing = function() {
            $.ajax({
                url: arches.urls.api_node_value,
                type: 'POST',
                data: {
                    'nodeid': overallObjectSampleNode,
                    'data': JSON.stringify([{
                        'resourceId': self.physicalThingValue,  // resourceid of the physical thing
                        'ontologyProperty': '',
                        'inverseOntologyProperty':'',
                        'resourceXresourceId':''
                    }]),
                    'resourceinstanceid': ko.unwrap(self.samplingActivityValue),
                    'tileid': self.physicalThingTile()
                }
            }).done(function(data) {
                self.physicalThingTile(data.tileid);
            });

        }

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
            $.ajax({
                url: arches.urls.api_node_value,
                type: 'POST',
                data: {
                    'nodeid': samplersNode,
                    'data': JSON.stringify(samplersData),
                    'resourceinstanceid': ko.unwrap(self.samplingActivityValue),
                    'tileid': self.samplersTile()
                }
            }).done(function(data) {
                self.samplersTile(data.tileid);
            });
        }

        this.saveSamplingDate = function() {
            $.ajax({
                url: arches.urls.api_tiles(ko.unwrap(self.samplingDateTile) || uuid.generate()),
                type: 'POST',
                dataType: 'json',
                data: JSON.stringify({
                    "tileid": ko.unwrap(self.samplingDateTile) || "",
                    "nodegroup_id": samplingDateNodegroup,
                    "parenttile_id": null,
                    "resourceinstance_id": ko.unwrap(self.samplingActivityValue) || "",
                    "sortorder": 0,
                    "tiles": {},
                    'data': {
                        "03357892-1d9d-11eb-a29f-024e0d439fdb": self.samplingDate(), //begin of the begin
                        "0335789d-1d9d-11eb-a29f-024e0d439fdb": self.samplingDate(), //begin of the end
                        "033578a1-1d9d-11eb-a29f-024e0d439fdb": self.samplingDate(), //end of the begin
                        "033578ae-1d9d-11eb-a29f-024e0d439fdb": null,  //label
                        "033578af-1d9d-11eb-a29f-024e0d439fdb": null,  //type
                        "033578c2-1d9d-11eb-a29f-024e0d439fdb": self.samplingDate()  //end of the end
                    }
                })
            }).done(function(data) {
                self.samplingDateTile(data.tileid);
            });
        }

        this.saveSamplingTechnique = function() {
            $.ajax({
                url: arches.urls.api_tiles(ko.unwrap(self.samplingTechniqueTile) || uuid.generate()),
                type: 'POST',
                dataType: 'json',
                data: JSON.stringify({
                    "tileid": ko.unwrap(self.samplingTechniqueTile) || "",
                    "nodegroup_id": sampleTechniqueNodegroup,
                    "parenttile_id": null,
                    "resourceinstance_id": ko.unwrap(self.samplingActivityValue) || "",
                    "sortorder": 0,
                    "tiles": {},
                    'data': {
                        '0335789a-1d9d-11eb-a29f-024e0d439fdb': ['bc35776b-996f-4fc1-bd25-9f6432c1f349'],
                        '033578a8-1d9d-11eb-a29f-024e0d439fdb': null,
                        '033578b6-1d9d-11eb-a29f-024e0d439fdb': null,
                        '033578b7-1d9d-11eb-a29f-024e0d439fdb': ['df8e4cf6-9b0b-472f-8986-83d5b2ca28a0','72202a9f-1551-4cbc-9c7a-73c02321f3ea'],
                        '033578c1-1d9d-11eb-a29f-024e0d439fdb': self.samplingTechnique()
                    }        
                })
            }).done(function(data) {
                self.samplingTechniqueTile(data.tileid);
            });
        }
    }

    ko.components.register('sampling-info-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/sample-taking-workflow/sampling-info-step.htm' }
    });
    return viewModel;
});
