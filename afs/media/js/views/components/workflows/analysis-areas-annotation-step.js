define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'models/graph',
    'viewmodels/card',
    'views/components/iiif-annotation',
], function(_, $, arches, ko, koMapping, GraphModel, CardViewModel, IIIFAnnotationViewmodel) {
    function viewModel(params) {
        var self = this;
        _.extend(this, params);

        var objectStepData = params.form.externalStepData['objectstep']['data'];
        this.physicalThingResourceId = koMapping.toJS(objectStepData['sample-object-resource-instance'][0][1]);

        var digitalResourceServiceIdentifierContentNodeId = '56f8e9bd-ca7c-11e9-b578-a4d18cec433a';
        var imageStepData = params.form.externalStepData['imagestep']['data']['image-service-instance'][0];
        this.manifestUrl = ko.observable(imageStepData.data[digitalResourceServiceIdentifierContentNodeId]);

        this.physicalThingPartIdentifierAssignmentCard = ko.observable();
        this.physicalThingPartIdentifierAssignmentTile = ko.observable();

        this.partIdentifierAssignmentLabelWidget = ko.observable();
        this.partIdentifierAssignmentPolygonIdentifierWidget = ko.observable();
        this.partIdentifierAssignmentPhysicalPartOfObjectWidget = ko.observable();
        this.partIdentifierAssignmentAnnotatorWidget = ko.observable();

        this.activeTab = ko.observable();
        this.hasExternalCardData = ko.observable(false);

        this.analysisAreaInstances = ko.observableArray();

        this.selectedAnalysisAreaInstance = ko.observable();
        this.selectedAnalysisAreaInstance.subscribe(function(selectedAnalysisAreaInstance) {
            self.highlightAnnotation();

            if (selectedAnalysisAreaInstance) {
                /* TODO: switchCanvas logic */

                self.tile = selectedAnalysisAreaInstance;
                params.tile = selectedAnalysisAreaInstance;
                self.physicalThingPartIdentifierAssignmentTile(selectedAnalysisAreaInstance);
            }
        });

        this.tileDirty = ko.computed(function() {
            if (self.physicalThingPartIdentifierAssignmentTile()) {
                return self.physicalThingPartIdentifierAssignmentTile().dirty();
            }
        });

        this.selectedAnalysisAreaInstanceFeatures = ko.computed(function() {
            var partIdentifierAssignmentPolygonIdentifierNodeId = "97c30c42-8594-11ea-97eb-acde48001122";  // Part Identifier Assignment_Polygon Identifier (E42)

            if (self.selectedAnalysisAreaInstance()) {
                if (ko.unwrap(self.selectedAnalysisAreaInstance().data[partIdentifierAssignmentPolygonIdentifierNodeId])) {
                    var partIdentifierAssignmentPolygonIdentifierData = ko.unwrap(self.selectedAnalysisAreaInstance().data[partIdentifierAssignmentPolygonIdentifierNodeId]);
                    return ko.unwrap(partIdentifierAssignmentPolygonIdentifierData.features);
                }
            }
        });

        this.analysisAreaFilterTerm = ko.observable();
        this.filteredAnalysisAreaInstances = ko.computed(function() {
            if (self.analysisAreaFilterTerm()) {
                return self.analysisAreaInstances().filter(function(analysisAreaInstance) {
                    var partIdentifierAssignmentLabelNodeId = '3e541cc6-859b-11ea-97eb-acde48001122';
                    return analysisAreaInstance.data[partIdentifierAssignmentLabelNodeId]().includes(self.analysisAreaFilterTerm());
                });
            }
            else {
                return self.analysisAreaInstances();
            }
        });

        this.hasExternalCardData.subscribe(function(hasExternalCardData) {
            if (hasExternalCardData) {
                self.handleExternalCardData();

                /* sets all Physical Thing geometries to visible */
                var physicalThingGeometriestAnnotationSubscription = self.annotationNodes.subscribe(function(annotationNodes) {
                    self.setPhysicalThingGeometriesToVisible(annotationNodes);
                    physicalThingGeometriestAnnotationSubscription.dispose(); /* self-disposing subscription only runs once */
                });

                self.activeTab('dataset');

                self.manifest(self.manifestUrl());
                self.getManifestData();
            }
        });

        this.initialize = function() {
            params.form.save = self.saveWorkflowStep;
            $.getJSON(arches.urls.api_card + self.physicalThingResourceId).then(function(data) {
                self.loadExternalCardData(data);
            });
        };

        this.getAnalysisAreaTileFromFeatureId = function(featureId) {
            var partIdentifierAssignmentPolygonIdentifierNodeId = "97c30c42-8594-11ea-97eb-acde48001122";  // Part Identifier Assignment_Polygon Identifier (E42)

            return self.analysisAreaInstances().find(function(analysisAreaInstance) {
                var analysisAreaInstanceFeatures = analysisAreaInstance.data[partIdentifierAssignmentPolygonIdentifierNodeId].features();

                return analysisAreaInstanceFeatures.find(function(analysisAreaInstanceFeature) {
                    return ko.unwrap(analysisAreaInstanceFeature.id) === featureId;
                });
            });
        };

        this.switchCanvas = function(canvasId) {
            var canvas = self.canvases().find(c => c.images[0].resource.service['@id'] === canvasId);
            if (canvas) {
                self.canvasClick(canvas);
            }
        };

        this.getAnnotationProperty = function(tile, property) {
            return tile.data[self.annotationNodeId].features[0].properties[property];
        };

        this.highlightAnnotation = function() {
            if (self.map()) {
                self.map().eachLayer(function(layer) {
                    if (layer.eachLayer) {
                        layer.eachLayer(function(features) {
                            if (features.eachLayer) {
                                features.eachLayer(function(feature) {
                                    var defaultColor = feature.feature.properties.color;

                                    if (self.selectedAnalysisAreaInstance() && self.selectedAnalysisAreaInstance().tileid === feature.feature.properties.tileId) {
                                        feature.setStyle({color: '#BCFE2B', fillColor: '#BCFE2B'});
                                    } else {
                                        feature.setStyle({color: defaultColor, fillColor: defaultColor});
                                    }
                                });
                            }
                        });
                    }
                })
            }
        };

        this.selectAnalysisAreaInstance = function(analysisAreaInstance) {
            var previouslySelectedAnalysisAreaInstance = self.selectedAnalysisAreaInstance();

            /* resets any changes not explicity saved to the tile */
            if (previouslySelectedAnalysisAreaInstance) {
                previouslySelectedAnalysisAreaInstance.reset();
            }

            self.selectedAnalysisAreaInstance(analysisAreaInstance);
        };

        this.setPhysicalThingGeometriesToVisible = function(annotationNodes) {
            var physicalThingAnnotationNodeName = "Physical Thing - Part Identifier Assignment_Polygon Identifier";
            var physicalThingAnnotationNode = annotationNodes.find(function(annotationNode) {
                return annotationNode.name === physicalThingAnnotationNodeName;
            });
            physicalThingAnnotationNode.active(true);
        };

        this.saveAnalysisAreaTile = function() {
            self.tile.save().then((data) => {
                params.dirty(true);
                self.analysisAreaInstances(self.card.tiles());
                self.selectAnalysisAreaInstance(self.tile);
            });
        };

        this.loadNewAnalysisAreaTile = function() {
            var newTile = self.card.getNewTile(true);  /* true flag forces new tile generation */
            self.selectAnalysisAreaInstance(newTile);
        };

        this.saveWorkflowStep = function() {
            params.form.complete(false);
            params.form.saving(true);
            self.analysisAreaInstances().forEach(
                instance => params.form.savedData.push({"data": instance.data})
            );
            params.form.complete(true);
            params.form.saving(false);
        };

        this.loadExternalCardData = function(data) {
            var partIdentifierAssignmentNodeGroupId = 'fec59582-8593-11ea-97eb-acde48001122';  // Part Identifier Assignment (E13) 

            var partIdentifierAssignmentCardData = data.cards.find(function(card) {
                return card.nodegroup_id === partIdentifierAssignmentNodeGroupId;
            });

            var handlers = {
                'after-update': [],
                'tile-reset': []
            };

            var graphModel = new GraphModel({
                data: {
                    nodes: data.nodes,
                    nodegroups: data.nodegroups,
                    edges: []
                },
                datatypes: data.datatypes
            });

            var partIdentifierAssignmentCard = new CardViewModel({
                card: partIdentifierAssignmentCardData,
                graphModel: graphModel,
                tile: null,
                resourceId: ko.observable(self.physicalThingResourceId),
                displayname: ko.observable(data.displayname),
                handlers: handlers,
                cards: data.cards,
                tiles: data.tiles,
                cardwidgets: data.cardwidgets,
                userisreviewer: data.userisreviewer,
            });

            var card = partIdentifierAssignmentCard;
            var tile = partIdentifierAssignmentCard.getNewTile();

            self.card = card;
            self.tile = tile;

            params.card = self.card;
            params.tile = self.tile;

            var partIdentifierAssignmentPolygonIdentifierNodeId = "97c30c42-8594-11ea-97eb-acde48001122";  // Part Identifier Assignment_Polygon Identifier (E42)
            params.widgets = self.card.widgets().filter(function(widget) {
                return widget.node_id() === partIdentifierAssignmentPolygonIdentifierNodeId;
            });

            self.physicalThingPartIdentifierAssignmentCard(card);
            self.physicalThingPartIdentifierAssignmentTile(tile);

            self.analysisAreaInstances(card.tiles());

            /* 
                subscription to features lives here because we _only_ want it to run once, on blank starting tile, when a user places a feature on the map
            */
            var tileFeatureGeometrySubscription = tile.data[partIdentifierAssignmentPolygonIdentifierNodeId].subscribe(function(data) {
                if (data) {
                    self.selectAnalysisAreaInstance(tile);
                    tileFeatureGeometrySubscription.dispose();
                }
            });

            self.hasExternalCardData(true);
        };

        this.handleExternalCardData = function() {
            var partIdentifierAssignmentLabelNodeId = '3e541cc6-859b-11ea-97eb-acde48001122';
            self.partIdentifierAssignmentLabelWidget(self.card.widgets().find(function(widget) {
                return ko.unwrap(widget.node_id) === partIdentifierAssignmentLabelNodeId;
            }));

            var partIdentifierAssignmentPolygonIdentifierNodeId = '97c30c42-8594-11ea-97eb-acde48001122';
            self.partIdentifierAssignmentPolygonIdentifierWidget(self.card.widgets().find(function(widget) {
                return ko.unwrap(widget.node_id) === partIdentifierAssignmentPolygonIdentifierNodeId;
            }));

            var partIdentifierAssignmentPhysicalPartOfObjectNodeId = 'b240c366-8594-11ea-97eb-acde48001122';
            self.partIdentifierAssignmentPhysicalPartOfObjectWidget(self.card.widgets().find(function(widget) {
                return ko.unwrap(widget.node_id) === partIdentifierAssignmentPhysicalPartOfObjectNodeId;
            }));

            var partIdentifierAssignmentAnnotatorNodeId = 'a623eaf4-8599-11ea-97eb-acde48001122';
            self.partIdentifierAssignmentAnnotatorWidget(self.card.widgets().find(function(widget) {
                return ko.unwrap(widget.node_id) === partIdentifierAssignmentAnnotatorNodeId;
            }));

            IIIFAnnotationViewmodel.apply(self, [{
                ...params,
                onEachFeature: function(feature, layer) {
                    layer.on({
                        click: function() {
                            var analysisAreaInstance = self.getAnalysisAreaTileFromFeatureId(feature.id);

                            if (!self.selectedAnalysisAreaInstance() || self.selectedAnalysisAreaInstance().tileid !== analysisAreaInstance.tileid) {
                                self.selectAnalysisAreaInstance(analysisAreaInstance);
                            }
                            else if (self.selectedAnalysisAreaInstance() && self.selectedAnalysisAreaInstance().tileid === analysisAreaInstance.tileid) {
                                console.log("dbl click")
                            }
                        },
                    })
                }
            }]);
        };

        ko.bindingHandlers.scrollTo = {
            update: function(element, valueAccessor) {
                var _value = valueAccessor();
                var _valueUnwrapped = ko.unwrap(_value);
                if (_valueUnwrapped) {
                    element.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
                }
            }
        };

        this.initialize();
    }

    ko.components.register('analysis-areas-annotation-step', {
        viewModel: viewModel,
        template: {require: 'text!templates/views/components/workflows/analysis-areas-annotation-step.htm'}
    });
    return viewModel;
});
