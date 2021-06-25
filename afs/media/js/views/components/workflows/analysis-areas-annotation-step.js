define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'views/components/iiif-annotation',
], function(_, $, arches, ko, koMapping, IIIFAnnotationViewmodel) {
    function viewModel(params) {
        // var self = this;


        _.extend(this, params)

        IIIFAnnotationViewmodel.apply(this, [params]);
        
        // console.log('load', self, params)

        
        this.initialize = function() {

        };

        this.initialize();
    }

    ko.components.register('analysis-areas-annotation-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/analysis-areas-annotation-step.htm' }
    });
    return viewModel;
});
