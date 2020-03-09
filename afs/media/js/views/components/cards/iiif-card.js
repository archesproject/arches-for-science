define([
    'knockout',
    'viewmodels/card-component',
    'views/components/iiif-annotation'
], function(ko, CardComponentViewModel, IIIFAnnotationViewmodel) {
    return ko.components.register('iiif-card', {
        viewModel: function(params) {
            var self = this;
            CardComponentViewModel.apply(this, [params]);
            
            if (self.form && self.tile) params.widgets = self.card.widgets().filter(function(widget) {
                var id = widget.node_id();
                var type = ko.unwrap(self.form.nodeLookup[id].datatype);
                return type === 'annotation';
            });
            
            IIIFAnnotationViewmodel.apply(this, [params]);
        },
        template: {
            require: 'text!templates/views/components/cards/iiif-card.htm'
        }
    });
});
