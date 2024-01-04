define([
    'underscore',
    'knockout',
    'uuid',
    'arches',
    'models/tile',
    'js-cookie',
    'templates/views/components/workflows/upload-dataset/upload-files-step.htm',
    'bindings/dropzone'
], function(_, ko, uuid, arches, TileModel, Cookies, uploadFilesStepTemplate) {
    return ko.components.register('upload-files-step', {
        viewModel: function(params) {

            var self = this;
            self.uploadFailed = ko.observable(false);
            const physicalThingId = params.projectinfo["select-phys-thing-step"].savedData().physicalThing;
            const observationInfo = params.observationinfo['instrument-info'].savedData();

            const datasetFileNodeId = "7c486328-d380-11e9-b88e-a4d18cec433a";

            const physThingName = params.projectinfo["select-phys-thing-step"].savedData().physThingName;

            this.datasetId = undefined;
            this.datasetName = ko.observable();
            this.calcDatasetName = ko.computed(function() {
                // TODO(i18n) slug or name?
                const basename = self.datasetName() || 'Dataset';
                return `${basename} (${physThingName})`
            });
            this.datasetNameTileId = "";
            this.files = ko.observableArray();
            this.observationReferenceTileId = "";
            this.physicalthingReferenceTileId  = "";
            this.uniqueId = uuid.generate();

            this.loadingMessage = ko.observable();
            this.loading = ko.observable(false);

            this.deleteFile = async(file) => {
                const fileTile = ko.unwrap(file.tileId);
                if(fileTile){
                    self.loading(true);
                    try {
                        self.loadingMessage(`${arches.translations.deleting} ${ko.unwrap(file.name)}...`)
                        const formData = new window.FormData();
                        formData.append("tileid", fileTile)

                        const resp = await window.fetch(arches.urls.tile, {
                            method: 'DELETE', 
                            credentials: 'include',
                            body: JSON.stringify(Object.fromEntries(formData.entries())),
                            headers: {
                                "X-CSRFToken": Cookies.get('csrftoken')
                            }
                        });

                        const body = await resp.json();

                        if (
                            resp.status == 200 ||
                            (resp.status == 500 && body?.exception === 'TileModel.ObjectDoesNotExist')
                        ) {
                            const datasetFiles = this.files();
                            this.files(datasetFiles.filter(datasetFile => 
                                ko.unwrap(datasetFile.tileId) != fileTile
                            ));

                            saveWorkflowState();
                        }
                    } finally {
                        self.loading(false)
                    }
                }
            };

            this.init = function() {
                this.physicalthingReferenceTileId = params.form.value()?.physicalthingReferenceTileId ?? "";
                this.observationReferenceTileId = params.form.value()?.observationReferenceTileId ?? "";
                this.datasetId = params.form.value()?.datasetId ?? "";
                this.datasetName(params.form.value()?.datasetName ?? "");
                this.datasetNameTileId = params.form.value()?.datasetNameTileId ?? "";
                (params.form.value()?.files ?? []).forEach(function(file){
                    self.files.push(file);
                });
            }
            this.init();

            this.uniqueidClass = ko.pureComputed(function() {
                return "unique_id_" + self.uniqueId;
            });
            
            params.form.reset = this.reset = function(){
                self.datasetName(params.form.value()?.datasetName);
            }

            this.dirty = params.form.dirty;

            this.datasetName.subscribe(function(name) {
                params.form.dirty(name !== params.form.value()?.datasetName && self.files().length > 0);
            });
            this.files.subscribe(function(files){
                params.form.dirty(false);
            });


            this.saveDatasetFile = (formData, file) => {
                //Tile structure for the Digital Resource 'File' nodegroup
                self.loading(true);

                if(file) {
                    self.loadingMessage(arches.translations.takesTime);
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
                            uploaded: ko.observable(false),
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

            this.saveFiles = async(files) => {
                try {
                    const formData = new window.FormData();
                    formData.append("transaction_id", params.form.workflowId);
                    formData.append("instrument_id", observationInfo.instrument.value);
                    formData.append("observation_id", observationInfo.observationInstanceId);
                    if(self.observationReferenceTileId){
                        formData.append("observation_ref_tile", self.observationReferenceTileId);
                    }

                    // For each part of parent phys thing, create a digital resource with a Name tile
                    formData.append('dataset', JSON.stringify({
                        "name": self.calcDatasetName(),
                        "tileId": self.datasetNameTileId,
                        "resourceInstanceId": self.datasetId,
                        "partResourceId": physicalThingId,
                    }));

                    self.loading(true);
                    self.loadingMessage(`${arches.translations.saving} ${self.calcDatasetName()}`);
                    Array.from(files).forEach(file => {
                        // Then save a file tile to the digital resource for each associated file
                        self.saveDatasetFile(formData, file);
                    });

                    const resp = await window.fetch(arches.urls.upload_dataset_select_dataset_files_step, {
                        method: 'POST',
                        credentials: 'include',
                        body: formData,
                        headers: {
                            "X-CSRFToken": Cookies.get('csrftoken')
                        }
                    });

                    self.loading(false);
                    if(resp.ok){
                        const datasetInfo = await resp.json();
                        self.observationReferenceTileId = datasetInfo.observationReferenceTileId;
                        this.datasetId = datasetInfo.datasetResourceId;
                        const newDatasetFiles = self.files().filter(
                            x => datasetInfo.removedFiles.find(
                                y => {
                                    return ko.unwrap(x.tileId) == ko.unwrap(y.tileid);
                                }) == undefined
                        );
                        self.files([...newDatasetFiles, ...datasetInfo.files]);
                        self.datasetNameTileId = datasetInfo.datasetNameTileId;
                        self.uploadFailed(false);
                    } else {
                        self.uploadFailed(true);
                    }
                } catch(err) {
                    // eslint-disable-next-line no-console
                    console.log('Tile update failed', err);
                    params.form.loading(false);
                }

                saveWorkflowState();
                self.snapshot = params.form.savedData();
                params.form.complete(true);
            };

            // this.addFiles = function(fileList) {
            //     Array.from(fileList).forEach(function(file) {
            //         var fileTile = new FileTile();
            //         fileTile.setFile(file);
            //         self.files.push(fileTile);
            //     });
            // };

            // this.removeFile = function(file){
            //     self.files.remove(file);
            // };

            // this.formatSize = function(file) {
            //     var bytes = ko.unwrap(file.size);
            //     if(bytes == 0) return '0 Byte';
            //     var k = 1024;
            //     var dm = 2;
            //     var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            //     var i = Math.floor(Math.log(bytes) / Math.log(k));
            //     return '<strong>' + parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + '</strong> ' + sizes[i];
            // };

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
                    this.on("addedfiles", self.saveFiles);
                    this.on("error", function(file, error) {
                        file.error = error;
                    });    
                }
            };

            const saveWorkflowState = async() => {
                try {
                    // For each part of parent phys thing, create a digital resource with a Name tile
                    // const datasetResourceId = (await self.saveDatasetName());

                    // Then save a file tile to the digital resource for each associated file
                    // await self.saveDatasetFiles(datasetResourceId);
                    // await self.createObservationToDatasetXRef(datasetResourceId);
                    // await self.createPhysicalThingToDatasetXRef(datasetResourceId);

                    const dataToSave = {
                        physicalthingReferenceTileId: self.physicalthingReferenceTileId,
                        observationReferenceTileId: self.observationReferenceTileId,
                        datasetName: self.datasetName(),
                        datasetNameTileId: self.datasetNameTileId,
                        datasetId: self.datasetId,
                        files: self.files()
                    };

                    params.form.savedData(dataToSave);
                    params.form.complete(true);
                    params.form.dirty(false);
                } catch(err) {
                    // eslint-disable-next-line no-console
                    console.log('Tile update failed', err);
                    params.pageVm.alert(new params.form.AlertViewModel(
                        'ep-alert-red', 
                        arches.translations.error,
                        arches.translations.issueSavingWorkflowStep,
                    ));
                    params.form.loading(false);
                    return;
                }
                
            };

            // this.saveDatasetName = async() => {
            //     //Tile structure for the Digital Resource 'Name' nodegroup
            //     const nameTemplate = {
            //         "tileid": self.datasetNameTileId,
            //         "data": {
            //             "d2fdc2fa-ca7a-11e9-8ffb-a4d18cec433a": self.calcDatasetName(),
            //             "d2fdc0d4-ca7a-11e9-95cf-a4d18cec433a": ["8f40c740-3c02-4839-b1a4-f1460823a9fe"],
            //             "d2fdb92b-ca7a-11e9-af41-a4d18cec433a": ["bc35776b-996f-4fc1-bd25-9f6432c1f349"],
            //             "d2fdbc38-ca7a-11e9-a31a-a4d18cec433a": null,
            //             "d2fdbeb8-ca7a-11e9-a294-a4d18cec433a": null
            //         },
            //         "nodegroup_id": "d2fdae3d-ca7a-11e9-ad84-a4d18cec433a",
            //         "parenttile_id": null,
            //         "resourceinstance_id": self.datasetId,
            //         "sortorder": 0,
            //         "tiles": {},
            //         "transaction_id": params.form.workflowId
            //     };

            //     var tile = new TileModel(nameTemplate);
            //     var result = await tile.save();
            //     self.datasetId = result.resourceinstance_id;
            //     self.datasetNameTileId = result.tileid;
            //     return result.resourceinstance_id;
            // };

            // this.saveDatasetFiles = async(datasetNameTileResourceId) => {
            //     const datasetFilesArray = self.files();
            //     for(let i = 0; i < datasetFilesArray.length; ++i){
            //         const file = datasetFilesArray[i];
            //         // file has already been uploaded
            //         if(file.fileInfo.uploaded()){ continue; }
                    
            //         var result = await file.save(datasetNameTileResourceId);
            //     }
            // };

            // this.createObservationToDatasetXRef = async(datasetNameTileResourceId) => {
            //     // don't recreate references that already exist
            //     if(!!self.observationReferenceTileId){ return self.observationReferenceTileId; }

            //     const digitalReferenceTile = {
            //         "tileid": self.observationReferenceTileId,
            //         "data": {
            //             "dd596aae-c457-11e9-956b-a4d18cec433a": [{
            //                 "resourceId": datasetNameTileResourceId,
            //                 "ontologyProperty": "",
            //                 "inverseOntologyProperty": ""
            //             }]
            //         },
            //         "nodegroup_id": "dd596aae-c457-11e9-956b-a4d18cec433a",
            //         "parenttile_id": null,
            //         "resourceinstance_id": observationInfo.observationInstanceId,
            //         "sortorder": 1,
            //         "tiles": {},
            //         "transaction_id": params.form.workflowId
            //     };

            //     var tile = new TileModel(digitalReferenceTile);
            //     var result = await tile.save();
            //     self.observationReferenceTileId = result.tileid;
            //     return result;
            // };

            // this.createPhysicalThingToDatasetXRef = async(datasetNameTileResourceId) => {
            //     // don't recreate references that already exist
            //     if(!!self.physicalthingReferenceTileId){ return self.physicalthingReferenceTileId; }

            //     const digitalReferenceNodeGroupId = "8a4ad932-8d59-11eb-a9c4-faffc265b501";  
            //     const digitalReferenceTile = {
            //         "tileid": "",
            //         "data": {
            //             "a298ee52-8d59-11eb-a9c4-faffc265b501": [{
            //                 "resourceId": datasetNameTileResourceId,
            //                 "ontologyProperty": "",
            //                 "inverseOntologyProperty": ""
            //             }]
            //         },
            //         "nodegroup_id": digitalReferenceNodeGroupId,
            //         "parenttile_id": null,
            //         "resourceinstance_id": physicalThingId,
            //         "sortorder": 1,
            //         "tiles": {},
            //         "transaction_id": params.form.workflowId
            //     };

            //     var tile = new TileModel(digitalReferenceTile);
            //     var result = await tile.save();
            //     self.physicalthingReferenceTileId = result.tileid;
            //     return result;
            // };


        },
        template: uploadFilesStepTemplate
    });
});