define([
    'knockout',
    'viewmodels/card-component',
    'views/components/iiif-annotation'
], function(ko, CardComponentViewModel, IIIFAnnotationViewmodel) {
    return ko.components.register('iiif-card', {
        viewModel: function(params) {
            CardComponentViewModel.apply(this, [params]);
            IIIFAnnotationViewmodel.apply(this, [params]);
        },
        template: {
            require: 'text!templates/views/components/cards/iiif-card.htm'
        }
    });
});
