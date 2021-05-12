define([
    'knockout',
    'arches',
    'views/components/workflows/upload-dataset/select-phys-thing-step'
], function(ko, arches, SelectPhysThingStep) {

    function viewModel(params) {
        var self = this;
        SelectPhysThingStep.apply(self, [params])

        this.samplingActivityValue = ko.observable();
        this.projectTile = ko.observable();
        this.physicalThingTile = ko.observable();
        var parentProjectNode = '03357879-1d9d-11eb-a29f-024e0d439fdb'; //related project
        var overallObjectSampleNode = 'b3e171aa-1d9d-11eb-a29f-024e0d439fdb'; //related phys thing

        if (params.value()) {
            console.log(params.value())
            this.physicalThingValue(params.value().physicalThing);
            this.physicalThingSetValue(params.value().physicalThingSet);
            this.projectValue(params.value().project);
            this.samplingActivityValue(params.value().samplingActivity);
            this.projectTile(params.value().projectTile);
            this.physicalThingTile(params.value().physicalThingTile);
        }

        this.physicalThingValue.subscribe(function(val){
            params.value({
                physicalThing: self.physicalThingValue(),
                physicalThingSet: self.physicalThingSetValue(),
                project: self.projectValue(),
                samplingActivity: self.samplingActivityValue(),
                projectTile: self.projectTile(),
                physicalThingTile: self.physicalThingTile()
            });
            self.save();
        });

        this.save = function() {
            console.log("before saving",self.samplingActivityValue())
            $.ajax({
                url: arches.urls.api_node_value,
                type: 'POST',
                data: {
                    'nodeid': parentProjectNode,
                    'data': JSON.stringify([{
                        'resourceId': ko.unwrap(self.projectValue),  // resourceid of the project
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
                console.log("after saved",self.samplingActivityValue())
                $.ajax({
                    url: arches.urls.api_node_value,
                    type: 'POST',
                    data: {
                        'nodeid': overallObjectSampleNode,
                        'data': JSON.stringify([{
                            'resourceId': ko.unwrap(self.physicalThingValue),  // resourceid of the physical thing
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
    }

    ko.components.register('select-phys-thing-to-sample', {
        viewModel: viewModel,
        template: {
            require: 'text!templates/views/components/workflows/upload-dataset/select-phys-thing-step.htm'
        }
    });

    return viewModel;
});
