define([
    'underscore',
    'knockout',
    'uuid',
    'arches',
    'models/tile',
    'bindings/dropzone'
], function(_, ko, uuid, arches, TileModel) {
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
            this.datasetId = undefined;
            this.datasetName = ko.observable();
            this.datasetNameTileId = "";
            this.files = ko.observableArray();
            this.observationReferenceTileId = "";
            this.physicalthingReferenceTileId  = "";
            this.uniqueId = uuid.generate();

            var FileTile = function(){
                var self = this;
                
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
                    "tiles": {},
                    "transaction_id": params.form.workflowId
                };

                this.setFile = function(file) {
                    this.fileInfo = {
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
                        // index: i,
                        content: window.URL.createObjectURL(file),
                        error: file.error
                    };
                    if (file.name.split('.').pop() === 'txt'){
                        this.fileInfo.renderer = rendererByInstrumentLookup[observationInfo.instrument.value].rendererid;
                    }
                    fileTemplate.data["7c486328-d380-11e9-b88e-a4d18cec433a"] = [this.fileInfo];
                    
                    this.formData = new window.FormData();
                    this.formData.append('transaction_id', params.form.workflowId);
                    this.formData.append('file-list_7c486328-d380-11e9-b88e-a4d18cec433a', file, file.name);
                    
                    this.tile = new TileModel(fileTemplate);
                }

                this.setResourceId = function(resId){
                    self.tile.set("resourceinstance_id", resId);
                };

                this.save = function(resId) {
                    self.setResourceId(resId);
                    return self.tile.save(null, self, self.formData)
                    .then(function(response){
                        self.tile.set('tileid', response.tileid);
                        self.fileInfo.uploaded(true);
                    });
                };
            };



            this.init = function() {
                // params.form.value({
                //     'files': params.form.value()?.files ?? [],
                //     'datasetName': params.form.value()?.datasetName ?? '',
                // });
                // params.form.value({
                //     'datasetName': params.form.value()?.files ?? [],
                //     'datasetId': params.form.value()?.datasetName ?? '',
                //     'files': self.files().map(function(file){
                //         return {fileInfo: file.fileInfo};
                //     })
                // });
                this.physicalthingReferenceTileId = params.form.value()?.physicalthingReferenceTileId ?? "";
                this.observationReferenceTileId = params.form.value()?.observationReferenceTileId ?? "";
                this.datasetId = params.form.value()?.datasetId ?? "";
                this.datasetName(params.form.value()?.datasetName ?? "");
                this.datasetNameTileId = params.form.value()?.datasetNameTileId ?? "";
                (params.form.value()?.files ?? []).forEach(function(fileInfo){
                    const file = new FileTile();
                    file.fileInfo = fileInfo.fileInfo;
                    file.fileInfo.uploaded = ko.observable(fileInfo.fileInfo.uploaded);
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

            this.dirty = params.form.hasUnsavedData;

            this.datasetName.subscribe(function(name) {
                params.form.hasUnsavedData(name !== params.form.value()?.datasetName);
            });
            this.files.subscribe(function(files){
                params.form.hasUnsavedData(false);
                files.forEach(function(file){
                    if(!ko.unwrap(file.fileInfo.uploaded)){
                        params.form.hasUnsavedData(true);
                    }
                })
            });

            this.addFiles = function(fileList) {
                Array.from(fileList).forEach(function(file) {
                    // file.fileId = ko.observable();
                    var fileTile = new FileTile();
                    fileTile.setFile(file);
                    self.files.push(fileTile);
                    console.log(file)
                });
            };

            this.removeFile = function(file){
                self.files.remove(file);
            };

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

            params.form.save = this.save = async() => {
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

                    params.value({ 
                        physicalthingReferenceTileId: self.physicalthingReferenceTileId,
                        observationReferenceTileId: self.observationReferenceTileId,
                        datasetName: self.datasetName(),
                        datasetNameTileId: self.datasetNameTileId,
                        datasetId: datasetResourceId,
                        files: self.files().map(function(file){
                            return {fileInfo: file.fileInfo};
                        })
                    });

                    params.form.savedData(params.form.addedData());
                    params.form.complete(true);
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
                
            };

            this.saveDatasetName = async() => {
                // don't recreate datasets that already exist
                //if(!!self.datasetId){ return self.datasetId; }

                //Tile structure for the Digital Resource 'Name' nodegroup
                const nameTemplate = {
                    "tileid": self.datasetNameTileId,
                    "data": {
                        "d2fdc2fa-ca7a-11e9-8ffb-a4d18cec433a": self.datasetName(),
                        "d2fdc0d4-ca7a-11e9-95cf-a4d18cec433a": ["8f40c740-3c02-4839-b1a4-f1460823a9fe"],
                        "d2fdb92b-ca7a-11e9-af41-a4d18cec433a": ["bc35776b-996f-4fc1-bd25-9f6432c1f349"],
                        "d2fdbc38-ca7a-11e9-a31a-a4d18cec433a": null,
                        "d2fdbeb8-ca7a-11e9-a294-a4d18cec433a": null
                    },
                    "nodegroup_id": "d2fdae3d-ca7a-11e9-ad84-a4d18cec433a",
                    "parenttile_id": null,
                    "resourceinstance_id": self.datasetId,
                    "sortorder": 0,
                    "tiles": {},
                    "transaction_id": params.form.workflowId
                };

                var tile = new TileModel(nameTemplate);
                var result = await tile.save();
                self.datasetId = result.resourceinstance_id;
                self.datasetNameTileId = result.tileid;
                return result.resourceinstance_id;
            };

            this.saveDatasetFiles = async(datasetNameTileResourceId) => {
                const datasetFilesArray = self.files();
                for(let i = 0; i < datasetFilesArray.length; ++i){
                    const file = datasetFilesArray[i];
                    // file has already been uploaded
                    if(file.fileInfo.uploaded()){ continue; }
                    
                    var result = await file.save(datasetNameTileResourceId);
                }
            };

            this.createObservationToDatasetXRef = async(datasetNameTileResourceId) => {
                // don't recreate references that already exist
                if(!!self.observationReferenceTileId){ return self.observationReferenceTileId; }

                const digitalReferenceTile = {
                    "tileid": self.observationReferenceTileId,
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
                self.observationReferenceTileId = result.tileid;
                return result;
            };

            this.createPhysicalThingToDatasetXRef = async(datasetNameTileResourceId) => {
                // don't recreate references that already exist
                if(!!self.physicalthingReferenceTileId){ return self.physicalthingReferenceTileId; }

                const digitalReferenceNodeGroupId = "8a4ad932-8d59-11eb-a9c4-faffc265b501";  
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
                    "resourceinstance_id": physicalThingId,
                    "sortorder": 1,
                    "tiles": {},
                    "transaction_id": params.form.workflowId
                };

                var tile = new TileModel(digitalReferenceTile);
                var result = await tile.save();
                self.physicalthingReferenceTileId = result.tileid;
                return result;
            };


        },
        template: { require: 'text!templates/views/components/workflows/upload-dataset/upload-files-step.htm' }
    });
});