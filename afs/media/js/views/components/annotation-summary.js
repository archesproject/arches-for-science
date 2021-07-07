define([
    'knockout', 
    'geojson-extent',
    'leaflet',
    'viewmodels/widget',
    'views/components/iiif-viewer',
    'bindings/leaflet',
    'bindings/datatable'
], function(ko, geojsonExtent, L, WidgetViewModel, IIIFViewerViewmodel) {
    return ko.components.register('views/components/annotation-summary', {
        viewModel: function(params) {
            var self = this;

            this.map = ko.observable();
            this.selectedAnnotationTileId = ko.observable();
            var defaultColor;

            if (params.annotation.info[0]){
                columns = Object.keys(params.annotation.info[0]).length;
            }
            this.annotationTableConfig = {
                "info": false,
                "paging": false,
                "scrollCollapse": true,
                "searching": false,
                "ordering": false,
                "columns": [
                    null,
                    null,
                ]
            };

            this.prepareAnnotation = function(featureCollection) {
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

            this.leafletConfig = this.prepareAnnotation(params.annotation.featureCollection);

            this.highlightAnnotation = function(tileId){
                if (tileId !== self.selectedAnnotationTileId()){
                    self.selectedAnnotationTileId(tileId);
                } else {
                    self.selectedAnnotationTileId(null);
                }
                if (self.map()) {
                    self.map().eachLayer(function(layer){
                        if (layer.eachLayer) {
                            layer.eachLayer(function(feature){
                                if (!defaultColor) {
                                    defaultColor = feature.feature.properties.color;
                                }
                                if (self.selectedAnnotationTileId() === feature.feature.properties.tileId) {
                                    feature.setStyle({color: '#BCFE2B', fillColor: '#BCFE2B'});
                                } else {
                                    feature.setStyle({color: defaultColor, fillColor: defaultColor});
                                }
                            });
                        }
                    });
                } 
            };
        },
        template: {
            require: 'text!templates/views/components/annotation-summary.htm'
        }
    });
});
