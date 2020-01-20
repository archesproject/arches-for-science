define([
    'knockout',
    'views/components/workbench'
], function(ko, WorkbenchViewmodel) {
    var IIIFViewerViewmodel = function(params) {
        var self = this;
        
        WorkbenchViewmodel.apply(this, [params]);
        
        this.showGallery = ko.observable(false);
        
        this.toggleGallery = function() {
            self.showGallery(!self.showGallery());
        };
    };
    ko.components.register('iiif-viewer', {
        viewModel: IIIFViewerViewmodel,
        template: {
            require: 'text!templates/views/components/iiif-viewer.htm'
        }
    });
    return IIIFViewerViewmodel;
});
