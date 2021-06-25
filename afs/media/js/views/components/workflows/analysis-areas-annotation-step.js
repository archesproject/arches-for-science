define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'views/components/iiif-annotation',
], function(_, $, arches, ko, koMapping, IIIFAnnotationViewmodel) {
    function viewModel(params) {
        var self = this;
        _.extend(this, params)

        var partIdentifierAssignmentNodeId =  'fec59582-8593-11ea-97eb-acde48001122';  // Part Identifier Assignment (E13) 

        var partIdentifierAssignmentCard = this.form.topCards.find(function(card) {
            return card.nodegroupid === partIdentifierAssignmentNodeId;
        });

        this.card = partIdentifierAssignmentCard;
        
        
        IIIFAnnotationViewmodel.apply(this, [params]);
        
        this.showStylingTools(true);
        console.log('load', self, params)

        
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
