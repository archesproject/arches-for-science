define([
    'knockout', 
    'geojson-extent',
    'leaflet',
    'utils/report',
    'viewmodels/widget',
    'views/components/iiif-viewer',
    'bindings/leaflet',
    'bindings/datatable'
], function(ko, geojsonExtent, L, reportUtils) {
    return ko.components.register('views/components/reports/scenes/annotation-parts', {
        viewModel: function(params) {
            var self = this;

            Object.assign(self, reportUtils);
            self.map = ko.observable();
            self.selectedAnnotationTileId = params.selectedAnnotationTileId || ko.observable();

            self.prepareAnnotation = function(featureCollection) {
                var canvas = featureCollection.features[0].properties.canvas;

                var afterRender = function(map) {
                    L.tileLayer.iiif(canvas + '/info.json').addTo(map);
                    var extent = geojsonExtent(featureCollection);
                    map.addLayer(L.geoJson(featureCollection, {
                        pointToLayer: function(feature, latlng) {
                            return L.circleMarker(latlng, feature.properties);
                        },
                        style: function(feature) {
                            return feature.properties;
                        },
                        onEachFeature: function(feature, layer) {
                            layer.on('click', function() {
                                if (feature.properties && feature.properties.tileId){
                                    self.highlightAnnotation(feature.properties.tileId);
                                }
                            });
                        }
                    }));
                    L.control.fullscreen().addTo(map);
                    setTimeout(function() {
                        map.fitBounds([
                            [extent[1]-1, extent[0]-1],
                            [extent[3]+1, extent[2]+1]
                        ]);
                    }, 250);
                    self.map(map);
                };

                return {
                    center: [0, 0],
                    crs: L.CRS.Simple,
                    zoom: 0,
                    afterRender: afterRender
                };
            };

            self.leafletConfig = this.prepareAnnotation(params.annotation.featureCollection);

            self.highlightAnnotation = function(tileId){
                if (tileId !== self.selectedAnnotationTileId()){
                    self.selectedAnnotationTileId(tileId);
                } else {
                    self.selectedAnnotationTileId(null);
                }
            };

            self.selectedAnnotationTileId.subscribe(tileId => {
                if (self.map()) {
                    self.map().eachLayer(function(layer){
                        if (layer.eachLayer) {
                            layer.eachLayer(function(feature){
                                const defaultColor = feature.feature.properties.color;

                                if (tileId === feature.feature.properties.tileId) {
                                    feature.setStyle({color: '#BCFE2B', fillColor: '#BCFE2B'});
                                } else {
                                    feature.setStyle({color: defaultColor, fillColor: defaultColor});
                                }
                            });
                        }
                    });
                };
            });
        },
        template: {
            require: 'text!templates/views/components/reports/scenes/annotation-parts.htm'
        }
    });
});
