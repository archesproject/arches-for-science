define([
    'knockout',
    'underscore',
    'uuid',
    'arches',
    'views/components/workflows/summary-step',
], function(ko, _, uuid, arches, SummaryStep) {

    function viewModel(params) {
        var self = this;
        SummaryStep.apply(this, [params]);

        this.objectAnnotations = ko.observableArray();
        this.resourceData.subscribe(function(val){
            this.displayName = val['displayname'] || 'unnamed';
            this.reportVals = {
                parentObject: {'name': 'Object', 'value': this.getResourceValue(val.resource, ['part of', '@value'])},
                digitalReference: {'name': 'Image Service', 'value': this.getResourceValue(val.resource['Digital Reference'][0],['Digital Source','@value'])},
            };

            var annotationCollection = {};
            val.resource['Part Identifier Assignment'].forEach(function(annotation){
                var currentAnnotationNames = [];
                var annotationName = self.getResourceValue(annotation,['Part Identifier Assignment_Physical Part of Object','@value']);
                //if (annotationName in currentAnnotationNames) {
                    var annotationLabel = self.getResourceValue(annotation,['Part Identifier Assignment_Label','@value']);
                    var annotator = self.getResourceValue(annotation,['Part Identifier Assignment_Annotator','@value']);
                    var annotationStr = self.getResourceValue(annotation,['Part Identifier Assignment_Polygon Identifier','@value']);
                    if (annotationStr) {
                        var annotationJson = JSON.parse(annotationStr.replaceAll("'",'"'));
                        var canvas = annotationJson.features[0].properties.canvas;
                        if (canvas in annotationCollection) {
                            annotationCollection[canvas].push({
                                annotationName: annotationName,
                                annotationLabel: annotationLabel,
                                annotator: annotator,
                                annotationJson: annotationJson,
                            })
                        } else {
                            annotationCollection[canvas] = [{
                                annotationName: annotationName,
                                annotationLabel: annotationLabel,
                                annotator: annotator,
                                annotationJson: annotationJson,
                            }]
                        }
                    }
                //}
            });

            for (canvas in annotationCollection) {
                var info = [];
                let annotationCombined;
                annotationCollection[canvas].forEach(function(annotation){
                    if (annotationCombined) {
                        annotationCombined.features.push(annotation.annotationJson.features);
                    } else {
                        annotationCombined = annotation.annotationJson;
                    }                    
                    info.push({
                        name: annotation.annotationName,
                        label: annotation.annotationLabel,
                        annotator: annotation.annotator,
                    })
                })

                var leafletConfig = self.prepareAnnotation(annotationCombined);
                self.objectAnnotations.push({
                    info: info,
                    leafletConfig: leafletConfig,
                });
            }
            this.loading(false);
        }, this);
    }

    ko.components.register('analysis-areas-final-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/analysis-areas-workflow/analysis-areas-final-step.htm' }
    });
    return viewModel;
});
