define([
    'underscore',
    'knockout',
    'knockout-mapping',
    'uuid',
    'arches',
    'utils/resource',
    'utils/physical-thing',
    'viewmodels/alert-json',
    'models/tile',
    'bindings/dropzone'
], function(_, ko, koMapping, uuid, arches, resourceUtils, physicalThingUtils, JsonErrorAlertViewModel, TileModel) {
    return ko.components.register('upload-files-step', {
        viewModel: function(params) {
            var self = this;
            const physicalThingId = params.projectinfo["select-phys-thing-step"][0][1].physicalThing;
            const observationInfo = params.observationinfo['instrument-info'][0][1];
            const rendererByInstrumentLookup = {
                "3526790a-c73d-4558-b29d-98f574c91e61": {name: "Bruker Artax x-ray fluorescence spectrometer", renderer: "xrf-reader", rendererid: "31be40ae-dbe6-4f41-9c13-1964d7d17042"},
                "73717b33-1235-44a1-8acb-63c97a5c1157": {name: "Renishaw inVia Raman microscope using a 785 nm laser", renderer: "raman-reader", rendererid: "94fa1720-6773-4f99-b49b-4ea0926b3933"},
                "3365c1bf-070d-4a8e-b859-52dec6876c1d": {name: "ASD HiRes FieldSpec4", renderer: "UNK", rendererid: "UNK"}
            };
            this.datasetName = ko.observable();
            this.uniqueId = uuid.generate();
            this.files = ko.observableArray([]);
            this.observationReferenceTileId = ko.observable();
            this.uniqueidClass = ko.pureComputed(function() {
                return "unique_id_" + self.uniqueId;
            });
            this.dirty = ko.pureComputed(function(){
                return true;
            })
            this.reset = function(){

            }

            this.addFiles = function(fileList) {
                Array.from(fileList).forEach(function(file) {
                    file.fileId = ko.observable();
                    self.files.push(file);
                    console.log(file)
                });
                // if (self.files()) {
                //     self.mainMenu(false);
                //     self.activeTab('dataset');
                //     self.annotationNodes.valueHasMutated();
                // }
            };

            // this.removeFile = function(file) {
            //     var filePosition;
            //     self.filesJSON().forEach(function(f, i) { if (f.file_id === file.file_id) { filePosition = i; } });
            //     var newfilePosition = filePosition === 0 ? 1 : filePosition - 1;
            //     var filesForUpload = self.filesForUpload();
            //     var uploadedFiles = self.uploadedFiles();
            //     if (file.file_id) {
            //         file = _.find(uploadedFiles, function(uploadedFile) {
            //             return file.file_id ===  ko.unwrap(uploadedFile.file_id);
            //         });
            //         self.uploadedFiles.remove(file);
            //     } else {
            //         file = filesForUpload[file.index];
            //         self.filesForUpload.remove(file);
            //     }
            //     if (self.filesJSON().length > 0) { self.selectedFile(self.filesJSON()[newfilePosition]); }
            // };

            this.removeFile = function(file){
                // const index = self.files().find(function(file){
                //     return file.
                // });
                self.files.remove(file);

                // var files = [];
                // self.files().forEach(function(f){
                //     if(file.index !== f.index){
                //         files.push(f);
                //     }
                // });
                // self.files(files);
                // const index = self.files.indexOf(file);
                // if (index > -1) {
                //     self.files().splice(index, 1);
                // }
            };

            this.filesJSON = ko.computed(function() {
                var filesForUpload = self.files();
                return ko.toJS(_.map(filesForUpload, function(file, i) {
                    return {
                        name: file.name,
                        accepted: file.accepted,
                        height: file.height,
                        lastModified: file.lastModified,
                        size: file.size,
                        status: file.status,
                        type: file.type,
                        width: file.width,
                        url: null,
                        file_id: null,
                        index: i,
                        content: URL.createObjectURL(file),
                        error: file.error
                    };
                }));
            }).extend({throttle: 100});

            this.formatSize = function(file) {
                var bytes = ko.unwrap(file.size);
                if(bytes == 0) return '0 Byte';
                var k = 1024;
                var dm = 2;
                var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
                var i = Math.floor(Math.log(bytes) / Math.log(k));
                return '<strong>' + parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + '</strong> ' + sizes[i];
            };

            this.dropzoneOptions = {
                url: "arches.urls.root",
                dictDefaultMessage: '',
                autoProcessQueue: false,
                addRemoveLinks: true,
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

            this.save = async() => {
                if(!self.datasetName()) { 
                    params.form.alert(new params.form.AlertViewModel(
                        'ep-alert-red', 
                        "Dataset Name Required", 
                        `A dataset name was not provided`
                    ));
                    return;
                } else {
                    params.form.alert('');
                }

                try {
                    // For each part of parent phys thing, create a digital resource with a Name tile
                    const datasetResourceId = (await self.saveDatasetName());

                    // Then save a file tile to the digital resource for each associated file
                    await self.saveDatasetFiles(datasetResourceId);
                    await self.createObservationToDatasetXRef(datasetResourceId);
                    await self.createPhysicalThingToDatasetXRef(datasetResourceId);
                } catch(err) {
                    // eslint-disable-next-line no-console
                    console.log('Tile update failed', err);
                    params.form.alert(new params.form.AlertViewModel(
                        'ep-alert-red', 
                        'Error saving the Dataset',
                    ));
                    params.form.loading(false);
                    return;
                }
            
                // params.form.lockExternalStep("select-instrument-and-files", true);
                // const parts = self.parts();
                // for (const part of parts) {
                //     if(!part.datasetName()) { continue; }
                //     try {
                //         // For each part of parent phys thing, create a digital resource with a Name tile
                //         const datasetResourceId = (await self.saveDatasetName(part));

                //         part.datasetId(datasetResourceId);

                //         // Then save a file tile to the digital resource for each associated file
                //         await self.saveDatasetFiles(part, datasetResourceId);
                    
                //         // Then save a relationship tile on the part that points to the digital resource
                //         await self.saveDigitalResourceToChildPhysThing(part);
                //     } catch(err) {
                //         // eslint-disable-next-line no-console
                //         console.log('Tile update failed', err);
                //         params.form.loading(false);
                //     }
                // }


                // params.form.value({ 
                //     observationReferenceTileId: self.observationReferenceTileId(),
                //     parts: self.parts().map(x => 
                //         {
                //             return {
                //                 datasetFiles: x.datasetFiles().map(x => { return {...x, tileId: x.tileId()} }),
                //                 datasetId: x.datasetId(),
                //                 datasetName: x.datasetName(),
                //                 resourceReferenceId: x.resourceReferenceId(),
                //                 tileid: x.tileid
                //             };
                //         }
                //     )});
                // params.form.savedData(params.form.addedData());
                // params.form.complete(true);
                
            };

            params.save = this.save;

            this.saveDatasetName = async() => {
                // don't recreate datasets that already exist
                // if(part.datasetId()){ return part.datasetId(); }

                //Tile structure for the Digital Resource 'Name' nodegroup
                const nameTemplate = {
                    "tileid": "",
                    "data": {
                        "d2fdc2fa-ca7a-11e9-8ffb-a4d18cec433a": self.datasetName(),
                        "d2fdc0d4-ca7a-11e9-95cf-a4d18cec433a": ["8f40c740-3c02-4839-b1a4-f1460823a9fe"],
                        "d2fdb92b-ca7a-11e9-af41-a4d18cec433a": ["bc35776b-996f-4fc1-bd25-9f6432c1f349"],
                        "d2fdbc38-ca7a-11e9-a31a-a4d18cec433a": null,
                        "d2fdbeb8-ca7a-11e9-a294-a4d18cec433a": null
                    },
                    "nodegroup_id": "d2fdae3d-ca7a-11e9-ad84-a4d18cec433a",
                    "parenttile_id": null,
                    "resourceinstance_id": "",
                    "sortorder": 0,
                    "tiles": {},
                    "transaction_id": params.form.workflowId
                };

                var tile = new TileModel(nameTemplate);
                var result = await tile.save();
                return result.resourceinstance_id;


                // const tile = await window.fetch(arches.urls.api_tiles(uuid.generate()), {
                //     method: 'POST',
                //     credentials: 'include',
                //     body: JSON.stringify(nameTemplate),
                //     headers: {
                //         'Content-Type': 'application/json'
                //     },
                // });

            };

            this.saveDatasetFiles = async(datasetNameTileResourceId) => {
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
                    "resourceinstance_id": datasetNameTileResourceId,
                    "sortorder": 1,
                    "tiles": {},
                    "transaction_id": params.form.workflowId
                };

                const datasetFilesArray = self.files();
                for(let i = 0; i < datasetFilesArray.length; ++i){
                    const file = datasetFilesArray[i];
                    // file has already been uploaded
                    // if(file.tileid){ return; }
                    
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
                    
                    var formData = new window.FormData();
                    formData.append('transaction_id', params.form.workflowId);
                    formData.append('file-list_7c486328-d380-11e9-b88e-a4d18cec433a', file, file.name);
                    
                    var tile = new TileModel(fileTemplate);
                    var result = await tile.save(null, this, formData);
                    // file.tileId(result.tileid);
                    // return result;
                }
            };

            this.createObservationToDatasetXRef = async(datasetNameTileResourceId) => {
                const digitalReferenceTile = {
                    "tileid": self.observationReferenceTileId() || "",
                    "data": {
                        "dd596aae-c457-11e9-956b-a4d18cec433a": [{
                            "resourceId": datasetNameTileResourceId,
                            "ontologyProperty": "",
                            "inverseOntologyProperty": ""
                        }]
                    },
                    "nodegroup_id": "dd596aae-c457-11e9-956b-a4d18cec433a",
                    "parenttile_id": null,
                    "resourceinstance_id": observationInfo.observationInstanceId,
                    "sortorder": 1,
                    "tiles": {},
                    "transaction_id": params.form.workflowId
                };

                var tile = new TileModel(digitalReferenceTile);
                var result = await tile.save();
                self.observationReferenceTileId(result.tileid);
                return result;

                // const result = await window.fetch(arches.urls.api_tiles(tileid), {
                //     method: 'POST',
                //     credentials: 'include',
                //     body: JSON.stringify(digitalReferenceTile),
                //     headers: {
                //         'Content-Type': 'application/json'
                //     },
                // });

                // if(result.ok){
                //     const json = await result.json();
                //     self.observationReferenceTileId(json?.tileid);
                //     return json;
                // }
            };

            this.createPhysicalThingToDatasetXRef = async(datasetNameTileResourceId) => {
                // const digitalReferenceNodeId = "a298ee52-8d59-11eb-a9c4-faffc265b501";
                const digitalReferenceNodeGroupId = "8a4ad932-8d59-11eb-a9c4-faffc265b501";  
                // const tileid = uuid.generate();
                const digitalReferenceTile = {
                    "tileid": "",
                    "data": {
                        "a298ee52-8d59-11eb-a9c4-faffc265b501": [{
                            "resourceId": datasetNameTileResourceId,
                            "ontologyProperty": "",
                            "inverseOntologyProperty": ""
                        }]
                    },
                    "nodegroup_id": digitalReferenceNodeGroupId,
                    "parenttile_id": null,
                    "resourceinstance_id": self.physicalThingId,
                    "sortorder": 1,
                    "tiles": {},
                    "transaction_id": params.form.workflowId
                };

                var tile = new TileModel(digitalReferenceTile);
                var result = await tile.save();
                self.observationReferenceTileId(result.tileid);
                return result;

                // const result = await window.fetch(arches.urls.api_tiles(tileid), {
                //     method: 'POST',
                //     credentials: 'include',
                //     body: JSON.stringify(digitalReferenceTile),
                //     headers: {
                //         'Content-Type': 'application/json'
                //     },
                // });

                // if(result.ok){
                //     const json = await result.json();
                //     part.resourceReferenceId(json?.tileid);
                //     return part.resourceReferenceId();
                // }
            };


        },
        template: { require: 'text!templates/views/components/workflows/upload-dataset/upload-files-step.htm' }
    });
});