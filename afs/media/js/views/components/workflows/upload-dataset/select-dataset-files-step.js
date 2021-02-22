define([
    'knockout',
    'knockout-mapping',
    'uuid',
    'arches',
    'utils/resource',
    'utils/physical-thing',
    'viewmodels/alert-json',
    'views/components/iiif-viewer',
    'views/components/workflows/component-based-step',
    'bindings/dropzone'
], function(ko, koMapping, uuid, arches, resourceUtils, physicalThingUtils, JsonErrorAlertViewModel, IIIFViewerViewmodel) {
    return ko.components.register('select-dataset-files-step', {
        viewModel: function(params) {
            IIIFViewerViewmodel.apply(this, [params]);
            var annotationNodeGroupId = "b3e171a7-1d9d-11eb-a29f-024e0d439fdb";
            var defaultColor;
            var self = this;
            this.annotationNodeId = "b3e171ae-1d9d-11eb-a29f-024e0d439fdb"
            this.annotationNameNodeId = "b3e171ac-1d9d-11eb-a29f-024e0d439fdb"
            this.selectedAnnotationTile = ko.observable();
            this.selectedSample = ko.observable();
            this.sampleFilter = ko.observable("");
            this.alert = params.alert;
            this.annotations = ko.observableArray([]);
            this.samples = ko.observableArray([]);
            this.uniqueId = uuid.generate();
            this.formData = new window.FormData();
            this.physicalThing = params.workflow.steps[0].value().pageLayout.sections[1].componentConfigs[0].value;
            this.uniqueidClass = ko.computed(function() {
                return "unique_id_" + self.uniqueId;
            });
            this.firstLoad = true;
            this.mainMenu = ko.observable(true);
            this.files = ko.observableArray([]);

            this.switchCanvas = function(canvasId){
                var canvas = self.canvases().find(c => c.images[0].resource.service['@id'] === canvasId);
                if (canvas) {
                    self.canvasClick(canvas);              
                }
            };

            this.highlightAnnotation = function(){
                if (self.map()) {
                    self.map().eachLayer(function(layer){
                        if (layer.eachLayer) {
                            layer.eachLayer(function(features){
                                if (features.eachLayer) {
                                    features.eachLayer(function(feature) {
                                        if (!defaultColor) {
                                            defaultColor = feature.feature.properties.color
                                        }
                                        if (self.selectedAnnotationTile().tileid === feature.feature.properties.tileId) {
                                            feature.setStyle({color: '#BCFE2B', fillColor: '#BCFE2B'});
                                        } else {
                                            feature.setStyle({color: defaultColor, fillColor: defaultColor});
                                        }
                                    });
                                }
                            });
                        }
                    })
                } 
            };

            this.getAnnotationProperty = function(tile, property){
                return tile.data[self.annotationNodeId].features[0].properties[property]
            }

            this.selectedSample.subscribe(function(data){
                self.annotations(data.tiles.filter(t => t.nodegroup_id === annotationNodeGroupId));
                if (self.annotations().length) {
                    self.selectedAnnotationTile(self.annotations()[0]);
                    if (self.manifest() !== self.getAnnotationProperty(self.selectedAnnotationTile(), "manifest")) {
                        self.manifest(self.getAnnotationProperty(self.selectedAnnotationTile(), "manifest"));
                        self.getManifestData();
                    }
                    self.switchCanvas(self.getAnnotationProperty(self.selectedAnnotationTile(), "canvas"));
                };
            });

            this.canvas.subscribe(function(val){
                if (typeof val === "string") {
                    annotationCanvas = self.getAnnotationProperty(self.selectedAnnotationTile(), "canvas");
                    if (annotationCanvas === val || self.firstLoad === true) {
                        self.switchCanvas(annotationCanvas);
                        self.firstLoad = false;
                    }
                }
            });

            this.addFiles = function(fileList) {
                Array.from(fileList).forEach(function(file) {
                    self.files.push(file);
                });
                if (self.files()) {
                    self.mainMenu(false);
                    self.activeTab('dataset');
                    self.annotationNodes.valueHasMutated()
                }
            };

            this.dropzoneOptions = {
                url: "arches.urls.root",
                dictDefaultMessage: '',
                autoProcessQueue: false,
                uploadMultiple: true,
                autoQueue: false,
                clickable: ".upload-dataset-files." + this.uniqueidClass(),
                previewsContainer: '#hidden-dz-previews',
                init: function() {
                    self.dropzone = this;
                    this.on("addedfiles", self.addFiles);
                    this.on("error", function(file, error) {
                        file.error = error;
                    });    
                }
            };

            this.init = function(){
                this.selectedAnnotationTile.subscribe(this.highlightAnnotation);
                resourceUtils.getRelatedInstances(this.physicalThing, '03357848-1d9d-11eb-a29f-024e0d439fdb')
                    .then(
                        function(samples){
                            self.samples(samples.related_resources);
                            self.samples().forEach(function(sample){
                                sample.datasetFiles = ko.observableArray([]);
                                sample.datasetName = ko.observable();
                                sample.datasetName.subscribe(function(val){
                                    console.log(val)
                                })
                            });
                            self.selectedSample(self.samples()[0]);
                            self.annotationNodes.subscribe(function(val){
                                var overlay = val.find(n => n.name.includes('Sampling Activity'));
                                if (overlay) {
                                    overlay.active(true);
                                    if (ko.unwrap(overlay.annotations) && overlay.annotations().length > 0) {
                                        self.highlightAnnotation();
                                    }
                                    overlay.annotations.subscribe(function(anno){
                                        self.highlightAnnotation();
                                        });
                                    }
                                });
                        }
                    );
            }

            this.init();
        },
        template: { require: 'text!templates/views/components/workflows/upload-dataset/select-dataset-files-step.htm' }
    });
});