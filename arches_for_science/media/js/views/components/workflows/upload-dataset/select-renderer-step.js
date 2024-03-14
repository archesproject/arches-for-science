define([
    'jquery',
    'knockout',
    'templates/views/components/workflows/upload-dataset/select-renderer-step.htm',
    'arches',
    'views/components/workbench',
    'file-renderers',
    'views/components/plugins/file-configuration',
], function($, ko, fileInterpretationStepTemplate, arches, WorkbenchComponentViewModel, fileRenderers) {
    function viewModel(params) {
        this.alert = params.pageVm.alert;
        params.configKeys = ['acceptedFiles', 'maxFilesize'];
        const datasetInfo = params.datasetInfo;
        let datasetIds = undefined;
        this.currentRendererValid = ko.observable(true);
        this.loading = ko.observable(false);
        this.loadingMessage = ko.observable();
        this.showDatasetList = ko.observable(true);
        this.showFileList = ko.observable(false);
        this.files = ko.observable([]);
        this.showFileInfo = ko.observable(false); 
        this.rendererConfigs = ko.observable();
        this.rendererUrl = ko.observable();
        this.renderers = ko.observable(Object.values(fileRenderers).map(format => {return {"text": format.name, "id": format.id};}));

        this.selectedConfig = ko.observable();
        this.processConfigs = (data) => {
            return { "results": data?.configs?.map(renderer => {return { text: renderer.name, "id": renderer.configid};})};
        };

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

        this.fileFormatRenderers = Object.values(fileRenderers);
        this.selected = ko.observable();
        params.value({});

        this.digitalResources = ko.observableArray();
        this.getDigitalResource = async(resourceid) => {
            const response = await window.fetch(arches.urls.api_resources(resourceid) + '?format=json&compact=false&v=beta');
            if(!response.ok) {return;}
            const data = await response.json();

            this.digitalResources.push(data);
        };
        
        const loadDigitalResources = async() => {
            return Promise.all(datasetIds.map(async(datasetId) => {
                return this.getDigitalResource(datasetId);
            }));
        };

        (async() => {
            this.loading(true);
            this.loadingMessage(arches.translations.loadingDatasets);
            await loadDigitalResources();
            
            // the following divorces the file's data from the label based graph structure.
            this.files(this.digitalResources().flatMap(resource => {
                return resource?.resource?.File;
            }).map(file => {
                return {
                    tileid: file['@tile_id'],
                    nodeid: file['@node_id'],
                    fileid: file.file_details?.[0].file_id,
                    details: file.file_details?.[0]
                };
            })); 

            this.loading(false);
        })();
    }
    ko.components.register('select-renderer-step', {
        viewModel: viewModel,
        template: fileInterpretationStepTemplate
    });

    return viewModel;
});