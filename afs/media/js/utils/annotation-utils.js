define(['utils/label-based-graph-utils'], function(labelBasedGraphUtils) {

    return {
        compressFeatures: async(resource, displayedManifestUrl) => {
            const annotationCollection = {};
            annotationCollection.parentDisplayName = resource.displayname;
            annotationCollection.parentResourceId = resource.resourceinstanceid;
            annotationCollection.canvases = {};
            
            resource.resource["Part Identifier Assignment"].forEach(function(annotation) {
                const annotationResourceId = labelBasedGraphUtils.getNodeValue(annotation,
                    "Part Identifier Assignment_Physical Part of Object",
                    "resourceId",
                );
                const annotationName = labelBasedGraphUtils.getNodeValue(annotation, 
                    "Part Identifier Assignment_Physical Part of Object",
                    "@display_value",
                );
                const annotationLabel = labelBasedGraphUtils.getNodeValue(annotation, 
                    "Part Identifier Assignment_Label",
                    "@display_value",
                );
                const annotator = labelBasedGraphUtils.getNodeValue(annotation, 
                    "Part Identifier Assignment_Annotator",
                    "@display_value",
                );
                const annotationStr = labelBasedGraphUtils.getNodeValue(annotation, 
                    "Part Identifier Assignment_Polygon Identifier",
                    "@display_value",
                );
                const tileId = labelBasedGraphUtils.getNodeValue(annotation, 
                    "Part Identifier Assignment_Polygon Identifier",
                    "@tile_id",
                );
                if (annotationStr) {
                    const annotationJson = JSON.parse(annotationStr.replaceAll("'", '"'));
                    if (annotationJson.features.length > 0) {
                        const currentManifestUrl =
              annotation["Part Identifier Assignment_Polygon Identifier"][
                  "geojson"
              ]["features"][0]["properties"]["manifest"];
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
                                }
                            );
                        }
                    }
                }
            });
            let annotationCombined = {}; 
            for(const canvas in annotationCollection.canvases){
                annotationCollection.canvases[canvas].forEach((annotation) => {
                    if (annotationCombined?.features) {
                        annotationCombined.features = annotationCombined.features.concat(annotation.annotationJson.features);
                    } else {
                        annotationCombined = annotation.annotationJson;
                    }
                });
            }
            return { annotationCollection, annotationCombined };
        },
    };
});
