define([
    'knockout',
    'arches',
    'file-renderers',
    'models/tile',
    'js-cookie',
    'utils/xy-parser',
    'templates/views/components/plugins/file-configuration.htm',
    'bindings/codemirror',
    'views/components/cards/file-renderers/xy-reader',
    'bindings/select2-query'
], function(ko, arches, fileRenderers, TileModel, Cookies, xyParser, fileConfigurationTemplate) {
    /*
        params.files - Must be structured as follows for each file.
            [{
                resourceinstanceid,
                tileid,
                nodeid,
                fileid,
                details
            }]
    */
    const vm = function(params) {
        this.alert = params.alert;
        this.fileRenderers = fileRenderers;
        this.files = params.files;
        this.selected = ko.observable(true);
        this.fileMap = ko.observable();
        this.fileMode = ko.observable('data');
        this.currentFiles = ko.observable([]);
        this.dataFiles = ko.observable([]);
        this.displayContent = ko.observable();
        this.additionalFiles = ko.observable([]);
        this.parsedData = ko.observable();
        this.loadingFile = ko.observable(false);
        this.renderer = 'e93b7b27-40d8-4141-996e-e59ff08742f3'; // xy reader uuid
        this.rendererUrl = `/renderer/${this.renderer}`;
        
        this.files.subscribe(() => {
            if(!this.rendererConfigs()){
                return;
            }
            this.fileMap(this.files().reduce((a, v) => ({ ...a, [v.fileid]: v}), {})); //flatten files 

            const filteredFiles = this.files().filter(file => file.details?.renderer == this.renderer);
            const additionalFiles = this.files().filter(file => file.details?.renderer != this.renderer);
            filteredFiles.map(file => {
                if(file.details?.rendererConfig){
                    file.details.rendererConfig = ko.observable(file.details?.rendererConfig);
                } else {
                    file.details.rendererConfig = ko.observable();
                }
                file.details.disabledConfig = ko.observable(true);
                file.details.rendererConfig.subscribe(() => {
                    this.updateConfiguration(file, file.details.rendererConfig());
                    this.selectedConfiguration(file.details.rendererConfig())
                });
                return file;
            });
            this.dataFiles(filteredFiles);
            this.additionalFiles(additionalFiles);
            this.fileMode.valueHasMutated();
        });

        this.toggleSelect = () => {
            if(!this.selectedFiles().length){
                this.selectedFiles(this.dataFiles().map(file => file?.details?.file_id));
                this.currentFiles([]);
                this.currentFiles(this.dataFiles());
            } else {
                this.selectedFiles([]);
                this.currentFiles([]);
                this.currentFiles(this.dataFiles());      
            }
        };

        this.codeMirrorText = ko.observable();
        this.rendererConfigs = ko.observableArray();
        this.rendererConfigs.subscribe(() => {
            if(this.files()){
                this.files.valueHasMutated();
            }
        });
        this.selectedConfiguration = ko.observable();

        this.selectedFile = ko.observable();
        this.selectedFiles = ko.observableArray();

        const checkApplyConfigurationVisible = () => {
            if(this.selectedFiles().length > 1 && this.selectedConfiguration()){
                this.applyConfigurationVisible(true);
            }
        }

        this.applyImporterToSelection = async() => {
            await Promise.all(this.selectedFiles().map(async(file) => {
                // await this.updateConfiguration(file, this.selectedConfiguration());
                const fileObject = this.files().find(fileObject => {
                    return fileObject.details.file_id == file
                });

                fileObject.details.rendererConfig(this.selectedConfiguration());
            }));
            this.applyConfigurationVisible(false);
            this.selectedFiles([]);
            this.selectedConfiguration(undefined);
        }

        this.selectedFiles.subscribe(() => {
            if(this.selectedFiles().length > 1 || this.selectedFiles().length === 0){
                this.dataFiles().map(file => {file.details.disabledConfig(true)});
            }
            if(this.selectedFiles().length == 1){
                const fileObject = this.files().find(fileObject => {
                    return fileObject.details.file_id == this.selectedFiles()[0]
                });
                this.displayFile(fileObject);
            }
            checkApplyConfigurationVisible();
        });

        this.selectedConfiguration.subscribe(() => {
            checkApplyConfigurationVisible();
            if(this.selectedFiles().length == 1 && this.selectedFile()){
                this.updateConfiguration(this.selectedFile(), this.selectedConfiguration())
                this.selectedFile()?.details?.rendererConfig?.(this.selectedConfiguration());
            }
        })
        this.visibleFile = ko.observable();
        this.showConfigurationPanel = ko.observable();
        this.editConfigurationId = ko.observable(undefined);


        this.applyConfigurationVisible = ko.observable(false);
        this.fileFormatRenderers = Object.values(fileRenderers);

        this.configurationName = ko.observable();
        this.configurationDescription = ko.observable();
        this.headerDelimiter = ko.observable();
        this.headerConfig = ko.observable();
        this.delimiterCharacter = ko.observable();
        this.headerFixedLines = ko.observable();
        this.dataDelimiterRadio = ko.observable();
        this.dataDelimiter = ko.observable();

        this.rendererConfigs = ko.observableArray();

        this.dataDelimiterRadio.subscribe(value => {
            if(value != 'other'){
                this.dataDelimiter(value);
            } else {
                this.dataDelimiter("");
            }
        });

        const refreshPreview = () => {
            if (!this.selectedConfiguration() || !this.codeMirrorText()){
                return;
            }
            const config = this.selectedConfiguration();
            const currentConfig = this.rendererConfigs().find(conf => conf.configid == config);
            const parsedArrays = xyParser.parse(this.codeMirrorText(), currentConfig.config);
            this.parsedData(parsedArrays.x.map((xItem, index) => `X: ${xItem} Y: ${parsedArrays.y[index]}`).join('\n'));
        }

        this.codeMirrorText.subscribe(() => {
            refreshPreview()
        });

        this.selectedConfiguration.subscribe(() => {
            refreshPreview();
        });

        this.getSelect2Config = function(fileDetails){
            return {
                clickBubble: false,
                disabled: fileDetails.disabledConfig,
                width: 'element',
                value: fileDetails.rendererConfig,
                closeOnSelect: true,
                placeholder: arches.translations.selectImporter,
                allowClear: true,
                multiple: false 
            }
        }

        this.fileTableConfig = {
            responsive: {
                breakpoints: [
                    {name: 'infinity', width: Infinity},
                    {name: 'bigdesktop', width: 1900},
                    {name: 'meddesktop', width: 1480},
                    {name: 'smalldesktop', width: 1280},
                    {name: 'medium', width: 1188},
                    {name: 'tabletl', width: 1024},
                    {name: 'btwtabllandp', width: 848},
                    {name: 'tabletp', width: 768},
                    {name: 'mobilel', width: 480},
                    {name: 'mobilep', width: 320}
                ]
            },
            searching: true,
            scrollCollapse: true,
            info: false,
            columnDefs: [{
                orderable: false,
                targets: -1
            }],
        };

        this.resizer = () => {
            const resizers = document.getElementsByClassName('resizer');
            const resizerArray = [].slice.call(resizers);
            resizerArray.map((resizerCol) => resizerCol.addEventListener('mousedown', (e) => {
                const dragElement = resizerCol;
                const startX = e.clientX;
                const dragRight = dragElement.nextElementSibling;
                const drStartWidth = parseInt(document.defaultView.getComputedStyle(dragRight).width);
                const dragLeft = dragElement.previousElementSibling;
                const dlStartWidth = parseInt(document.defaultView.getComputedStyle(dragLeft).width);
                const doDrag = (el) => {
                    dragRight.style.width = (drStartWidth + (startX - el.clientX)) + "px";
                    dragLeft.style.width = (dlStartWidth - (startX - el.clientX)) + "px";
                    return false;
                };
                dragElement.parentElement.addEventListener('mousemove', doDrag, false);
                const stopDrag = () => {
                    dragElement.parentElement.removeEventListener('mousemove', doDrag, false);
                    dragElement.parentElement.removeEventListener('mouseup', stopDrag, false);
                    return false;
                };
                dragElement.parentElement.addEventListener('mouseup', stopDrag, false);
                return false;
            }, false));
        };
        this.resizer();

        this.dataFileTable = {
            ...this.fileTableConfig,
            paging: true,
            pageLength: 5,
            lengthChange: false
        };

        const preparedRenderer = fileRenderers[this.renderer];
        preparedRenderer.state = {};
        preparedRenderer.disabled = true;
        this.selectedRenderer = ko.observable(preparedRenderer);

        this.loadConfiguration = (configuration) => {
            this.configurationName(configuration.name);
            this.configurationDescription(configuration.description);
            const delimiterCharacter = configuration.config.delimiterCharacter;
            if(configuration.config?.headerFixedLines){
                this.headerConfig('fixed');
                this.headerFixedLines(configuration.config.headerFixedLines);
            } else if (configuration.config?.headerDelimiter) {
                this.headerConfig('delimited');
                this.headerDelimiter(configuration.config.headerDelimiter);
            } else {
                this.headerConfig('none');
            }

            const radioValue = ((!delimiterCharacter) ? '' : delimiterCharacter == ',' || delimiterCharacter == '|' ? delimiterCharacter : 'other');
            this.dataDelimiterRadio(radioValue);
            if(radioValue == "other"){
                this.dataDelimiter(delimiterCharacter);
            }
            this.editConfigurationId(configuration.configid);
            this.showConfigurationPanel(true);
        };

        this.getDisplayContent = function(tiledata){
            var iconclass;
            var availableRenderers;
            var url = ko.unwrap(tiledata.url) || ko.unwrap(tiledata.content);
            var type = ko.unwrap(tiledata.type);
            var name = ko.unwrap(tiledata.name);
            var rendererid = ko.unwrap(tiledata.renderer);
            var renderer = this.fileFormatRenderers.find(function(item) {
                return item.id === rendererid;
            });
            if (!renderer) {
                availableRenderers = this.getDefaultRenderers(type, tiledata);
                if (!renderer) {
                    availableRenderers = this.getDefaultRenderers(type, ko.unwrap(tiledata.name));
                }
            }
            if (renderer) {
                iconclass = renderer.iconclass;
            }
            var ret = {
                validRenderer: ko.observable(true),
                url: url, type: type, name: name, renderer: renderer, iconclass: iconclass, renderers: availableRenderers
            };
            ret.availableRenderers = this.getDefaultRenderers(type, ret);
            
            return ret;
        };

        this.updateConfiguration = async(file, rendererConfigId) => {
            const tilesResponse = await fetch(arches.urls.api_tiles(file.tileid));
            if(tilesResponse.ok) {
                const tile = await tilesResponse.json();
                const fileNode = tile?.data?.[file.nodeid];
                if(fileNode){
                    const currentFile = fileNode.find(currentFile => currentFile.file_id == file.fileid);
                    currentFile.rendererConfig = rendererConfigId;
                    currentFile.renderer = this.renderer;
                    (new TileModel(tile)).save();
                    this.rendererConfigs.valueHasMutated();
                }
            }
        };

        this.fileMode.subscribe((mode) => {
            if(mode == 'data') {
                this.currentFiles(this.dataFiles());
            } else {
                this.currentFiles(this.additionalFiles());
            }
            this.currentFiles.valueHasMutated()
            this.selectedFile(undefined);
            this.selectedFiles([]);
            this.selectedConfiguration(undefined);
        });

        this.displayFile = async(file) => {
            if(this.selectedFiles().length > 1 || !file){
                return; // don't show files if more than one are selected
            }
            this.visibleFile(file.fileid);
            const dc = this.getDisplayContent(file.details);
            this.dataFiles().map(visibleFile => {
                visibleFile.details.disabledConfig(true);
            })
            file?.details?.disabledConfig?.(false);
            this.displayContent(dc);
            if(dc){
                const response = await fetch(dc.url);
                if(response.ok){
                    const fileContents = await response.text();
                    this.codeMirrorText(fileContents);
                }
            }
            return false;
        };

        this.selectedFile.subscribe((file) => {
            this.selectedConfiguration(ko.unwrap(file?.details?.rendererConfig));
            this.selectedFiles([file?.details?.file_id])
        });

        this.getDefaultRenderers = function(type, file){
            var defaultRenderers = [];
            this.fileFormatRenderers.forEach(function(renderer){
                var excludeExtensions = renderer.exclude ? renderer.exclude.split(",") : [];
                var rawFileType = type;
                try {
                    rawExtension = ko.unwrap(file).split('.').pop();
                } catch (error) {
                    var rawExtension = file.name ? ko.unwrap(file.name).split('.').pop() : undefined;
                }
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
    };

    return ko.components.register('file-configuration', {
        viewModel: vm,
        template: fileConfigurationTemplate
    });
});
