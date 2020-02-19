define([
    'knockout',
    'viewmodels/card-component',
    'views/components/iiif-viewer'
], function(ko, CardComponentViewModel, IIIFViewerViewmodel) {
    return ko.components.register('iiif-card', {
        viewModel: function(params) {
            CardComponentViewModel.apply(this, [params]);
            IIIFViewerViewmodel.apply(this, [params]);
        },
        template: {
            require: 'text!templates/views/components/cards/iiif-card.htm'
        }
    });
});
