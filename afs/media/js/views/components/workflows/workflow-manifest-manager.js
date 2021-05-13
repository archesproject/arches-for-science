define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'views/components/plugins/manifest-manager',
], function(_, $, arches, ko, koMapping) {
    function viewModel(params) {
        var self = this;

        var objectStepData = params.form.externalStepData['objectstep']['data'];
        this.physicalThingData = koMapping.toJS(objectStepData['sample-object-resource-instance'][0][1][0]);

        console.log("physicalThingData", this.physicalThingData)

        this.isManifestManagerHidden = ko.observable(true);

        this.manifestData = ko.observable();
        this.manifestData.subscribe(function(foo) {
            console.log("manifestData", foo, params)
        })

        this.initialize = function() {
            var visualWorkPromise = this.createVisualWork(self.physicalThingData);

            visualWorkPromise.then(function(visualWorkData) {
                console.log("visualWorkData", visualWorkData)

                var physicalThingUpdatePromise = self.updatePhysicalThingWithVisualWork(visualWorkData);

                physicalThingUpdatePromise.then(function(physicalThingUpdateData) {
                    console.log("physicalThingUpdateData", physicalThingUpdateData);
                });

                var createDigitalResourcePromise = self.createDigitalResource(visualWorkData);

                createDigitalResourcePromise.then(function(digitalResourceData) {
                    console.log("digitalResourceData", digitalResourceData)

                    var digitalResourceUpdatePromise = self.updateDigitalResourceWithVisualWork(digitalResourceData);

                    digitalResourceUpdatePromise.then(function(digitalResourceUpdateData) {
                        console.log("digitalResourceUpdateData", digitalResourceUpdateData)
                    });
                });
                
            });
        };

        this.toggleManifestManagerHidden = function() {
            self.isManifestManagerHidden(!self.isManifestManagerHidden());
        };

        this.createVisualWork = function(physicalThingData) {
            return $.ajax({
                url: arches.urls.api_node_value,
                type: 'POST',
                dataType: 'json',
                data: {
                    'nodeid': 'a298ee52-8d59-11eb-a9c4-faffc265b501', // Digital Source (E73) (physical thing)
                    'data': physicalThingData, 
                    'tileid': null 
                }
            })
        };

        this.updatePhysicalThingWithVisualWork = function(visualWorkData) {
            return $.ajax({
                url: arches.urls.api_node_value,
                type: 'POST',
                data: {
                    'resourceinstanceid': self.physicalThingData.resourceId,
                    'nodeid': 'a298ee52-8d59-11eb-a9c4-faffc265b501', // Digital Source (E73) (physical thing)
                    'data': visualWorkData,
                    'tileid': null,
                }
            })
        };

        this.createDigitalResource = function(visualWorkData) {
            return $.ajax({
                url: arches.urls.api_node_value,
                type: 'POST',
                data: {
                    'nodeid': 'c1e732b0-ca7a-11e9-b369-a4d18cec433a', // shows (visual work)
                    'data': visualWorkData,
                    'tileid': null,
                }
            });
        };

        this.updateDigitalResourceWithVisualWork = function(visualWorkData) {
            return $.ajax({
                url: arches.urls.api_node_value,
                type: 'POST',
                data: {
                    'resourceinstanceid': visualWorkData.resourceinstance_id,
                    'nodeid': '9743a1b2-8591-11ea-97eb-acde48001122', // Used image (visual work)
                    'data': visualWorkData,
                    'tileid': null,
                }
            })
        };

        this.initialize();
    }

    ko.components.register('workflow-manifest-manager', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/workflow-manifest-manager.htm' }
    });
    return viewModel;
});
