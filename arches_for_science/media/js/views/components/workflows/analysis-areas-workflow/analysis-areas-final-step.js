define([
    'knockout',
    'underscore',
    'uuid',
    'arches',
    'views/components/workflows/summary-step',
    'templates/views/components/workflows/analysis-areas-workflow/analysis-areas-final-step.htm',
    'utils/label-based-graph-utils',
    'views/components/annotation-summary',
], function(ko, _, uuid, arches, SummaryStep, analysisAreasFinalStepTemplate, labelBasedGraphUtils) {

    function viewModel(params) {
        var self = this;

        params.form.resourceId(params.sampleObjectResourceId);
        const digitalResourceServiceIdentifierContentNodeId = '56f8e9bd-ca7c-11e9-b578-a4d18cec433a';
        const manifestUrl = params.imageStepData[digitalResourceServiceIdentifierContentNodeId][arches.activeLanguage]['value'];
        const digitalReferenceResourceId = params.digitalReferenceResourceId;

        this.regionInstances = params.regionsStepData?.data.map(function(data){
            return {
                regionName: data.data["3e541cc6-859b-11ea-97eb-acde48001122"],
                regionResource: data.data["b240c366-8594-11ea-97eb-acde48001122"][0]["resourceId"],
            };
        });
        const currentAnalysisAreas = params.regionsStepData?.currentAnalysisAreas;

        SummaryStep.apply(this, [params]);

        this.objectAnnotations = ko.observableArray();
        this.resourceData.subscribe(function(val){
            this.displayName = val['displayname'] || 'unnamed';
            const digitalReference = val.resource['Digital Reference'].find(function(val){
                return val['Digital Source']['resourceId'] === digitalReferenceResourceId;
            });
            this.reportVals = {
                projectName: {'name': arches.translations.project, 'value': params.relatedProjectData.projectName, 'resourceid': params.relatedProjectData.project},
                parentObject: {'name': arches.translations.object, 'value': this.getResourceValue(val.resource, ['part of', '@display_value'])},
                digitalReference: {'name': arches.translations.imageService, 'value': digitalReference['Digital Source']["@display_value"]},
            };
            var annotationCollection = {};
            self.regionResourceIds = self.regionInstances?.map(x => x.regionResource);
            val.resource['Part Identifier Assignment'].forEach(function(annotation){
                const annotationResourceId = self.getResourceValue(annotation,['Part Identifier Assignment_Physical Part of Object','resourceId']);
                const annotationName = self.getResourceValue(annotation,['Part Identifier Assignment_Physical Part of Object','@display_value']);
                const annotationLabel = self.getResourceValue(annotation,['Part Identifier Assignment_Label','@display_value']);
                const annotator = self.getResourceValue(annotation,['Part Identifier Assignment_Annotator','@display_value']);
                const annotationStr = self.getResourceValue(annotation,['Part Identifier Assignment_Polygon Identifier','@display_value']);
                const tileId = self.getResourceValue(annotation,['Part Identifier Assignment_Polygon Identifier','@tile_id']);
                if (annotationStr) {
                    const annotationJson = JSON.parse(annotationStr.replaceAll("'",'"'));
                    if (annotationJson.features.length > 0){
                        const currentManifestUrl = annotation['Part Identifier Assignment_Polygon Identifier']['geojson']['features'][0]['properties']['manifest'];
                        if (currentManifestUrl === manifestUrl){
                            const canvas = annotationJson.features[0].properties.canvas;
                            annotationJson.features.forEach(function(feature){
                                feature.properties.tileId = tileId;
                            });
                            if (canvas in annotationCollection) {
                                annotationCollection[canvas].push({
                                    resourceId: annotationResourceId,
                                    tileId: tileId,
                                    annotationName: annotationName,
                                    annotationLabel: annotationLabel,
                                    annotator: annotator,
                                    annotationJson: annotationJson,
                                });
                            } else {
                                annotationCollection[canvas] = [{
                                    resourceId: annotationResourceId,
                                    tileId: tileId,
                                    annotationName: annotationName,
                                    annotationLabel: annotationLabel,
                                    annotator: annotator,
                                    annotationJson: annotationJson,
                                }];
                            }    
                        }
                    }    
                }
            });

            for (const canvas in annotationCollection) {
                let name;
                let annotationCombined;
                let info = [];
                annotationCollection[canvas].forEach(function(annotation){
                    name = annotation.annotationName;
                    if (annotationCombined) {
                        annotationCombined.features = annotationCombined.features.concat(annotation.annotationJson.features);
                    } else {
                        annotationCombined = annotation.annotationJson;
                    }
                    if (currentAnalysisAreas?.includes(annotation.tileId)) {
                        info.push({
                            tileId: annotation.tileId,
                            name: annotation.annotationName,
                            annotator: annotation.annotator,
                        });
                    } else {
                        // TODO: fetch in parallel
                        fetch(self.urls.api_resources(annotation.resourceId) + '?format=json&compact=false&v=beta')
                        .then(response => response.json())
                        .then(data => {
                            annotation.annotationJson.features.map(feature => {
                                feature.properties.color = '#999999';
                                feature.properties.fillColor = '#999999';
                                feature.properties.tileId = annotation.tileId;
                                feature.properties.name = annotation.annotationName;
                                feature.properties.active = false;
                                feature.properties.classificationConceptId = data.resource.type.concept_details[0].concept_id;
                                feature.properties.parentPhysicalThingName = labelBasedGraphUtils.getPropByNodeId(
                                    data.resource, 'f8d5fe4c-b31d-11e9-9625-a4d18cec433a', '@display_value'
                                );
                            });
                        });
                    }
                });

                const leafletConfig = self.prepareAnnotation(annotationCombined);
                if (info.length > 0) {
                    self.objectAnnotations.push({
                        name: name,
                        info: info,
                        leafletConfig: leafletConfig,
                        featureCollection: annotationCombined,
                    });
                }
            }
            this.loading(false);
        }, this);
    }

    ko.components.register('analysis-areas-final-step', {
        viewModel: viewModel,
        template: analysisAreasFinalStepTemplate
    });
    return viewModel;
});
