define([
    'knockout',
    'viewmodels/card-component',
], function(ko, CardComponentViewModel) {
    return ko.components.register('iiif-card', {
        viewModel: function(params) {
            CardComponentViewModel.apply(this, [params]);
        },
        template: {
            require: 'text!templates/views/components/card_components/iiif-card.htm'
        }
    });
});
