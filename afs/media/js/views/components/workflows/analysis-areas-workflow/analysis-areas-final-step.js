define([
    'knockout',
    'underscore',
    'uuid',
    'arches',
    'views/components/workflows/summary-step',
    'views/components/annotation-summary',
], function(ko, _, uuid, arches, SummaryStep) {

    function viewModel(params) {
        var self = this;

        params.form.resourceId = params.sampleObjectResourceId;

        this.regionInstances = params.regionsStepData.map(function(data){
            return {
                regionName: data.data["3e541cc6-859b-11ea-97eb-acde48001122"],
                regionResource: data.data["b240c366-8594-11ea-97eb-acde48001122"][0]["resourceId"],
            };
        });

        SummaryStep.apply(this, [params]);

        this.objectAnnotations = ko.observableArray();
        this.resourceData.subscribe(function(val){
            this.displayName = val['displayname'] || 'unnamed';
            this.reportVals = {
                parentObject: {'name': 'Object', 'value': this.getResourceValue(val.resource, ['part of', '@display_value'])},
                digitalReference: {'name': 'Image Service', 'value': this.getResourceValue(val.resource['Digital Reference'][0],['Digital Source','@display_value'])},
            };
            var annotationCollection = {};
            val.resource['Part Identifier Assignment'].forEach(function(annotation){
                var annotationName = self.getResourceValue(annotation,['Part Identifier Assignment_Physical Part of Object','@display_value']);
                var annotationLabel = self.getResourceValue(annotation,['Part Identifier Assignment_Label','@display_value']);
                var annotator = self.getResourceValue(annotation,['Part Identifier Assignment_Annotator','@display_value']);
                var annotationStr = self.getResourceValue(annotation,['Part Identifier Assignment_Polygon Identifier','@display_value']);
                var tileId = self.getResourceValue(annotation,['Part Identifier Assignment_Polygon Identifier','@tile_id']);
                if (annotationStr) {
                    var annotationJson = JSON.parse(annotationStr.replaceAll("'",'"'));
                    var canvas = annotationJson.features[0].properties.canvas;
                    annotationJson.features.forEach(function(feature){
                        feature.properties.tileId = tileId;
                    });
                    if (canvas in annotationCollection) {
                        annotationCollection[canvas].push({
                            tileId: tileId,
                            annotationName: annotationName,
                            annotationLabel: annotationLabel,
                            annotator: annotator,
                            annotationJson: annotationJson,
                        });
                    } else {
                        annotationCollection[canvas] = [{
                            tileId: tileId,
                            annotationName: annotationName,
                            annotationLabel: annotationLabel,
                            annotator: annotator,
                            annotationJson: annotationJson,
                        }];
                    }
                }
            });

            for (var canvas in annotationCollection) {
                var name;
                let annotationCombined;
                var info = [];
                annotationCollection[canvas].forEach(function(annotation){
                    name = annotation.annotationName;
                    if (annotationCombined) {
                        annotationCombined.features = annotationCombined.features.concat(annotation.annotationJson.features);
                    } else {
                        annotationCombined = annotation.annotationJson;
                    }
                    info.push({
                        tileId: annotation.tileId,
                        label: annotation.annotationLabel,
                        annotator: annotation.annotator,
                    });
                });

                var leafletConfig = self.prepareAnnotation(annotationCombined);
                self.objectAnnotations.push({
                    name: name,
                    info: info,
                    leafletConfig: leafletConfig,
                    featureCollection: annotationCombined,
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
