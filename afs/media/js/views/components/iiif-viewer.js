define([
    'knockout',
    'leaflet',
    'views/components/workbench',
    'leaflet-iiif',
    'bindings/leaflet'
], function(ko, L, WorkbenchViewmodel) {
    var IIIFViewerViewmodel = function(params) {
        var self = this;
        
        this.map = ko.observable();
        this.manifest = ko.observable(params.manifest);
        this.canvas = ko.observable(params.canvas);
        this.manifestData = ko.observable();
        this.sequences = ko.pureComputed(function() {
            var manifestData = self.manifestData();
            return manifestData ? manifestData.sequences : [];
        });
        
        var getManifestData = function(manifestURL) {
            if (manifestURL) {
                fetch(manifestURL)
                    .then(function(response) {
                        return response.json();
                    })
                    .then(function(manifestData) {
                        self.manifestData(manifestData);
                    });
            }
        };
        this.manifest.subscribe(getManifestData);
        getManifestData(params.manifest);
        
        WorkbenchViewmodel.apply(this, [params]);
        
        this.showGallery = ko.observable(false);
        
        this.toggleGallery = function() {
            self.showGallery(!self.showGallery());
        };
        
        this.leafletConfig = {
            center: [0, 0],
            crs: L.CRS.Simple,
            zoom: 0,
            afterRender: this.map
        };

        var canvasLayer;
        var addCanvasLayer = function() {
            var map = self.map();
            var canvas = self.canvas();
            if (map && canvas) {
                if (canvasLayer) {
                    map.removeLayer(canvasLayer);
                    canvasLayer = undefined;
                }
                if (canvas) {
                    canvasLayer = L.tileLayer.iiif(
                        canvas + '/info.json'
                    ).addTo(map);
                }
            }
        };
        this.map.subscribe(addCanvasLayer);
        this.canvas.subscribe(addCanvasLayer);
        this.manifestData.subscribe(function(manifestData) {
            if (!self.canvas() && manifestData.sequences.length > 0) {
                var sequence = manifestData.sequences[0];
                if (sequence.canvases.length > 0) {
                    var canvas = sequence.canvases[0];
                    if (canvas.images.length > 0) {
                        self.canvas(canvas.images[0].resource.service['@id']);
                    }
                }
            }
        });
    };
    ko.components.register('iiif-viewer', {
        viewModel: IIIFViewerViewmodel,
        template: {
            require: 'text!templates/views/components/iiif-viewer.htm'
        }
    });
    return IIIFViewerViewmodel;
});
