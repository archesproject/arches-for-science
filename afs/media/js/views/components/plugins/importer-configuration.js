define([
    'knockout',
    'jquery',
    'js-cookie',
    'templates/views/components/plugins/importer-configuration.htm',
    'bootstrap'
], function(ko, $, Cookies, importerConfigurationTemplate) {
    const vm = function(params) {
        this.rendererConfigs = params.rendererConfigs || ko.observableArray();
        this.selectedConfiguration = params.selectedConfiguration || ko.observable();
        this.showConfigurationPanel = ko.observable();
        this.editConfigurationId = ko.observable(undefined);
    
        this.applyConfigurationVisible = ko.observable(false);
        this.configurationName = ko.observable();
        this.configurationDescription = ko.observable();
        this.headerDelimiter = ko.observable();
        this.headerConfig = ko.observable();
        this.delimiterCharacter = ko.observable();
        this.headerFixedLines = ko.observable();
        this.dataDelimiterRadio = ko.observable();
        this.dataDelimiter = ko.observable();

        this.dataDelimiterRadio.subscribe(value => {
            if(value != 'other'){
                this.dataDelimiter(value);
            } else {
                this.dataDelimiter("");
            }
        });

        this.renderer = 'e93b7b27-40d8-4141-996e-e59ff08742f3';

        this.cancelConfigEdit = () => {
            this.showConfigurationPanel(false);
        };

        this.saveConfigEdit = async() => {
            const configId = this.editConfigurationId() ?? '';

            if(this.headerConfig() !== 'fixed'){
                this.headerFixedLines(undefined);
            } 
            if(this.headerConfig() !== 'delimited') {
                this.headerDelimiter(undefined); // blank out previous values; don't save them.
            }

            const newConfiguration = {
                name: this.configurationName(),
                description: this.configurationDescription(),
                headerDelimiter: this.headerDelimiter(),
                headerFixedLines: this.headerFixedLines(),
                delimiterCharacter: this.dataDelimiter(),
                rendererId: this.renderer
            };

            const configSaveResponse = await fetch(`/renderer_config/${configId}`, {
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

            this.showConfigurationPanel(false);
        };

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

        this.deleteConfiguration = async(configuration) => {
            const configDeleteResponse = await fetch(`/renderer_config/${configuration.configid}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    "X-CSRFToken": Cookies.get('csrftoken')
                }
            });
            if(configDeleteResponse.ok){
                this.rendererConfigRefresh();
            }
        };

        rendererConfigRefresh();
    };

    return ko.components.register('importer-configuration', {
        viewModel: vm,
        template: importerConfigurationTemplate
    });
});
