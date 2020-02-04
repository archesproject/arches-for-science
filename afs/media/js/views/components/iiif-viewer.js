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
            var sequences = manifestData ? manifestData.sequences : [];
            sequences.forEach(function(sequence) {
                if (sequence.canvases) {
                    if (Array.isArray(sequence.label)) sequence.label = sequence.label[0]["@value"];
                    sequence.canvases.forEach(function(canvas) {
                        if (Array.isArray(canvas.label)) canvas.label = canvas.label[0]["@value"];
                        if (typeof canvas.thumbnail === 'object') canvas.thumbnail = canvas.thumbnail["@id"];
                    });
                }
            });
            return sequences;
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
        getManifestData(this.manifest());
        
        WorkbenchViewmodel.apply(this, [params]);
        
        this.showGallery = ko.observable(true);
        
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
        this.brightness = ko.observable(100);
        this.contrast = ko.observable(100);
        this.saturation = ko.observable(100);
        this.greyscale = ko.observable(false);
        this.canvasFilter = ko.pureComputed(function() {
            var brightness = self.brightness()/100;
            var contrast = self.contrast()/100;
            var saturation = self.saturation()/100;
            var greyscale = self.greyscale() ? 1 : 0;
            return 'brightness(' + brightness + ') contrast(' + contrast + ') ' +
                'saturate(' + saturation + ') grayscale(' + greyscale + ')';
        });
        var updateCanvasLayerFilter = function() {
            var filter = self.canvasFilter();
            var map = self.map();
            if (map) {
                map.getContainer().querySelector('.leaflet-tile-pane').style.filter = filter;
            }
        };
        this.canvasFilter.subscribe(updateCanvasLayerFilter);
        
        this.resetImageSettings = function() {
            self.brightness(100);
            self.contrast(100);
            self.saturation(100);
            self.greyscale(false);
        };

        var addCanvasLayer = function() {
            var map = self.map();
            var canvas = self.canvas();
            if (map && canvas) {
                if (canvasLayer) {
                    map.removeLayer(canvasLayer);
                    canvasLayer = undefined;
                }
                if (canvas) {
                    canvasLayer = L.tileLayer.iiif(canvas + '/info.json');
                    canvasLayer.addTo(map);
                    updateCanvasLayerFilter();
                }
            }
        };
        this.map.subscribe(addCanvasLayer);
        this.canvas.subscribe(addCanvasLayer);
        
        this.selectCanvas = function(canvas) {
            var service = self.getCanvasService(canvas);
            if (service) self.canvas(service);
        };
        
        this.getCanvasService = function(canvas) {
            if (canvas.images.length > 0) return canvas.images[0].resource.service['@id'];
        };
        
        this.manifestData.subscribe(function(manifestData) {
            if (!self.canvas() && manifestData.sequences.length > 0) {
                var sequence = manifestData.sequences[0];
                if (sequence.canvases.length > 0) {
                    var canvas = sequence.canvases[0];
                    self.selectCanvas(canvas);
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
