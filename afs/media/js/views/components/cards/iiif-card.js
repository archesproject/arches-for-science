define([
    'knockout',
    'viewmodels/card-component',
    'views/components/iiif-annotation'
], function(ko, CardComponentViewModel, IIIFAnnotationViewmodel) {
    return ko.components.register('iiif-card', {
        viewModel: function(params) {
            var self = this;
            
            params.configKeys = ['defaultManifest'];
            
            CardComponentViewModel.apply(this, [params]);
            
            if (!params.manifest) params.manifest = this.defaultManifest();
            
            if (self.form && self.tile) params.widgets = self.card.widgets().filter(function(widget) {
                var id = widget.node_id();
                var type = ko.unwrap(self.form.nodeLookup[id].datatype);
                return type === 'annotation';
            });
            
            IIIFAnnotationViewmodel.apply(this, [params]);
            
            this.manifest.subscribe(function(manifest) {
                if (manifest !== self.defaultManifest())
                    self.defaultManifest(manifest);
            });
            
            this.defaultManifest.subscribe(function(manifest) {
                if (manifest !== self.manifest())
                    self.manifest(manifest);
            });
        },
        template: {
            require: 'text!templates/views/components/cards/iiif-card.htm'
        }
    });
});
