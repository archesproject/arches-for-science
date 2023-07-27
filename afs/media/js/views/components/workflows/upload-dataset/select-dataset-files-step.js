define([
    'knockout',
    'knockout-mapping',
    'uuid',
    'arches',
    'utils/resource',
    'utils/report',
    'utils/physical-thing',
    'viewmodels/alert-json',
    'views/components/iiif-viewer',
    'js-cookie',
    'afs-formats',
    'templates/views/components/workflows/upload-dataset/select-dataset-files-step.htm',
    'bindings/dropzone'
], function(ko, koMapping, uuid, arches, resourceUtils, reportUtils, physicalThingUtils, JsonErrorAlertViewModel, IIIFViewerViewmodel, Cookies, formats, selectDatasetFilesStepTemplate) {
    return ko.components.register('select-dataset-files-step', {
        viewModel: function(params) {
            // TODO: Fix afs-formats.js, loadComponentDependencies was commented out

            this.buildStrObject = str => {
                return {[arches.activeLanguage]: {
                    "value": str,
                    "direction": arches.languages.find(lang => lang.code == arches.activeLanguage).default_direction
                }};
            };

            this.geti18nStringValue = i18nObj => {
                return i18nObj?.[arches.activeLanguage]?.value || (typeof i18nObj === 'object' && i18nObj !== null ? '' : i18nObj);
            };

            IIIFViewerViewmodel.apply(this, [params]);
            var defaultColor;
            var self = this;            
            const physicalThingPartAnnotationNodeId = "97c30c42-8594-11ea-97eb-acde48001122";            
            const physicalThingPartNameNodeId = "3e541cc6-859b-11ea-97eb-acde48001122";
            const physicalThingPartNodeGroupId = "fec59582-8593-11ea-97eb-acde48001122";
            const physicalThingPartNodeId = "b240c366-8594-11ea-97eb-acde48001122";            
            const datasetNameNodeGroupId = "d2fdae3d-ca7a-11e9-ad84-a4d18cec433a";
            const datasetNameNodeId = "d2fdc2fa-ca7a-11e9-8ffb-a4d18cec433a";
            const datasetFileNodeGroupId = "7c486328-d380-11e9-b88e-a4d18cec433a";
            const datasetFileNodeId = "7c486328-d380-11e9-b88e-a4d18cec433a";
            const observationGraphId = "615b11ee-c457-11e9-910c-a4d18cec433a";
            const childPhysicalThingsValueIds = {
                '77d8cf19-ce9c-4e0a-bde1-9148d870e11c': 'Sample',
                '7375a6fb-0bfb-4bcf-81a3-6180cdd26123': 'Sample Location',
                '31d97bdd-f10f-4a26-958c-69cb5ab69af1': 'Analysis Area',
            };
            this.showDatasetDetails = ko.observable(false);

            const projectInfo = params.projectInfo;
            const observationInfo = params.observationInfo;
            const observationResourceId = params.observationInfo.observationInstanceId;
            this.annotationNodeId = "b3e171ae-1d9d-11eb-a29f-024e0d439fdb";
            this.samplingActivityGraphId = "03357848-1d9d-11eb-a29f-024e0d439fdb";
            this.selectedAnnotationTile = ko.observable();
            this.selectedPart = ko.observable();
            this.partFilter = ko.observable("");
            this.annotations = ko.observableArray([]);
            this.selectedPartObservationId = ko.observable();
            this.selectedPartDefaultFormat = ko.observable();
            this.parts = ko.observableArray([]);
            this.uniqueId = uuid.generate();
            this.observationReferenceTileId = ko.observable();
            this.physicalThing = projectInfo.physicalThing;
            this.uniqueidClass = ko.computed(function() {
                return "unique_id_" + self.uniqueId;
            });
            this.firstLoad = true;
            this.mainMenu = ko.observable(false);
            this.files = ko.observableArray([]);

            self.formats = ko.observableArray(Object.values(formats).map(format => {return {"text": format.name, "id": format.id};}));
            this.initialValue = params.form.savedData() || undefined;
            this.snapshot = undefined;
            this.loadingMessage = ko.observable();
            this.loading = ko.observable(false);

            this.selectedPartHasCurrentObservation = ko.computed(() => {
                if(!self.selectedPart()?.observationResourceId){
                    return true;
                } else {
                    return self.selectedPart().observationResourceId == observationResourceId;
                }
            });

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
            self.selectedPartDefaultFormat.subscribe((defaultFormat) => {
                self.selectedPart().defaultFormat(defaultFormat);
            });

            this.selectedPart.subscribe(async(data) => {
                self.selectedPartObservationId(self.selectedPart().observationResourceId);
                const savedDefaultFormat = ko.unwrap(params.form.savedData()?.parts.find(part => part.partResourceId == data.resourceid)?.defaultFormat);
                self.selectedPartDefaultFormat(ko.unwrap(self.selectedPart()?.defaultFormat) || savedDefaultFormat);
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

            this.addFileToPart = (files) => {
                if(self.selectedPart() && self.selectedPartHasCurrentObservation()) {
                    const file = files[0];
                    file.tileId = ko.observable();
                    self.selectedPart().stagedFiles.push(file);
                    self.parts.valueHasMutated();
                    self.files.remove(file);
                    
                }
            };

            this.removeFileFromPart = (file) => {
                if(self.selectedPart() && self.selectedPartHasCurrentObservation()) {
                    self.selectedPart().datasetFiles.remove(file);
                    self.files.push(file);
                }
            };

            const getPartObservationId = async(part) => {
                if(part.datasetId()) {
                    const selectedDatasetCrossReferences = await (await window.fetch(`${arches.urls.related_resources}${part.datasetId()}`)).json();
                    const relatedObservation = selectedDatasetCrossReferences?.related_resources?.related_resources?.filter(x => x?.graph_id == observationGraphId);
                    part.observationResourceId = relatedObservation?.[0]?.resourceinstanceid;
                    if(part.datasetId() == self.selectedPart()?.datasetId()){
                        self.selectedPart.valueHasMutated();
                    }
                }
            };

            this.saveDatasetFile = (formData, file) => {
                //Tile structure for the Digital Resource 'File' nodegroup
                self.loading(true);

                if(file) {
                    self.loadingMessage(`Uploading files (may take a few minutes)...`);
                    let fileInfo;
                    
                    if (!ko.unwrap(file.tileId)) {
                        fileInfo = {
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
                            index: 0,
                            content: window.URL.createObjectURL(file),
                            error: file.error
                        };

                        formData.append(`file-list_${datasetFileNodeId}_data`, JSON.stringify(fileInfo));
                        formData.append(`file-list_${datasetFileNodeId}`, file, file.name);
                    }
                }
            };

            const saveWorkflowState = () => {
                params.form.savedData({ 
                    observationReferenceTileId: self.observationReferenceTileId(),
                    
                    parts: self.parts().map(part =>
                    {
                        const fileObjects = part.datasetFiles().map(file => { 
                            delete file.dataURL;
                            return file;
                        } );
                        return {
                            datasetFiles: fileObjects.map(x => { return {...x, tileId: ko.unwrap(x.tileId)};}),
                            datasetId: part.datasetId(),
                            nameTileId: part.nameTileId(),
                            datasetName: part.datasetName() || '',
                            resourceReferenceId: part.resourceReferenceId(),
                            defaultFormat: part.defaultFormat(),
                            tileid: part.tileid,
                            partResourceId: part.resourceid
                        };
                    })
                });
            };

            this.deleteFile = async(file) => {
                const fileTile = ko.unwrap(file.tileId);
                if(fileTile){
                    self.loading(true);
                    try {
                        self.loadingMessage(`Deleting ${ko.unwrap(file.name)}...`);
                        const formData = new window.FormData();
                        formData.append("tileid", fileTile);

                        const resp = await window.fetch(arches.urls.tile, {
                            method: 'DELETE', 
                            credentials: 'include',
                            body: JSON.stringify(Object.fromEntries(formData.entries())),
                            headers: {
                                "X-CSRFToken": Cookies.get('csrftoken')
                            }
                        });

                        const body = await resp.json();

                        if(resp.status == 200 || (resp.status == 500 && body?.message?.includes("likely already deleted"))){
                            const datasetFiles = this.selectedPart().datasetFiles();
                            this.selectedPart().datasetFiles(datasetFiles.filter(datasetFile => 
                                ko.unwrap(datasetFile.tileId) != fileTile
                            ));

                            saveWorkflowState();
                        }
                    } finally {
                        self.loading(false);
                    }
                }
            };

            this.saveFiles = async(files) => {
                params.form.lockExternalStep("select-instrument-and-files", true);
                const part = self.selectedPart();
                try {
                    const formData = new window.FormData();
                    formData.append("transaction_id", params.form.workflowId);
                    formData.append("instrument_id", observationInfo.instrument.value);
                    formData.append("observation_id", observationResourceId);
                    if(self.observationReferenceTileId()){
                        formData.append("observation_ref_tile", self.observationReferenceTileId());
                    }

                    // For each part of parent phys thing, create a digital resource with a Name tile
                    formData.append('dataset', JSON.stringify({
                        "name": self.buildStrObject(part.calcDatasetName()),
                        "tileId": part.nameTileId(),
                        "resourceInstanceId": ko.unwrap(part.datasetId),
                        "partResourceId": ko.unwrap(part.resourceid),
                        "defaultFormat": ko.unwrap(part.defaultFormat)
                    }));

                    self.loading(true);
                    self.loadingMessage(`Saving dataset ${part.calcDatasetName()}`);
                    if(files) {
                        Array.from(files).forEach(file => {
                            // Then save a file tile to the digital resource for each associated file
                            self.saveDatasetFile(formData, file);
                        });
                    }

                    const resp = await window.fetch(arches.urls.upload_dataset_select_dataset_files_step, {
                        method: 'POST',
                        credentials: 'include',
                        body: formData,
                        headers: {
                            "X-CSRFToken": Cookies.get('csrftoken')
                        }
                    });

                    self.loading(false);
                    const datasetInfo = await resp.json();
                    self.observationReferenceTileId(datasetInfo.observationReferenceTileId);
                    part.datasetId(datasetInfo.datasetResourceId);
                    const newDatasetFiles = part.datasetFiles().filter(
                        x => datasetInfo.removedFiles.find(
                            y => {
                                return ko.unwrap(x.tileId) == ko.unwrap(y.tileid);
                            }) == undefined
                    );
                    part.datasetFiles([...newDatasetFiles, ...datasetInfo.files]);
                    part.nameTileId(datasetInfo.datasetNameTileId);
                    part.nameDirty(false);
                } catch(err) {
                    // eslint-disable-next-line no-console
                    console.log('Tile update failed', err);
                    params.form.loading(false);
                    part.nameDirty(true);
                }

                saveWorkflowState();
                self.snapshot = params.form.savedData();
                params.form.complete(true);
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
                    this.on("addedfiles", self.saveFiles);
                    this.on("error", function(file, error) {
                        file.error = error;
                    });    
                }
            };

            this.canBeSaved = ko.pureComputed(() => {
                return self.parts().filter(part => part.datasetName && !part.datasetId())
                    .some(part => part.datasetFiles().length) ||
                    self.parts().filter(part => ko.unwrap(part.datasetId)).some(part => part.datasetFiles().some(file => !file.tileId())) ||
                    self.parts().some(part => part.nameDirty());
            });

            this.init = async() => {
                self.loading(true);
                self.loadingMessage(`Loading samples and analysis areas...`);
                self.activeTab('dataset');
                self.snapshot = params.form.savedData();
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

                self.observationReferenceTileId(params.form.savedData()?.observationReferenceTileId);

                for (const part of parts) {
                    part.resourceid = part.data[physicalThingPartNodeId][0].resourceId; 
                    const related = await resourceUtils.lookupResourceInstanceData(part.resourceid);
                    const digitalReferenceNodeGroupId = "8a4ad932-8d59-11eb-a9c4-faffc265b501"; 
                    const digitalReferenceNodeId = "a298ee52-8d59-11eb-a9c4-faffc265b501";
                    const digitalReferenceTypeNodeId = 'f11e4d60-8d59-11eb-a9c4-faffc265b501';
                    const typeNodeGroupId = '8ddfe3ab-b31d-11e9-aff0-a4d18cec433a';
                    const datasetTile = related?._source.tiles.find((tile) => tile.nodegroup_id === digitalReferenceNodeGroupId);
                    const partTypeId = related?._source.tiles.filter((tile) => tile.nodegroup_id === typeNodeGroupId)?.[0]?.data[typeNodeGroupId]?.[0];
                    part.type = childPhysicalThingsValueIds[partTypeId];

                    const manifestValueIds = [
                        '1497d15a-1c3b-4ee9-a259-846bbab012ed', // Preferred Manifest
                        '305c62f0-7e3d-4d52-a210-b451491e6100', // IIIF Manifest
                        '00d5a7a6-ff2f-4c44-ac85-7a8ab1a6fb70' // Alternate Manifest
                    ];
                    part.datasetFiles = part.datasetFiles || ko.observableArray([]);
                    part.stagedFiles = part.stagedFiles || ko.observableArray([]);
                    part.datasetName = part.datasetName || ko.observable();
                    part.defaultFormat = ko.observable(params.form.savedData()?.parts.find(savedPart => part.resourceid == savedPart?.partResourceId)?.defaultFormat);

                    const childPhysThingName = related._source.displayname;
                    let timeoutId = 0;

                    part.calcDatasetName = ko.computed(function() {
                        const basename = part.datasetName() || 'Dataset';

                        return `${basename} (${childPhysThingName})`;
                    });
    
                    part.datasetId = part.datasetId || ko.observable();
                    part.nameTileId = part.nameTileId || ko.observable();
                    part.resourceReferenceId = part.resourceReferenceId || ko.observable();
                    part.nameDirty = part.nameDirty || ko.observable(false);
                    part.displayname = part.data[physicalThingPartNameNodeId][arches.activeLanguage]['value'];
                    if (datasetTile && !manifestValueIds.includes(datasetTile.data[digitalReferenceTypeNodeId])) {
                        const dataset = await resourceUtils.lookupResourceInstanceData(datasetTile.data[digitalReferenceNodeId][0].resourceId);
                        const datasetName =  self.geti18nStringValue(dataset._source.tiles.find((tile) => tile.nodegroup_id === datasetNameNodeGroupId).data[datasetNameNodeId]);
                        const nameTileId =  dataset._source.tiles.find((tile) => tile.nodegroup_id === datasetNameNodeGroupId).tileid;
                        const datasetTiles =  dataset._source.tiles.filter((tile) => tile.nodegroup_id === datasetFileNodeGroupId);
                        const datasetFiles = datasetTiles.map((tile) => {
                            let file = tile.data[datasetFileNodeId][0];
                            file.tileId = ko.observable(tile.tileid);
                            return file;
                        });
                        part.datasetId(dataset._id);
                        await getPartObservationId(part);
                        part.datasetName(datasetName);
                        part.datasetFiles(datasetFiles);
                        part.nameTileId(nameTileId);
                    }
                    
                    if(!part.datasetId.getSubscriptionsCount()){
                        part.datasetId.subscribe(function(val){
                            if (val) {
                                params.form.complete(true);
                            }
                        });
                    }
                    const savedValue = params.form.savedData()?.parts?.filter(x => x.tileid == part.tileid)?.[0];
                    if(savedValue) {
                        
                        part.datasetFiles(savedValue.datasetFiles.map(x => { return {...x, tileId:ko.observable(x.tileId)}; }));
                        part.datasetName(savedValue.datasetName);
                        part.datasetId(savedValue.datasetId);
                        part.nameTileId(savedValue.nameTileId);
                        part.resourceReferenceId(savedValue.resourceReferenceId);
                        
                        if(self.activeTab() != 'dataset') {
                            self.mainMenu(false);
                            self.activeTab('dataset');
                            self.annotationNodes.valueHasMutated();
                        }
                    }
                    if(part.datasetName.getSubscriptionsCount()){
                        part.datasetName.subscribe((newValue) => {
                            const datasetName = self.snapshot?.parts?.find(x => x.datasetId == part.datasetId())?.datasetName || "";
                            if(newValue != datasetName) {
                                part.nameDirty(true);
                            } else {
                                part.nameDirty(false);
                            }
                        });
                    }
       
                    part.hasCurrentObservation = ko.computed(() => {
                        if(!part?.observationResourceId){
                            return true;
                        } else {
                            return part.observationResourceId == observationResourceId;
                        }
                    });
                }
                self.parts(parts);
                self.selectedPart(self.parts()[0]);

                self.loading(false);
            };
     
            this.init();
        },
        template: selectDatasetFilesStepTemplate
    });
});