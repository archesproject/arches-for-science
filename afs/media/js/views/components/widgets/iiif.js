define([
    'knockout',
    'viewmodels/widget',
    'views/components/iiif-viewer'
], function(ko, WidgetViewModel, IIIFViewerViewmodel) {
    return ko.components.register('iiif-widget', {
        viewModel: function(params) {
            WidgetViewModel.apply(this, [params]);
            
            if (params.widget) params.widgets = [params.widget];
            
            IIIFViewerViewmodel.apply(this, [params]);
        },
        template: { require: 'text!templates/views/components/widgets/iiif.htm' }
    });
});
