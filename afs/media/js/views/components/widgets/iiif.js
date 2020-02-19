define([
    'knockout',
    'viewmodels/widget'
], function(ko, WidgetViewModel) {
    return ko.components.register('iiif-widget', {
        viewModel: function(params) {
            WidgetViewModel.apply(this, [params]);
        },
        template: { require: 'text!templates/views/components/widgets/iiif.htm' }
    });
});
