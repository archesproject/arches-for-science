define([
    'knockout',
    'viewmodels/widget',
    'views/components/iiif-annotation'
], function(ko, WidgetViewModel, IIIFAnnotationViewmodel) {
    return ko.components.register('iiif-widget', {
        viewModel: function(params) {
            WidgetViewModel.apply(this, [params]);
            
            if (params.widget) params.widgets = [params.widget];
            
            IIIFAnnotationViewmodel.apply(this, [params]);
        },
        template: { require: 'text!templates/views/components/widgets/iiif.htm' }
    });
});
