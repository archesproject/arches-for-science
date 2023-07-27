define([
    'underscore',
    'knockout',
    'uuid',
    'arches',
    'models/tile',
    'afs-formats',
    'js-cookie',
    'templates/views/components/workflows/chemical-analysis-workflow/ca-upload-files-step.htm',
    'bindings/uppy'
], function(_, ko, uuid, arches, TileModel, formats, Cookies, uploadFilesStepTemplate) {
    return ko.components.register('ca-upload-files-step', {
        viewModel: function(params) {
            // TODO: Fix afs-formats.js, loadComponentDependencies was commented out

            var self = this;
            const physicalThingId = params.projectinfo["select-phys-thing-step"].savedData().physicalThing;
            const observationInfo = params.observationinfo['instrument-info'].savedData();

            const datasetFileNodeId = "7c486328-d380-11e9-b88e-a4d18cec433a";
            const rendererLookup = {
                "3526790a-c73d-4558-b29d-98f574c91e61": {name: "Bruker Artax x-ray fluorescence spectrometer", renderer: "xrf-reader", rendererid: "31be40ae-dbe6-4f41-9c13-1964d7d17042"},
                "73717b33-1235-44a1-8acb-63c97a5c1157": {name: "Renishaw inVia Raman microscope using a 785 nm laser", renderer: "raman-reader", rendererid: "94fa1720-6773-4f99-b49b-4ea0926b3933"},
                "3365c1bf-070d-4a8e-b859-52dec6876c1d": {name: "ASD HiRes FieldSpec4", renderer: "fors-renderer", rendererid: "88dccb59-14e3-4445-8f1b-07f0470b38bb"},
                "image": {rendererid: "5e05aa2e-5db0-4922-8938-b4d2b7919733", renderer: "imagereader"},
                "pdf": {rendererid: "09dec059-1ee8-4fbd-85dd-c0ab0428aa94", renderer: "pdfreader"},
            };
            const physThingName = params.projectinfo["select-phys-thing-step"].savedData().physThingName;

            this.datasetId = undefined;
            this.defaultFormat = ko.observable();
            this.datasetName = ko.observable();
            this.calcDatasetName = ko.computed(function() {
                const basename = self.datasetName() || 'Dataset';
                return `${basename} (${physThingName})`;
            });
            this.datasetNameTileId = "";
            this.files = ko.observableArray();
            this.observationReferenceTileId = "";
            this.physicalthingReferenceTileId  = "";
            this.uniqueId = uuid.generate();
            this.uniqueidClass = ko.computed(function() {
                return "unique_id_" + self.uniqueId;
            });
            this.uppyOptions = {
                inline: true,
                dragDropTarget: '.dropzone-photo-upload',
                fileInputTarget: ".fileinput-button."+ this.uniqueidClass(),
                autoProceed: true,
                filesAdded: (files) => {
                    files.successful.map(file => self.saveFiles(file));
                }
            };

            this.loadingMessage = ko.observable();
            this.loading = ko.observable(false);
            this.formats = ko.observableArray(Object.values(formats).map(format => {return {"text": format.name, "id": format.id};}));

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
                        

                        // .json should not typically be awaited without "ok" checking - but 500 seems to return json body in some cases.
                        const body = await resp.json();

                        if(resp.status == 200 || (resp.status == 500 && body?.message?.includes("likely already deleted"))){
                            const datasetFiles = this.files();
                            this.files(datasetFiles.filter(datasetFile => 
                                ko.unwrap(datasetFile.tileId) != fileTile
                            ));

                            saveWorkflowState();
                        }
                    } finally {
                        self.loading(false);
                    }
                }
            };

            this.init = function() {
                this.physicalthingReferenceTileId = params.form.value()?.physicalthingReferenceTileId ?? "";
                this.observationReferenceTileId = params.form.value()?.observationReferenceTileId ?? "";
                this.datasetId = params.form.value()?.datasetId ?? "";
                this.datasetName(params.form.value()?.datasetName ?? "");
                this.defaultFormat(params.form.value()?.defaultFormat);
                this.datasetNameTileId = params.form.value()?.datasetNameTileId ?? "";
                (params.form.value()?.files ?? []).forEach(function(file){
                    self.files.push(file);
                });
            };

            this.init();

            this.uniqueidClass = ko.pureComputed(function() {
                return "unique_id_" + self.uniqueId;
            });
            
            params.form.reset = this.reset = function(){
                self.datasetName(params.form.value()?.datasetName);
            };

            this.datasetName.subscribe(function(name) {
                params.form.dirty(name !== params.form?.savedData()?.datasetName && self.files().length > 0);
            });
            this.files.subscribe(function(){
                params.form.dirty(false);

            });


            this.saveDatasetFile = (formData, file) => {
                //Tile structure for the Digital Resource 'File' nodegroup
                self.loading(true);

                if(file) {
                    self.loadingMessage(`File upload complete, building data structures`);
                    let fileInfo;
                    
                    if (!ko.unwrap(file.tileId)) {
                        fileInfo = {
                            name: file.name,
                            accepted: true,
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
                            content: null,
                            error: file.error,
                        };

                        formData.append(`file-list_${datasetFileNodeId}_data`, JSON.stringify(fileInfo));
                        formData.append(`file-list_${datasetFileNodeId}_preloaded`, new Blob(), file.name);
                    }
                }
            };

            params.form.save = () => {
                params.form.complete(false);
                if(self.files().length > 0) {
                    this.saveFiles([]);
                }
                params.form.dirty(false);
                params.form.complete(true);
            };

            this.saveFiles = async(files) => {
                if(!Array.isArray(files)){
                    files = [files];
                }
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
                        "defaultFormat": ko.unwrap(self.defaultFormat)
                    }));

                    self.loading(true);
                    self.loadingMessage(`Saving dataset ${self.calcDatasetName()}`);
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
                    if(resp.ok) {
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
                    } else {
                        throw('Error saving uploaded files', resp); // rethrow with easier to understand message.  
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


            const saveWorkflowState = async() => {
                try {
                    const dataToSave = {
                        physicalthingReferenceTileId: self.physicalthingReferenceTileId,
                        observationReferenceTileId: self.observationReferenceTileId,
                        datasetName: self.datasetName(),
                        datasetNameTileId: self.datasetNameTileId,
                        datasetId: self.datasetId,
                        defaultFormat: self.defaultFormat(),
                        files: self.files()
                    };

                    params.form.savedData(dataToSave);
                    params.form.value(dataToSave);
                    params.form.complete(true);
                    params.form.dirty(false);
                } catch(err) {
                    // eslint-disable-next-line no-console
                    console.log('Tile update failed', err);
                    params.pageVm.alert(new params.form.AlertViewModel(
                        'ep-alert-red', 
                        'Error saving the Dataset',
                    ));
                    params.form.loading(false);
                    return;
                }
                
            };
        },
        template: uploadFilesStepTemplate
    });
});