define(['jquery',
    'knockout',
    'templates/views/components/cards/file-renderers/xy-reader.htm',
    'viewmodels/afs-instrument',
    'js-cookie',
    'utils/xy-parser',
    'bindings/plotly',
    'bindings/select2-query',
    'views/components/plugins/importer-configuration'
], function($, ko, afsReaderTemplate, AfsInstrumentViewModel, Cookies, XyParser) {
    return ko.components.register('xy-reader', {
        viewModel: function(params) {
            const self = this;
            this.alert = params?.pageVm?.alert;
            this.showConfigAdd = ko.observable(false);
            this.configName = ko.observable();
            this.delimiterCharacter = ko.observable();
            this.invalidDelimiter = ko.observable(false);
            this.headerDelimiter = ko.observable();
            this.headerFixedLines = ko.observable();
            this.selectedConfig = params.selectedConfig || ko.observable();
            this.selectedFile = params.selectedFile || ko.observable();
            this.selectedConfiguration = undefined;
            AfsInstrumentViewModel.apply(this, [params]);
            this.rendererUrl = `/renderer/${self.renderer}`;

            this.rendererConfigs = ko.observable([]);

            // on init, get available renderer configs for display to user.
            const rendererConfigRefresh = (async() => {
                const rendererResponse = await fetch(`/renderer/${self.renderer}`);
                if(rendererResponse.ok){
                    const renderers = await rendererResponse.json();
                    const configs = renderers?.configs;
                    this.rendererConfigs(configs);
                    const displayContent = self.fileViewer?.displayContent() || self.displayContent;
                    if (displayContent) {
                        const tile = displayContent.tile;	

                        // displayContent is formatted differently from the core file viewer.
                        const configId = tile ? ko.unwrap(tile.data[self.fileViewer.fileListNodeId])?.[0]?.rendererConfig : displayContent?.rendererConfig;

                        if(configId){
                            this.selectedConfig(ko.unwrap(configId));
                        }
                    }
                }
            });

            this.selectedConfig.subscribe((config) => {
                if(!config || (this.selectedFile() && this.selectedFile().url != this.displayContent.url)) {
                    return;
                }
                this.selectedConfiguration = this.rendererConfigs().find(currentConfig => {
                    return currentConfig.configid == config;
                });
                self.render();
                if (self.fileViewer?.displayContent()) {	
                    const tile = self.fileViewer.displayContent().tile;	
                    const node = ko.unwrap(tile.data[self.fileViewer.fileListNodeId]);
                    const currentRendererConfig = ko.unwrap(node[0].rendererConfig);
                    if(config != currentRendererConfig){
                        node[0].rendererConfig = config;
                        tile.save();
                    }
                }	
            });

            rendererConfigRefresh();

            this.delimiterCharacter.subscribe(x => {
                try {
                    const valueRegex = (delimiterCharacter.length < 2) ? new RegExp(`[${delimiterCharacter}\\s]+`) : new RegExp(`${delimiterCharacter}`)
                    this.invalidDelimiter(false);
                } catch {
                    this.invalidDelimiter(true)
                }
            });

            this.addConfiguration = () => {
                self.showConfigAdd(true);
            };
            this.saveConfiguration = async() => {
                const newConfiguration = {
                    name: self.configName(),
                    headerDelimiter: self.headerDelimiter(),
                    headerFixedLines: self.headerFixedLines(),
                    delimiterCharacter: self.delimiterCharacter(),
                    rendererId: self.renderer
                };
                const configSaveResponse = await fetch('/renderer_config/', {
                    method: 'POST',
                    credentials: 'include',
                    body: JSON.stringify(newConfiguration),
                    headers: {
                        "X-CSRFToken": Cookies.get('csrftoken')
                    }
                });
                if(configSaveResponse.ok){
                    rendererConfigRefresh();
                }
                self.showConfigAdd(false);
            };
            this.parse = function(text, series){
                const config = this.selectedConfiguration?.config;
                try {
                    const parsedData = XyParser.parse(text, config);
                    this.invalidDelimiter(false);
                    series.value.push(...parsedData.x);
                    series.count.push(...parsedData.y);
                } catch(e){
                    this.invalidDelimiter(true);
                    throw(e);
                }
            };
            this.chartTitle("XRF Spectrum");
            this.xAxisLabel("keV");
            this.yAxisLabel("Count");
        },
        template: afsReaderTemplate
    });
});
