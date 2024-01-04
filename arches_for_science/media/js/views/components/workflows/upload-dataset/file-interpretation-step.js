define([
    'jquery',
    'knockout',
    'templates/views/components/workflows/upload-dataset/file-interpretation-step.htm',
    'arches',
    'uuid',
    'viewmodels/card-component',
    'viewmodels/card-multi-select',
    'views/components/workbench',
    'file-renderers',
    'js-cookie',
    'models/tile',
], function($, ko, fileInterpretationStepTemplate, arches, uuid, CardComponentViewModel, CardMultiSelectViewModel, WorkbenchComponentViewModel, fileRenderers, Cookies, TileModel) {
    function viewModel(params) {

        params.configKeys = ['acceptedFiles', 'maxFilesize'];
        var self = this;
        const interpretationValueid = '2eef4771-830c-494d-9283-3348a383dfd6';
        const briefTextValueid = '72202a9f-1551-4cbc-9c7a-73c02321f3ea';
        const datasetInfo = params.datasetInfo;
        self.currentRendererValid = ko.observable(true);
        self.loading = ko.observable(false);
        self.loadingMessage = ko.observable();
        self.showDatasetList = ko.observable(true);
        self.showFileList = ko.observable(false);
        self.showFileInfo = ko.observable(false);
        let datasetIds = undefined;

        if (datasetInfo["select-dataset-files-step"]){
            datasetIds = datasetInfo["select-dataset-files-step"].savedData()?.parts.reduce(
                (acc, part) => {
                    if (part.datasetId) { 
                        acc.push(part.datasetId);
                    }
                    return acc;
                }, 
                []
            );
        } else if (datasetInfo["select-dataset-instances"]){
            datasetIds = datasetInfo["select-dataset-instances"].savedData()?.digitalResources?.reduce(
                (acc, res) => {
                    if (res.resourceid && res.selected === true) { 
                        acc.push(res.resourceid);
                    }
                    return acc;
                }, 
                []
            );
        } else if (params.datasetInfoFromUploadFilesStep){
            datasetIds = [params.datasetInfoFromUploadFilesStep['upload-files-step'].savedData().datasetId];
        }

        this.fileRenderers = Object.values(fileRenderers);
        this.fileStatementParameter = ko.observable();
        this.fileStatementInterpretation = ko.observable();
        this.selected = ko.observable();
        params.value({});
        this.dirty = ko.computed(function(){
            for (var value of Object.values(params.value())) {
                if(value.fileStatementParameter.dirty() || 
                   value.fileStatementInterpretation.dirty()){
                    return true;
                }
            }
            return false;
        });
        this.save = async() => {
            if (!this.dirty()) {
                return;
            }
            self.loading(true);
            self.loadingMessage(arches.translations.saving);
            for (const tileid in params.value()) {
                const value = params.value()[tileid];
                if(value.fileStatementParameter.dirty()){
                    value.fileStatementParameter.save();
                }
                if(value.fileStatementInterpretation.dirty()){
                    value.fileStatementInterpretation.save();
                }
            }

            //reload digital resources
            const oldDigitalResourceId = self.selectedDigitalResource().resourceinstanceid;
            const oldFileTileId = self.selectedFile()["@tile_id"];
            self.digitalResources([]);

            self.loading(true);
            self.loadingMessage(arches.translations.loadingDatasets);
            await loadDigitalResources(false);
            if(oldDigitalResourceId){
                self.selectedDigitalResource(self.digitalResources().find(digitalResource => digitalResource.resourceinstanceid == oldDigitalResourceId));
            } 

            if(oldFileTileId){
                self.selectedFile(self.files().find(file => file["@tile_id"] == oldFileTileId));
            } 
            //await this.updateRenderer()
            params.form.complete(true);
            self.loading(false);
        };

        params.form.reset = function(){
            for (var value of Object.values(params.value())) {
                value.fileStatementParameter.reset();
                value.fileStatementInterpretation.reset();
            }
            const file = params.value()?.[self.selectedFile()?.['@tile_id']];
            if(file){
                self.fileStatementParameter(file.fileStatementParameter.fileStatement());
                self.fileStatementInterpretation(file.fileStatementInterpretation.fileStatement());
            }
        };
        this.reset = params.form.reset;
        
        this.fileStatementParameter.subscribe(function(fp) {
            if(!!this.selectedFile()){
                var obj = params.value();
                var tileid = this.selectedFile()['@tile_id'];
                obj[tileid].fileStatementParameter.updateStatement(fp);
                params.value.valueHasMutated();
            }
        }, this);

        this.fileStatementInterpretation.subscribe(function(fp) {
            if(!!this.selectedFile()){
                var obj = params.value();
                var tileid = this.selectedFile()['@tile_id'];
                obj[tileid].fileStatementInterpretation.updateStatement(fp);
                params.value.valueHasMutated();
            }
        }, this);
        
        this.fileRenderers.forEach(function(r){
            r.state = {};
            r.disabled = true;
        });

        var FileStatement = function(tileid, parenttileid, resourceInstanceId, fileStatement, statementTypeId){
            var self = this;

            const buildStrObject = str => {
                return {[arches.activeLanguage]: {
                    "value": str,
                    "direction": arches.languages.find(lang => lang.code == arches.activeLanguage).default_direction
                }};
            };

            if(!tileid){
                tileid = '';
            }
            var tileObj = {
                "tileid": tileid,
                "data": {
                    "ca227726-78ed-11ea-a33b-acde48001122": fileStatement,
                    "ca2272c6-78ed-11ea-a33b-acde48001122": [
                        statementTypeId
                    ],
                    "ca227582-78ed-11ea-a33b-acde48001122": [
                        "bc35776b-996f-4fc1-bd25-9f6432c1f349"
                    ]
                },
                "nodegroup_id": "ca226fe2-78ed-11ea-a33b-acde48001122",
                "parenttile_id": parenttileid,
                "resourceinstance_id": resourceInstanceId,
                "sortorder": 0,
                "tiles": {}
            };
            this.tile = new TileModel(tileObj);
            this.fileStatement = ko.observable(fileStatement);
            this._fs = ko.observable(fileStatement);
            this.updateStatement = function(newStatement){
                self.tile.get('data')['ca227726-78ed-11ea-a33b-acde48001122'] = buildStrObject(newStatement);
                self.fileStatement(newStatement);
            };
            this.save = function(){
                self.tile.save(function(request, status, tileModel){
                    if(status === 'success'){
                        tileModel.set('tileid', request.responseJSON.tileid);
                        self._fs(self.fileStatement());
                    }
                });
            };
            this.dirty = ko.computed(function(){
                return this._fs() !== this.fileStatement();
            }, this);
            this.reset = function(){
                self.updateStatement(self._fs());
            };
        };

        this.digitalResources = ko.observableArray();
        this.getDigitalResource = async(resourceid, newStatements) => {
            const response = await window.fetch(arches.urls.api_resources(resourceid) + '?format=json&compact=false&v=beta');
            if(!response.ok) {return;}
            const data = await response.json();

            self.digitalResources.push(data);
            var obj = params.value();
            data.resource?.File?.forEach(function(datafile){
                var fileTileid = datafile['@tile_id'];
                if (!(fileTileid in obj)){
                    obj[fileTileid] = {
                        'fileStatementParameter': '',
                        'fileStatementInterpretation': ''
                    };
                }

                var getStatement = function(valueid){
                    var fileStatement;
                    fileStatement = datafile?.FIle_Statement?.find(function(statement){
                        return statement.FIle_Statement_type['concept_details'][0].valueid === valueid;
                    });


                    if(fileStatement){
                        return new FileStatement(
                            fileStatement['@tile_id'], fileTileid, resourceid, fileStatement.FIle_Statement_content['@display_value'], valueid
                        );
                    } else {
                        return new FileStatement(
                            '', fileTileid, resourceid, '', valueid
                        );          
                    }
                };
                
                if(newStatements){
                    obj[fileTileid].fileStatementParameter = getStatement(briefTextValueid);
                    obj[fileTileid].fileStatementInterpretation = getStatement(interpretationValueid);
                    params.value(obj);   
                }
            });
        };
        
        const loadDigitalResources = async(newStatements=true) => {
            return Promise.all(datasetIds.map(async(datasetId) => {
                return self.getDigitalResource(datasetId, newStatements);
            }));
        };

        (async() => {
            self.loading(true);
            self.loadingMessage(arches.translations.loadingDatasets);
            await loadDigitalResources();
            self.loading(false);
        })();

        this.digitalResourceFilter = ko.observable('');
        this.selectedDigitalResource = ko.observable();
        this.selectedDigitalResource.subscribe(function(selectedDigitalResource){
            this.files(selectedDigitalResource?.resource?.File ?? []);
        }, this);
        this.filteredDigitalResources = ko.pureComputed(function(){
            return this.digitalResources().filter(function(dr){
                return dr.resource.Name.Name_content['@display_value'].toLowerCase().includes(this.digitalResourceFilter().toLowerCase());
            }, this);
        }, this);

        this.displayContent = undefined;
        this.files = ko.observableArray();
        this.fileFilter = ko.observable('');
        this.selectedRenderer = ko.observable();
        this.selectedFile = ko.observable();
        this.selectedFileDropdownData = ko.observable();
        this.selectedFileDropdownData.subscribe(fileId => {
            const filteredFile = self.filteredFiles().find(file => file.file_details[0].file_id === fileId);
            if (filteredFile) {
                self.selectedFile(filteredFile)
            }
        })
        this.initSelection = function(selectedConfig, callback) {
            const selectedFile = self.selectedFile();
            if(selectedFile){
                callback([{id: selectedFile.file_details[0].id, text: selectedFile.file_details[0].name}]);
            }else{
                callback([]);
            }
        };

        self.selectedFile.subscribe(function(selectedFile){
            if(!!selectedFile){
                self.selected(true);
                self.displayContent = self.getDisplayContent(selectedFile.file_details[0]);
                self.selectedRenderer(self.displayContent?.renderer);

                // self.selectedFile(selectedFile);
                var file = params.value()[selectedFile['@tile_id']];
                self.fileStatementParameter(file.fileStatementParameter.fileStatement());
                self.fileStatementInterpretation(file.fileStatementInterpretation.fileStatement());
                self.selectedFileDropdownData(selectedFile.file_details[0].file_id);
            } else {
                // self.selectedFile.selected(false);
                self.fileStatementParameter(undefined);
                self.fileStatementInterpretation(undefined);
            }
        });

        this.filteredFiles = ko.pureComputed(function(){
            return this.files().filter(function(file){
                return file.file_details[0].name.toLowerCase().includes(this.fileFilter().toLowerCase());
            }, this);
        }, this);
        this.fileInterpretationTiles = ko.observableArray();

        this.getDisplayContent = function(filedata){
            var availableRenderers;
            const url = ko.unwrap(filedata.url) || ko.unwrap(filedata.content);
            const type = ko.unwrap(filedata.type);
            const name = ko.unwrap(filedata.name);
            const rendererid = ko.unwrap(filedata.renderer);
            const renderer = self.fileRenderers.find(function(item) {
                return item.id === rendererid;
            });
            const rendererConfig = ko.unwrap(filedata.rendererConfig);
            if (!renderer) {
                availableRenderers = self.getDefaultRenderers(type, filedata);
                if (!availableRenderers) {
                    availableRenderers = self.getDefaultRenderers(type, ko.unwrap(filedata.name));
                }
            }

            const displayContent = {
                validRenderer: ko.observable(true),
                url: url, 
                type: type, 
                name: name, 
                renderer: renderer, 
                iconclass: renderer?.iconclass, 
                renderers: availableRenderers, 
                rendererConfig: rendererConfig
            };
            displayContent.availableRenderers = self.getDefaultRenderers(type, displayContent);

            displayContent.validRenderer.subscribe(validity => {
                self.currentRendererValid(validity);
            });
            
            return displayContent;
        };


        this.applyToAll = ko.observable(false);

        this.fileRenderer = ko.observable();
        this.managerRenderer = ko.observable();

        this.acceptedFiles = ko.observable(null);


        WorkbenchComponentViewModel.apply(this, [params]);
        this.workbenchWrapperClass = ko.observable('autoheight');

        this.fileRenderer.subscribe(function(){
            if (['add', 'edit', 'manage'].indexOf(self.activeTab()) < 0) {
                self.activeTab(undefined);
            }
        });

        this.getFileFormatRenderer = function(rendererid) {
            return self.fileRenderers.find(function(item) {
                return item.id === rendererid;
            });
        };

        this.getDefaultRenderers = function(type, file){
            var defaultRenderers = [];
            this.fileRenderers.forEach(function(renderer){
                var excludeExtensions = renderer.exclude ? renderer.exclude.split(",") : [];
                var rawFileType = type;
                var rawExtension = file.name ? ko.unwrap(file.name).split('.').pop() : ko.unwrap(file).split('.').pop();
                if (renderer.type === rawFileType && renderer.ext === rawExtension)  {
                    defaultRenderers.push(renderer);
                }
                var splitFileType = ko.unwrap(type).split('/');
                var fileType = splitFileType[0];
                var splitAllowableType = renderer.type.split('/');
                var allowableType = splitAllowableType[0];
                var allowableSubType = splitAllowableType[1];
                if (allowableSubType === '*' && fileType === allowableType && excludeExtensions.indexOf(rawExtension) < 0) {
                    defaultRenderers.push(renderer);
                }
            }); 
            return defaultRenderers;
        };

        this.uniqueId = uuid.generate();

        this.selectDefault = function(){
            var self = this;
            return function() {
                var t;
                var openTab = self.activeTab() === 'manage' ? 'manage' : 'edit'; 
                self.toggleTab(openTab);
                var selectedIndex = self.card.tiles.indexOf(self.selected());
                if(self.card.tiles().length > 0 && selectedIndex === -1) {
                    selectedIndex = 0;
                }
                t = self.card.tiles()[selectedIndex];
                if(t) {
                    t.selected(true);
                    self.selectItem(t);
                }
                self.activeTab(openTab);
            };
        };
        this.defaultSelector = this.selectDefault();

        this.checkIfRendererIsValid = function(file, renderer){
            var defaultRenderers = self.getDefaultRenderers(ko.unwrap(file.type), ko.unwrap(file.name));
            return (defaultRenderers.indexOf(renderer) > -1);
        };

        this.applyRendererToStaged = function(renderer) {
            this.card.staging().forEach(function(tileid){
                var stagedTile = self.card.tiles().find(function(t){return t.tileid == tileid;});
                if (stagedTile) {
                    var node = ko.unwrap(stagedTile.data[self.fileListNodeId]);
                    var file = node[0];
                    var valid = self.checkIfRendererIsValid(file, renderer);
                    if (valid) {
                        file.renderer = renderer ? renderer.id : '';
                        stagedTile.save();
                    }
                }
            });
        }; 

        this.applyRendererToSelected = function(renderer){	
            if (self.displayContent()) {	
                var tile = self.displayContent().tile;	
                var node = ko.unwrap(tile.data[self.fileListNodeId]);	
                if (node.length > 0) {	
                    var valid = self.checkIfRendererIsValid(node[0], renderer);	
                    if (valid) {	
                        node[0].renderer = renderer ? renderer.id : '';	
                        tile.save();	
                    }	
                }	
            } if (ko.unwrap(self.applyToAll)) {
                self.applyRendererToStaged(renderer);
            }	
        };

        this.selectItem = function(val){
            if (val && val.selected) {
                if (ko.unwrap(val) !== true && ko.unwrap(val.selected) !== true) {
                    val.selected(true);
                }
            }
        };

        this.removeTile = function(val){
            val.deleteTile(null, self.defaultSelector);
        };

        this.removeTiles = function() {
            this.card.staging().forEach(function(tileid){
                var stagedTile = self.card.tiles().find(function(t){return t.tileid == tileid;});
                if (stagedTile) {
                    stagedTile.deleteTile(null, self.defaultSelector);
                }
            }, this);
            self.card.staging([]);
        };  
        
        this.stageAll = function() {
            this.card.tiles().forEach(function(tile){
                if (self.card.staging().indexOf(tile.tileid) < 0) {
                    self.card.staging.push(tile.tileid);
                }
            });
        };

        this.clearStaging = function() {
            self.card.staging([]);
        };

        function sleep(milliseconds) {
            var start = new Date().getTime();
            for (var i = 0; i < 1e7; i++) {
                if ((new Date().getTime() - start) > milliseconds){
                    break;
                }
            }
        }

        function stageTile(t) {
            self.card.staging.push(t.tileid);
        }

        this.downloadSelection = function() {
            var url = arches.urls.download_files + "?tiles=" + JSON.stringify(self.card.staging()) + "&node=" + self.fileListNodeId;
            window.open(url);
        };

        this.addTile = function(file){
            var newtile;
            newtile = self.card.getNewTile();
            var defaultRenderers = self.getDefaultRenderers(file.type, file.name);
            var tilevalue = {
                name: file.name,
                accepted: true,
                height: file.height,
                lastModified: file.lastModified,
                size: file.size,
                status: file.status,
                type: file.type,
                width: file.width,
                url: null,
                file_id: null,
                index: 0,
                content: window.URL.createObjectURL(file),
                error: file.error,
                renderer: defaultRenderers.length === 1 ? defaultRenderers[0].id : undefined,
            };
            newtile.data[self.fileListNodeId]([tilevalue]);
            newtile.formData.append('file-list_' + self.fileListNodeId, file, file.name);
            newtile.resourceinstance_id = self.card.resourceinstanceid;
            if (self.card.tiles().length === 0) {
                sleep(100);
            }
            newtile.save(null, stageTile);
            self.card.newTile = undefined;
        };

    }

    ko.components.register('file-interpretation-step', {
        viewModel: viewModel,
        template: fileInterpretationStepTemplate
    });

    return viewModel;
});