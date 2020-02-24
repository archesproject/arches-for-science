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
        var drawnItems = new L.FeatureGroup();
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
        
        params.activeTab = 'editor';
        IIIFViewerViewmodel.apply(this, [params]);
        
        this.map.subscribe(function(map) {
            if (map && !drawControl) {
                map.addLayer(drawnItems);
                map.addLayer(editItems);
                
                drawControl = new L.Control.Draw({
                    edit: {
                        featureGroup: editItems
                    }
                });
                map.addControl(drawControl);
                
                tools = {
                    'draw_point': new L.Draw.Marker(map, drawControl.options.marker),
                    'draw_line_string': new L.Draw.Polyline(map, drawControl.options.polyline),
                    'draw_polygon': new L.Draw.Polygon(map, drawControl.options.polygon)
                };
                map.on(L.Draw.Event.CREATED, function(e) {
                    var layer = e.layer;
                    drawnItems.addLayer(layer);
                });
            }
        });
    };
    return viewModel;
});
