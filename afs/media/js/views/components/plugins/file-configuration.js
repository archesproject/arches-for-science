define([
    'knockout',
    'arches',
    'file-renderers',
    'models/tile',
    'templates/views/components/plugins/file-configuration.htm',
    'bindings/codemirror',
], function(ko, arches, fileRenderers, TileModel, fileConfigurationTemplate) {
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
        this.files = params.files;
        this.codeMirrorText = ko.observable();
        this.rendererConfigs = ko.observableArray();
        this.selectedConfiguration = ko.observable();
        this.selectedFiles = ko.observableArray();
        this.visibleFile = ko.observable();
        this.showConfigurationPanel = ko.observable();
        this.applyConfigurationVisible = ko.observable(false);
        this.fileFormatRenderers = Object.values(fileRenderers);

        this.delimiterCharacter = ko.observable();
        this.headerFixedLines = ko.observable();

        this.renderer = 'e93b7b27-40d8-4141-996e-e59ff08742f3';

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
            paging: false,
            searching: true,
            scrollCollapse: true,
            info: false,
            columnDefs: [{
                orderable: false,
                targets: -1
            }],
        };

        this.dataFileTable = {
            ...this.fileTableConfig,
            columns: Array(3).fill(null)
        };

        this.otherFileTable = {
            ...this.fileTableConfig,
            columns: Array(2).fill(null)
        };

        const applyConfigurationVisibleCheck = () => {
            if (this.selectedConfiguration() && this.selectedFiles().length){
                this.applyConfigurationVisible(true);
            }
        };

        this.selectedConfiguration.subscribe(applyConfigurationVisibleCheck);

        const rendererConfigRefresh = (async() => {
            const rendererResponse = await fetch(`/renderer/${this.renderer}`);
            if(rendererResponse.ok){
                const renderers = await rendererResponse.json();
                const configs = renderers?.configs;
                this.rendererConfigs(configs);

                // if (self.fileViewer.displayContent()) {	
                //     const tile = self.fileViewer.displayContent().tile;	
                //     const node = ko.unwrap(tile.data[self.fileViewer.fileListNodeId]);
                //     const configId = ko.unwrap(node[0].rendererConfig);
                //     if(configId){
                //         this.selectedConfig(configId);
                //     }
                // }
            }
        });

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

            ret.validRenderer.subscribe(validity => {
                this.currentRendererValid(validity);
            });
            
            return ret;
        };

        this.updateConfiguration = async() => {
            const fileMap = this.selectedFiles().map(x => {
                return this.files().find(y => y.fileid == x);
            });

            await Promise.all(fileMap.map(async(file) => {
                const tilesResponse = await fetch(arches.urls.api_tiles(file.tileid));
                if(tilesResponse.ok) {
                    const tile = await tilesResponse.json();
                    const fileNode = tile?.data?.[file.nodeid];
                    if(fileNode){
                        const currentFile = fileNode.find(currentFile => currentFile.file_id == file.fileid);
                        currentFile.rendererConfig = this.selectedConfiguration();
                        currentFile.renderer = this.renderer;
                        file.details.rendererConfig = this.selectedConfiguration();
                        file.details.renderer = this.renderer;
                        (new TileModel(tile)).save();
                        this.rendererConfigs.valueHasMutated();
                    }
                }
            }));
        };

        this.updateCodeMirror = async(file) => {
            this.visibleFile(file.fileid);
            const displayContent = this.getDisplayContent(file.details);
            if(displayContent){
                const response = await fetch(displayContent.url);
                if(response.ok){
                    const fileContents = await response.text();
                    this.codeMirrorText(fileContents);
                }
            }
        };

        rendererConfigRefresh();

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
