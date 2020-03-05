define([
    'underscore',
    'knockout',
    'knockout-mapping',
    'leaflet',
    'views/components/iiif-viewer',
    'leaflet-draw'
], function(_, ko, koMapping, L, IIIFViewerViewmodel) {
    var viewModel = function(params) {
        var self = this;
        var drawControl;
        var drawnItems;
        var editItems = new L.FeatureGroup();
        var tools;

        this.widgets = params.widgets || [];
        this.newNodeId = null;
        this.featureLookup = {};
        this.selectedFeatureIds = ko.observableArray();
        
        this.cancelDrawing = function() {
            _.each(tools, function(tool) {
                tool.disable();
            });
        };

        this.setDrawTool = function(tool) {
            self.cancelDrawing();
            if (tool && tools) tools[tool].enable();
        };

        self.widgets.forEach(function(widget) {
            var id = ko.unwrap(widget.node_id);
            self.featureLookup[id] = {
                features: ko.computed(function() {
                    var value = koMapping.toJS(self.tile.data[id]);
                    if (value) return value.features;
                    else return [];
                }),
                selectedTool: ko.observable()
            };
            self.featureLookup[id].selectedTool.subscribe(function(tool) {
                if (drawControl) {
                    if (tool) {
                        _.each(self.featureLookup, function(value, key) {
                            if (key !== id) {
                                value.selectedTool(null);
                            }
                        });
                        self.newNodeId = id;
                    }
                    self.setDrawTool(tool);
                }
            });
        });

        this.selectedTool = ko.pureComputed(function() {
            var tool;
            _.find(self.featureLookup, function(value) {
                var selectedTool = value.selectedTool();
                if (selectedTool) tool = selectedTool;
            });
            return tool;
        });

        this.editing = ko.pureComputed(function() {
            return !!(self.selectedFeatureIds().length > 0 || self.selectedTool());
        });
        
        this.updateTiles = function() {
            var featureCollection = {
                features: drawFeatures
            };
            _.each(self.featureLookup, function(value) {
                value.selectedTool(null);
            });
            self.widgets.forEach(function(widget) {
                var id = ko.unwrap(widget.node_id);
                var features = [];
                featureCollection.features.forEach(function(feature){
                    if (feature.properties.nodeId === id) features.push(feature);
                });
                if (ko.isObservable(self.tile.data[id])) {
                    self.tile.data[id]({
                        type: 'FeatureCollection',
                        features: features,
                        manifest: self.manifest()
                    });
                } else {
                    self.tile.data[id].features(features);
                }
            });
        };
        
        var drawFeatures = [];
        self.widgets.forEach(function(widget) {
            var id = ko.unwrap(widget.node_id);
            var featureCollection = koMapping.toJS(self.tile.data[id]);
            if (featureCollection) {
                if (featureCollection.manifest && !params.manifest)
                    params.manifest = featureCollection.manifest;
                featureCollection.features.forEach(function(feature) {
                    if (feature.properties.canvas && !params.canvas)
                        params.canvas = feature.properties.canvas;
                    feature.properties.nodeId = id;
                });
                drawFeatures = drawFeatures.concat(featureCollection.features);
            }
        });
        
        params.activeTab = 'editor';
        IIIFViewerViewmodel.apply(this, [params]);
        
        var drawLayer = ko.computed(function() {
            return L.geoJson({
                type: 'FeatureCollection',
                features: drawFeatures
            }, {
                pointToLayer: function(feature, latlng) {
                    return L.circleMarker(latlng);
                },
                style: function() {
                    return {};
                },
                filter: function(feature) {
                    return feature.properties.canvas === self.canvas();
                }
            });
        });

        var oldDrawLayer = drawLayer();
        drawLayer.subscribe(function(newDrawLayer) {
            var map = self.map();
            if (map) {
                map.removeLayer(oldDrawLayer);
                map.addLayer(newDrawLayer);
                oldDrawLayer = newDrawLayer;
            }
        });
        
        this.map.subscribe(function(map) {
            if (map && !drawControl) {
                map.addLayer(oldDrawLayer);
                map.addLayer(editItems);
                
                drawControl = new L.Control.Draw({
                    edit: {
                        featureGroup: editItems
                    }
                });
                map.addControl(drawControl);
                
                tools = {
                    'draw_point': new L.Draw.CircleMarker(map, drawControl.options.circlemarker),
                    'draw_line_string': new L.Draw.Polyline(map, drawControl.options.polyline),
                    'draw_polygon': new L.Draw.Polygon(map, drawControl.options.polygon)
                };
                map.on('draw:created', function(e) {
                    var layer = e.layer;
                    layer.feature = layer.feature || {
                        type: 'Feature',
                        properties: {
                            nodeId: self.newNodeId,
                            canvas: self.canvas()
                        }
                    };
                    drawFeatures.push(layer.toGeoJSON());
                    drawLayer().addLayer(layer);
                    self.updateTiles();
                });
            }
        });
    };
    return viewModel;
});
