define(['utils/label-based-graph-utils'], function(labelBasedGraphUtils) {

    return {
        compressFeatures: async(resource, displayedManifestUrl) => {
            const annotationCollection = {};
            annotationCollection.parentDisplayName = resource.displayname;
            annotationCollection.parentResourceId = resource.resourceinstanceid;
            annotationCollection.canvases = {};

            const partIdentifierAssignmentNodes = Object.freeze({
                physicalPart: "b240c366-8594-11ea-97eb-acde48001122",
                label: "3e541cc6-859b-11ea-97eb-acde48001122",
                annotator: "a623eaf4-8599-11ea-97eb-acde48001122",
                polygonIdentifier: "97c30c42-8594-11ea-97eb-acde48001122",
            });

            resource.resource["Part Identifier Assignment"].forEach(function(annotation) {
                const annotationResourceId = labelBasedGraphUtils.getPropByNodeId(annotation,
                    partIdentifierAssignmentNodes.physicalPart,
                    "resourceId",
                );
                const annotationName = labelBasedGraphUtils.getPropByNodeId(annotation, 
                    partIdentifierAssignmentNodes.physicalPart,
                    "@display_value",
                );
                const annotationLabel = labelBasedGraphUtils.getPropByNodeId(annotation, 
                    partIdentifierAssignmentNodes.label,
                    "@display_value",
                );
                const annotator = labelBasedGraphUtils.getPropByNodeId(annotation, 
                    partIdentifierAssignmentNodes.annotator,
                    "@display_value",
                );
                const annotationStr = labelBasedGraphUtils.getPropByNodeId(annotation, 
                    partIdentifierAssignmentNodes.polygonIdentifier,
                    "@display_value",
                );
                const tileId = labelBasedGraphUtils.getPropByNodeId(annotation, 
                    partIdentifierAssignmentNodes.polygonIdentifier,
                    "@tile_id",
                );
                if (annotationStr) {
                    const annotationJson = JSON.parse(annotationStr.replaceAll("'", '"'));
                    if (annotationJson.features.length > 0) {
                        const currentManifestUrl = labelBasedGraphUtils.getPropByNodeId(
                            annotation, partIdentifierAssignmentNodes.polygonIdentifier, "geojson"
                            )["features"][0]["properties"]["manifest"];
                        if (!displayedManifestUrl || currentManifestUrl === displayedManifestUrl) {
                            const canvas = annotationJson.features[0].properties.canvas;

                            annotationJson.features.forEach(function(feature) {
                                feature.properties.tileId = tileId;
                            });

                            (annotationCollection.canvases[canvas] || (annotationCollection.canvases[canvas] = [])).push(
                                {
                                    resourceId: annotationResourceId,
                                    tileId: tileId,
                                    annotationName: annotationName,
                                    annotationLabel: annotationLabel,
                                    annotator: annotator,
                                    annotationJson: annotationJson,
                                    manifest: currentManifestUrl,
                                }
                            );
                        }
                    }
                }
            });
            for(const canvas in annotationCollection.canvases){
                let annotationCombined = {}; 
                annotationCollection.canvases[canvas].forEach((annotation) => {
                    if (annotationCombined?.features) {
                        annotationCombined.features = annotationCombined.features.concat(annotation.annotationJson.features);
                    } else {
                        annotationCombined = annotation.annotationJson;
                    }
                });
                (annotationCollection.annotations || (annotationCollection.annotations = [])).push({
                    featureCollection: annotationCombined,
                });
            }
            return { annotationCollection };
        },
    };
});
