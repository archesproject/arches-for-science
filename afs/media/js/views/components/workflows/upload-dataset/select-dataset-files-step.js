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
            IIIFViewerViewmodel.apply(this, [params]);
            var defaultColor;
            var self = this;
            const physicalThingPartNameNodeId = "3e541cc6-859b-11ea-97eb-acde48001122";
            const physicalThingPartNodeGroupId = "fec59582-8593-11ea-97eb-acde48001122";
            const physicalThingPartAnnotationNodeId = "97c30c42-8594-11ea-97eb-acde48001122";
            const physicalThingPartNodeId = "b240c366-8594-11ea-97eb-acde48001122";
            const projectInfo = params.form.externalStepData.projectinfo.data['select-phys-thing-step'][0][1];
            const observationInfo = params.form.externalStepData.observationinfo.data['instrument-info'][0][1];
            const rendererByInstrumentLookup = {
                "3526790a-c73d-4558-b29d-98f574c91e61": {name: "Bruker Artax x-ray fluorescence spectrometer", renderer: "xrf-reader", rendererid: "31be40ae-dbe6-4f41-9c13-1964d7d17042"},
                "73717b33-1235-44a1-8acb-63c97a5c1157": {name: "Renishaw inVia Raman microscope using a 785 nm laser", renderer: "raman-reader", rendererid: "94fa1720-6773-4f99-b49b-4ea0926b3933"},
                "3365c1bf-070d-4a8e-b859-52dec6876c1d": {name: "ASD HiRes FieldSpec4", renderer: "UNK", rendererid: "UNK"}
            };
            this.annotationNodeId = "b3e171ae-1d9d-11eb-a29f-024e0d439fdb";
            this.samplingActivityGraphId = "03357848-1d9d-11eb-a29f-024e0d439fdb";
            this.selectedAnnotationTile = ko.observable();
            this.selectedPart = ko.observable();
            this.partFilter = ko.observable("");
            this.alert = params.alert;
            this.annotations = ko.observableArray([]);
            this.parts = ko.observableArray([]);
            this.uniqueId = uuid.generate();
            this.formData = new window.FormData();
            this.physicalThing = projectInfo.physicalThing;
            this.uniqueidClass = ko.computed(function() {
                return "unique_id_" + self.uniqueId;
            });
            this.firstLoad = true;
            this.mainMenu = ko.observable(true);
            this.files = ko.observableArray([]);
            this.datasets = ko.observableArray([]);

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
                                            defaultColor = feature.feature.properties.color;
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
                    });
                } 
            };

            this.getAnnotationProperty = function(tile, property){
                return tile.data[physicalThingPartAnnotationNodeId].features[0].properties[property];
            };

            this.selectedPart.subscribe(function(data){
                self.annotations([data]);
                if (self.annotations().length) {
                    self.selectedAnnotationTile(self.annotations()[0]);
                    if (self.manifest() !== self.getAnnotationProperty(self.selectedAnnotationTile(), "manifest")) {
                        self.manifest(self.getAnnotationProperty(self.selectedAnnotationTile(), "manifest"));
                        self.getManifestData();
                    }
                    self.switchCanvas(self.getAnnotationProperty(self.selectedAnnotationTile(), "canvas"));
                }
            });

            this.canvas.subscribe(function(val){
                if (typeof val === "string") {
                    let annotationCanvas = self.getAnnotationProperty(self.selectedAnnotationTile(), "canvas");
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
                    self.annotationNodes.valueHasMutated();
                }
            };

            this.addFileToPart = (file) => {
                if(self.selectedPart) {
                    file.tileId = ko.observable();
                    self.selectedPart().datasetFiles.push(file);
                    self.files.remove(file);
                }
            }

            this.removeFileFromPart = (file) => {
                if(self.selectedPart) {
                    self.selectedPart().datasetFiles.remove(file);
                    self.files.push(file);
                }
            }

            this.saveDatasetName = async (part) => {
                // don't recreate datasets that already exist
                if(part.datasetId()){ return part.datasetId(); }

                //Tile structure for the Digital Resource 'Name' nodegroup
                const nameTemplate = {
                    "tileid": "",
                    "data": {
                        "d2fdc2fa-ca7a-11e9-8ffb-a4d18cec433a": null,
                        "d2fdc0d4-ca7a-11e9-95cf-a4d18cec433a": ["8f40c740-3c02-4839-b1a4-f1460823a9fe"],
                        "d2fdb92b-ca7a-11e9-af41-a4d18cec433a": ["bc35776b-996f-4fc1-bd25-9f6432c1f349"],
                        "d2fdbc38-ca7a-11e9-a31a-a4d18cec433a": null,
                        "d2fdbeb8-ca7a-11e9-a294-a4d18cec433a": null
                    },
                    "nodegroup_id": "d2fdae3d-ca7a-11e9-ad84-a4d18cec433a",
                    "parenttile_id": null,
                    "resourceinstance_id": "",
                    "sortorder": 0,
                    "tiles": {}
                };

                nameTemplate.data["d2fdc2fa-ca7a-11e9-8ffb-a4d18cec433a"] = part.datasetName() || "";

                const tile = await window.fetch(arches.urls.api_tiles(uuid.generate()), {
                    method: 'POST',
                    credentials: 'include',
                    body: JSON.stringify(nameTemplate),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                });

                if(tile.ok){
                    const json = await tile.json();
                    return json?.resourceinstance_id;
                }
            };

            this.saveDatasetFiles = async (part, datasetNameTileResourceId) => {
                //Tile structure for the Digital Resource 'File' nodegroup
                const fileTemplate = {
                    "tileid": "",
                    "data": {
                        "29d5ecb8-79a5-11ea-8ae2-acde48001122": null,
                        "7c486328-d380-11e9-b88e-a4d18cec433a": null,
                        "5e1791d4-79a5-11ea-8ae2-acde48001122": null,
                        "21d0ba4e-78eb-11ea-a33b-acde48001122": null
                    },
                    "nodegroup_id": "7c486328-d380-11e9-b88e-a4d18cec433a",
                    "parenttile_id": null,
                    "resourceinstance_id": "",
                    "sortorder": 1,
                    "tiles": {}
                };

                const datasetFilesArray = part.datasetFiles();
                for(let i = 0; i < datasetFilesArray.length; ++i){
                    const file = datasetFilesArray[i];
                    // file has already been uploaded
                    if(file.tileId()){ continue; }
                    // eslint-disable-next-line camelcase
                    fileTemplate.resourceinstance_id = datasetNameTileResourceId;
                    
                    const fileInfo = {
                        name: file.name,
                        accepted: file.accepted,
                        height: file.height,
                        lastModified: file.lastModified,
                        size: file.size,
                        status: file.status,
                        type: file.type,
                        width: file.width,
                        url: null,
                        // eslint-disable-next-line camelcase
                        file_id: null,
                        index: i,
                        content: window.URL.createObjectURL(file),
                        error: file.error
                    };
                    if (file.name.split('.').pop() === 'txt'){
                        fileInfo.renderer = rendererByInstrumentLookup[observationInfo.instrument.value].rendererid;
                    }
                    fileTemplate.data["7c486328-d380-11e9-b88e-a4d18cec433a"] = [fileInfo];
                    const formData = new window.FormData();
                    formData.append('data', JSON.stringify(fileTemplate));
                    formData.append('file-list_7c486328-d380-11e9-b88e-a4d18cec433a', file, file.name);
                    const tile = await window.fetch(arches.urls.api_tiles(uuid.generate()), {
                        method: 'POST',
                        credentials: 'include',
                        body: formData
                    })
                        
                    if (tile.ok) {
                        json = await tile.json();
                        file.tileId(json.tileid);
                    }
                }  
            };

            this.saveDigitalResourceToChildPhysThing = async (part) => {
                if(part.resourceReferenceId()) { return part.resourceReferenceId(); }
                const partResourceInstanceId = part.data[physicalThingPartNodeId][0].resourceId; 
                const digitalReferenceNodeId = "a298ee52-8d59-11eb-a9c4-faffc265b501";
                const digitalReferenceNodeGroupId = "8a4ad932-8d59-11eb-a9c4-faffc265b501";  
                const tileid = uuid.generate();
                const payload = [{
                    "resourceId": part.datasetId(),
                    "ontologyProperty": "",
                    "inverseOntologyProperty": ""
                }];
                const digitalReferenceTile = {
                    "tileid": "",
                    "data": {},
                    "nodegroup_id": digitalReferenceNodeGroupId,
                    "parenttile_id": null,
                    "resourceinstance_id": partResourceInstanceId,
                    "sortorder": 1,
                    "tiles": {}
                };
                digitalReferenceTile.data[digitalReferenceNodeId] = payload;
                const result = await window.fetch(arches.urls.api_tiles(tileid), {
                    method: 'POST',
                    credentials: 'include',
                    body: JSON.stringify(digitalReferenceTile),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                });

                if(result.ok){
                    const json = await result.json();
                    part.resourceReferenceId(json?.tileid);
                    return part.resourceReferenceId();
                }
            };

            this.save = async() => {
                const incompleteInputs = self.getIncompleteInputs();
                if(incompleteInputs.length) { 
                    params.form.alert(new params.form.AlertViewModel(
                        'ep-alert-red', 
                        "Dataset Name Required", 
                        `A dataset name was not provided for parts: ${incompleteInputs.map(x => x.displayname).join(', ')}`
                    ));
                    return;
                } else {
                    params.form.alert('');
                }
                
                params.form.lockExternalStep("select-instrument-and-files", true);
                const parts = self.parts();
                for (const part of parts) {
                    if(!part.datasetName()) { continue; }
                    try {
                        // For each part of parent phys thing, create a digital resource with a Name tile
                        const datasetResourceId = (await self.saveDatasetName(part));

                        part.datasetId(datasetResourceId);
                        // Then save a file tile to the digital resource for each associated file
                        await self.saveDatasetFiles(part, datasetResourceId);
                    
                        // Then save a relationship tile on the part that points to the digital resource
                        await self.saveDigitalResourceToChildPhysThing(part);
                    } catch(err) {
                        // eslint-disable-next-line no-console
                        console.log('Tile update failed', err);
                        params.form.loading(false);
                    }
                }

                params.form.value({ 
                    parts: self.parts().map(x => 
                        {
                            return {
                                datasetFiles: x.datasetFiles().map(x => { return {...x, tileId: x.tileId()} }),
                                datasetId: x.datasetId(),
                                datasetName: x.datasetName(),
                                resourceReferenceId: x.resourceReferenceId(),
                                tileid: x.tileid
                            };
                        }
                    )});
                params.form.savedData(params.form.addedData());
                params.form.complete(true);
                
            };

            params.save = this.save;
            this.datasets.subscribe(function(){
                params.form.complete(true);
            });

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

            this.getIncompleteInputs = ko.pureComputed(function() {
                return self.parts().filter(part => {
                    return !part.datasetName() && part.datasetFiles().length;
                })
            });
            
            this.canBeSaved = ko.pureComputed(function() {
                return self.parts().some(part => part.datasetName);
            });

            this.init = async() => {
                this.selectedAnnotationTile.subscribe(this.highlightAnnotation);
                self.annotationNodes.subscribe(function(val){
                    var overlay = val.find(n => n.name.includes('Physical Thing'));
                    if (overlay) {
                        overlay.active(true);
                        if (ko.unwrap(overlay.annotations) && overlay.annotations().length > 0) {
                            self.highlightAnnotation();
                        }
                        overlay.annotations.subscribe(function(){
                            self.highlightAnnotation();
                        });
                    }
                });

                const thingResource = await resourceUtils.lookupResourceInstanceData(this.physicalThing);
        
                const parts = thingResource?._source.tiles.filter((tile) => tile.nodegroup_id === physicalThingPartNodeGroupId);
                self.parts(parts);
                self.parts().forEach(async(part) => {
                    part.datasetFiles = ko.observableArray([]);
                    part.datasetName = ko.observable();
                    part.datasetId = ko.observable();
                    part.resourceReferenceId = ko.observable();
                    part.displayname = part.data[physicalThingPartNameNodeId];
                    part.datasetId.subscribe(function(val){
                        if (val) {
                            params.form.complete(true);
                        }
                    });
                    const savedValue = params.form.value()?.parts?.filter(x => x.tileid == part.tileid)?.[0];
                    if(savedValue) {
                        
                        part.datasetFiles(savedValue.datasetFiles.map(x => { return {...x, tileId:ko.observable(x.tileId)}}));
                        part.datasetName(savedValue.datasetName);
                        part.datasetId(savedValue.datasetId);
                        part.resourceReferenceId(savedValue.resourceReferenceId);
                        if(self.activeTab() != 'dataset') {
                            self.mainMenu(false);
                            self.activeTab('dataset');
                            self.annotationNodes.valueHasMutated();
                        }
                    }
                });
                self.selectedPart(self.parts()[0]);
            }
     
            this.init();
        },
        template: { require: 'text!templates/views/components/workflows/upload-dataset/select-dataset-files-step.htm' }
    });
});