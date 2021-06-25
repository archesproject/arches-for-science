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
        this.tile = this.card.getNewTile();
        params.widgets = this.card.widgets();        
        
        IIIFAnnotationViewmodel.apply(this, [params]);
        
        this.manifest("/manifest/38"); /* hardcoded until we can pass data between these two steps */ 

        console.log('load', self, params)

        
        this.initialize = function() {
            self.getManifestData();
        };

        this.initialize();
    }

    ko.components.register('analysis-areas-annotation-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/analysis-areas-annotation-step.htm' }
    });
    return viewModel;
});
