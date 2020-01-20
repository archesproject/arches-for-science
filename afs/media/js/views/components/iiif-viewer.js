define([
    'knockout',
    'views/components/workbench'
], function(ko, WorkbenchViewmodel) {
    var IIIFViewerViewmodel = function(params) {
        WorkbenchViewmodel.apply(this, [params]);
    };
    ko.components.register('iiif-viewer', {
        viewModel: IIIFViewerViewmodel,
        template: {
            require: 'text!templates/views/components/iiif-viewer.htm'
        }
    });
    return IIIFViewerViewmodel;
});
