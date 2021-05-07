define([
    'knockout',
    'uuid',
    'arches',
    'views/components/workflows/summary-step',
    'geojson-extent',
    'leaflet',
    'leaflet-iiif',
    'bindings/leaflet'
], function(ko, uuid, arches, SummaryStep, geojsonExtent, L) {

    function viewModel(params) {
        var self = this;
        params.form.resourceId('c05e4213-dc08-46e5-bb8a-b72bae96f2cb')
        SummaryStep.apply(this, [params]);

        this.resourceData.subscribe(function(val){
            this.reportVals = {
                projectName: {'name': 'Project', 'value': this.getResourceValue(val.resource, ['part of','@value'])},
                sampledObjectName: {'name': 'Sampled Object', 'value': this.getResourceValue(val.resource['Sampling Unit'][0], [,'Sampling Area','Overall Object Sampled','@value'])},
                samplers: {'name': 'Samplers', 'value': this.getResourceValue(val.resource, ['carried out by','@value'])},
                samplingDate: {'name': 'Sampling Date', 'value': this.getResourceValue(val.resource, ['TimeSpan','TimeSpan_begin of the begin','@value'])},
                statement: {'name': 'Technique', 'value': this.getResourceValue(val.resource['Statement'][0], ['Statement_content','@value'])},
                samplingActivityName: {'name': 'Sampling Activity Name', 'value': this.getResourceValue(val.resource, ['Name','Name_content','@value'])},
            };

            var annotationJson = JSON.parse(self.getResourceValue(val.resource['Sampling Unit'][0],['Sampling Area','Sampling Area Identification','Sampling Area Visualization','@value']).replaceAll("'",'"'))
            try {
                this.reportVals.annotations = annotationJson.features.map(function(val){
                    return {
                        id:  {'name': 'id', 'value': self.getResourceValue(val, ['id'])},
                        manifest: {'name': 'manifest', 'value': self.getResourceValue(val, ['properties', 'manifest'])},
                        type: {'name': 'type', 'value': self.getResourceValue(val, ['geometry', 'type'])},
                    };
                })
            } catch(e) {
                console.log(e)
                this.reportVals.annotations = [];
            }

            this.leafletConfig = {
                center: [0, 0],
                crs: L.CRS.Simple,
                zoom: 0,
                afterRender: function(map) {
                    var canvas = annotationJson.features[0].properties.canvas;

                    L.tileLayer.iiif(canvas + '/info.json').addTo(map);
                    var extent = geojsonExtent(annotationJson);
                    map.addLayer(L.geoJson(annotationJson, {
                        pointToLayer: function(feature, latlng) {
                            return L.circleMarker(latlng, feature.properties);
                        },
                        style: function(feature) {
                            return feature.properties;
                        }
                    }));
                    L.control.fullscreen().addTo(map);
                    setTimeout(function() {
                        map.fitBounds([
                            [extent[1]-1, extent[0]-1],
                            [extent[3]+1, extent[2]+1]
                        ]);
                    }, 250);
                }
            };
        
            this.loading(false);
        }, this);
    }

    ko.components.register('sample-taking-final-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/sample-taking-workflow/sample-taking-final-step.htm' }
    });
    return viewModel;
});
