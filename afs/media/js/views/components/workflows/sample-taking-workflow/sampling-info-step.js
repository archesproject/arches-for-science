define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'viewmodels/card-component'
], function(_, $, arches, ko, koMapping, CardComponentViewModel) {
    function viewModel(params) {
        var self = this;

        this.samplers = ko.observable();
        this.samplingDate = ko.observable();
        this.samplingTechnique = ko.observable();
        this.samplingName = ko.observable();
        this.samplersTile = ko.observable();
        this.samplingNameTile = ko.observable();
        this.samplingTechniqueTile = ko.observable();

        if (params.value()){
            self.samplers(ko.unwrap(params.value).samplers);
            self.samplingDate(ko.unwrap(params.value).samplingDate);
            self.samplingTechnique(ko.unwrap(params.value).samplingTechnique);
            self.samplingName(ko.unwrap(params.value).samplingName);
            self.samplersTile(ko.unwrap(params.value).samplersTile);
            self.samplingNameTile(ko.unwrap(params.value).samplingNameTile);
            self.samplingTechniqueTile(ko.unwrap(params.value).samplingTechniqueTile);
            console.log(self.samplers(), self.samplingDate(), self.samplingTechnique());
        }

        this.showName = ko.observable(false);

        var samplersNode = '03357870-1d9d-11eb-a29f-024e0d439fdb';
        var sampleTechniqueNode = '033578c1-1d9d-11eb-a29f-024e0d439fdb';
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
                samplersTile: self.samplersTile(),
                samplingNameTile: self.samplingNameTile(),
                samplingTechniqueTile: self.samplingTechniqueTile(),
            })
        }

        this.samplers.subscribe(function(val){
            if (!params.value()) { self.saveValues() }
            params.value()['samplers'] = val;
            console.log(params.value())
        })

        this.samplingDate.subscribe(function(val){
            if (!params.value()) { self.saveValues() }
            params.value()['samplingDate'] = val;
            self.samplingName(["Sample for", self.physicalThingNameValue, val].join(' '));
        })

        this.samplingTechnique.subscribe(function(val){
            if (!params.value()) { self.saveValues() }
            params.value()['samplingTechnique'] = val;
        })

        this.projectValue = params.form.externalStepData.selectprojectstep.data['select-phys-thing'][0][1]["project"];
        this.physicalThingNameValue = params.form.externalStepData.selectprojectstep.data['select-phys-thing'][0][1]["physThingName"];
        this.physicalThingValue = params.form.externalStepData.selectprojectstep.data['select-phys-thing'][0][1]["physicalThing"];

        this.saveSamplingActivity = function() {
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
                self.samplingActivityValue(data.resourceinstance_id);
                self.projectTile(data.tileid);

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
            })
        }

        this.saveSamplers = function() {
            $.ajax({
                url: arches.urls.api_node_value,
                type: 'POST',
                data: {
                    'nodeid': samplersNode,
                    'data': JSON.stringify([{
                        'resourceId': self.samplers(),  // resourceid of the person
                        'ontologyProperty': '',
                        'inverseOntologyProperty':'',
                        'resourceXresourceId':''
                    }]),
                    'resourceinstanceid': ko.unwrap(self.samplingActivityValue),
                    'tileid': self.samplersTile()
                }
            })
        }

        this.saveSamplingDate = function() {
            $.ajax({
                url: arches.urls.api_tiles(uuid.generate()),
                type: 'POST',
                dataType: 'json',
                data: JSON.stringify({
                    'nodeid': samplingDateNodegroup,
                    'data': JSON.stringify({
                        "03357892-1d9d-11eb-a29f-024e0d439fdb": value, //begin of the begin
                        "0335789d-1d9d-11eb-a29f-024e0d439fdb": value, //begin of the end
                        "033578a1-1d9d-11eb-a29f-024e0d439fdb": value, //end of the begin
                        "033578ae-1d9d-11eb-a29f-024e0d439fdb": null,  //label
                        "033578af-1d9d-11eb-a29f-024e0d439fdb": null,  //type
                        "033578c2-1d9d-11eb-a29f-024e0d439fdb": value  //end of the end
                    }),
                    'resourceinstanceid': ko.unwrap(self.samplingActivityValue),
                    'tileid': self.samplingDateTile()
                })
            }).done(function(data) {
                console.log(data);
                self.samplingDateTile(data);
            });
        }

        this.saveSamplingTechnique = function() {
            $.ajax({
                url: arches.urls.api_node_value,
                type: 'POST',
                data: {
                    'nodeid': sampleTechniqueNode,
                    'data': self.samplingTechnique(),
                    'resourceinstanceid': ko.unwrap(self.samplingActivityValue),
                    'tileid': self.samplingTechniqueTile()
                }
            })
        }

        this.saveSamplingActivityName = function() {
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
                self.samplingNameTile(data.tileid);
            });
        }
    }

    ko.components.register('sampling-info-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/sample-taking-workflow/sampling-info-step.htm' }
    });
    return viewModel;
});
