define(['jquery',
    'knockout',
    'templates/views/components/cards/file-renderers/xy-reader.htm',
    'viewmodels/afs-instrument',
    'js-cookie',
    'bindings/plotly',
    'bindings/select2-query',
], function($, ko, afsReaderTemplate, AfsInstrumentViewModel, Cookies) {
    return ko.components.register('xy-reader', {
        viewModel: function(params) {
            const self = this;
            this.showConfigAdd = ko.observable(false);
            this.configName = ko.observable();
            this.delimiterCharacter = ko.observable();
            this.headerDelimiter = ko.observable();
            this.headerFixedLines = ko.observable();
            this.selectedConfig = ko.observable();
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
                    if (self.fileViewer.displayContent()) {	
                        const tile = self.fileViewer.displayContent().tile;	
                        const node = ko.unwrap(tile.data[self.fileViewer.fileListNodeId]);
                        const configId = ko.unwrap(node[0].rendererConfig);
                        if(configId){
                            this.selectedConfig(configId);
                        }
                    }
                }
            });

            this.selectedConfig.subscribe((config) => {
                if(!config) {
                    return;
                }
                this.selectedConfiguration = this.rendererConfigs().find(currentConfig => {
                    return currentConfig.configid == config;
                });
                self.render();
                if (self.fileViewer.displayContent()) {	
                    const tile = self.fileViewer.displayContent().tile;	
                    const node = ko.unwrap(tile.data[self.fileViewer.fileListNodeId]);
                    const currentRendererConfig = ko.unwrap(node[0].rendererConfig);
                    if(config != currentRendererConfig){
                        node[0].rendererConfig = config;
                        tile.save();
                    }
                }	
            });

            this.processConfigs = (data) => {
                return { "results": data?.configs?.map(renderer => {return { text: renderer.name, "id": renderer.configid};})};
            };

            rendererConfigRefresh();
    
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
                let values;
                const config = this.selectedConfiguration?.config;
                try {
                    if(config?.headerDelimiter){
                        values = text.split(config?.headerDelimiter)[1].trim().split('\n');
                    } else if (config?.headerFixedLines) {
                        const lines = text.split('\n');
                        values = lines.slice(config?.headerFixedLines);
                    } else {
                        values = text.split('\n'); 
                    }
                } catch(e) {
                    values = text.split('\n');
                }
                const delimiterCharacter = config?.delimiterCharacter ?? ',';
                const valueRegex = new RegExp(`[ ${delimiterCharacter}]+`);

                values.forEach(function(val){
                    var rec = val.trim().split(valueRegex);
                    if (Number(rec[1]) > 30 && rec[0] > 0.5) {
                        series.count.push(Number(rec[1]));
                        series.value.push(Number(rec[0]));
                    }
                });
            };
            this.chartTitle("XRF Spectrum");
            this.xAxisLabel("keV");
            this.yAxisLabel("Count");
        },
        template: afsReaderTemplate
    });
});
