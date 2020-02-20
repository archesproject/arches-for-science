define([
    'views/components/iiif-viewer'
], function(IIIFViewerViewmodel) {
    var viewModel = function(params) {
        this.widgets = params.widgets || [];
        IIIFViewerViewmodel.apply(this, [params]);
    };
    return viewModel;
});
