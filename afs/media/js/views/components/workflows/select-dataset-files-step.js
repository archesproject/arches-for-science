define([
    'knockout',
    'knockout-mapping',
    'uuid',
    'arches',
    'utils/resource',
    'utils/physical-thing',
    'viewmodels/alert-json',
    'views/components/iiif-viewer',
    'bindings/dropzone'
], function(ko, koMapping, uuid, arches, resourceUtils, physicalThingUtils, JsonErrorAlertViewModel, IIIFViewerViewmodel) {
    return ko.components.register('select-dataset-files-step', {
        viewModel: function(params) {
            var self = this;
            var partNodeId = "fec59582-8593-11ea-97eb-acde48001122";
            this.annotationNodeId = "97c30c42-8594-11ea-97eb-acde48001122"
            this.annotationNameNodeId = "3e541cc6-859b-11ea-97eb-acde48001122"
            this.selectedAnnotation = ko.observable();
            this.annotationFilter = ko.observable("");
            this.alert = params.alert;
            this.annotations = ko.observableArray([]);
            IIIFViewerViewmodel.apply(this, [params]);
            this.uniqueId = uuid.generate();
            this.formData = new window.FormData();
            this.physicalThing = params.workflow.steps[0].value().pageLayout.sections[1].componentConfigs[0].value;
            this.uniqueidClass = ko.computed(function() {
                return "unique_id_" + self.uniqueId;
            });

            var defaultColor;
            var highlightAnnotation = function(){
                self.map().eachLayer(function(layer){
                    if (layer.eachLayer) {
                        layer.eachLayer(function(features){
                            if (features.eachLayer) {
                                features.eachLayer(function(feature) {
                                    if (!defaultColor) {
                                        defaultColor = feature.feature.properties.color
                                    }
                                    if (self.selectedAnnotation().tileid === feature.feature.properties.tileId) {
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
            
            this.selectedAnnotation.subscribe(highlightAnnotation);
            resourceUtils.lookupResourceInstanceData(this.physicalThing)
                .then(function(data) {
                    self.annotations(data._source.tiles.filter(t => t.nodegroup_id === partNodeId));
                    if (self.annotations().length) {
                        self.selectedAnnotation(self.annotations()[0]);
                        self.manifest(self.selectedAnnotation().data[self.annotationNodeId].features[0].properties.manifest);
                        self.getManifestData();
                        self.activeTab('dataset');
                        self.annotationNodes.subscribe(function(val){
                            var overlay = val.find(n => n.name.includes('Physical Thing'));
                            if (overlay) {
                                overlay.active(true);
                                overlay.annotations.subscribe(function(){
                                    highlightAnnotation();
                                    });
                                }
                            });
                        };
                    })

            this.canvas.subscribe(function(val){
                if (typeof val === "string") {
                    var canvas = self.canvases().find(c => c.images[0].resource.service['@id'] === val);
                    self.canvasClick(canvas);

                }
            })

            this.addFiles = function(fileList) {
                Array.from(fileList).forEach(function(file) {
                    self.formData.append("files", file, file.name);
                });
            };

            this.dropzoneOptions = {
                url: "arches.urls.root",
                dictDefaultMessage: '',
                autoProcessQueue: false,
                uploadMultiple: true,
                autoQueue: false,
                clickable: ".fileinput-button." + this.uniqueidClass(),
                previewsContainer: '#hidden-dz-previews',
                init: function() {
                    self.dropzone = this;
                    this.on("addedfiles", self.addFiles);
                    this.on("error", function(file, error) {
                        file.error = error;
                    });    
                }
            };
        },
        template: { require: 'text!templates/views/components/workflows/select-dataset-files-step.htm' }
    });
});