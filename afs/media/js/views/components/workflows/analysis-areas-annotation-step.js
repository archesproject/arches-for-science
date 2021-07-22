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

        this.savingTile = ko.observable();

        this.physicalThingPartIdentifierAssignmentCard = ko.observable();
        this.physicalThingPartIdentifierAssignmentTile = ko.observable();

        this.partIdentifierAssignmentLabelWidget = ko.observable();
        this.partIdentifierAssignmentPolygonIdentifierWidget = ko.observable();
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

        this.switchCanvas = function(canvasId){
            var canvas = self.canvases().find(c => c.images[0].resource.service['@id'] === canvasId);
            if (canvas) {
                self.canvasClick(canvas);              
            }
        };

        this.getAnnotationProperty = function(tile, property){
            return tile.data[self.annotationNodeId].features[0].properties[property];
        };

        this.highlightAnnotation = function(){
            if (self.map()) {
                self.map().eachLayer(function(layer){
                    if (layer.eachLayer) {
                        layer.eachLayer(function(features){
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

            if (previouslySelectedAnalysisAreaInstance) {
                /* resets any changes not explicity saved to the tile */ 
                previouslySelectedAnalysisAreaInstance.reset();
            }

            self.drawFeatures([]);

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
            params.form.lockExternalStep('image-step', true);
            var savePhysicalThingNameTile = function(physicalThingNameTile) {
                return new Promise(function(resolve, _reject) {
                    var partIdentifierAssignmentLabelNodeId = '3e541cc6-859b-11ea-97eb-acde48001122';
                    var selectedAnalysisAreaInstanceLabel = ko.unwrap(self.selectedAnalysisAreaInstance().data[partIdentifierAssignmentLabelNodeId]);
                    
                    var physicalThingNameContentNodeId = 'b9c1d8a6-b497-11e9-876b-a4d18cec433a'; // Name_content (xsd:string)
                    physicalThingNameTile.data[physicalThingNameContentNodeId] = 'autogen region foo ' + selectedAnalysisAreaInstanceLabel;
    
                    physicalThingNameTile.save().then(function(physicalThingNameData) {
                        resolve(physicalThingNameData);
                    });
                });
            };

            var savePhysicalThingPartOfTile = function(physicalThingPartOfTile) {
                var physicalThingPartOfNodeId = 'f8d5fe4c-b31d-11e9-9625-a4d18cec433a'; // part of (E22)

                return new Promise(function(resolve, _reject) {
                    physicalThingPartOfTile.data[physicalThingPartOfNodeId] = [{
                        "resourceId": self.physicalThingResourceId,
                        "ontologyProperty": "",
                        "inverseOntologyProperty": ""
                    }];

                    physicalThingPartOfTile.save().then(function(physicalThingPartOfData) {
                        resolve(physicalThingPartOfData);
                    });
                });
            };

            var updateSelectedAnalysisAreaInstance = function(physicalThingPartOfData) {
                return new Promise(function(resolve, _reject) {
                    /* assigns Physical Thing to be the Part Identifier on the parent selected Physical Thing  */ 
                    var physicalThingPartOfNodeId = 'f8d5fe4c-b31d-11e9-9625-a4d18cec433a'; // part of (E22)
                    var physicalThingPartOfResourceXResourceId = physicalThingPartOfData.data[physicalThingPartOfNodeId][0]['resourceXresourceId'];
                    
                    var selectedAnalysisAreaInstance = self.selectedAnalysisAreaInstance();
                    
                    var partIdentifierAssignmentPhysicalPartOfObjectNodeId = 'b240c366-8594-11ea-97eb-acde48001122';   
    
                    selectedAnalysisAreaInstance.data[partIdentifierAssignmentPhysicalPartOfObjectNodeId]([{
                        "resourceId": physicalThingPartOfData.resourceinstance_id,
                        "resourceXresourceId": physicalThingPartOfResourceXResourceId,
                        "ontologyProperty": "",
                        "inverseOntologyProperty": ""
                    }]);
    
                    selectedAnalysisAreaInstance.save().then(function(data) {
                        resolve(data);
                    });
                });
            };

            var updateAnnotations = function() {
                /* updates selected annotations */ 
                var physicalThingAnnotationNodeName = "Physical Thing - Part Identifier Assignment_Polygon Identifier";
                var physicalThingAnnotationNode = self.annotationNodes().find(function(annotationNode) {
                    return annotationNode.name === physicalThingAnnotationNodeName;
                });

                var physicalThingAnnotations = physicalThingAnnotationNode.annotations();

                self.drawFeatures().forEach(function(drawFeature) {
                    var annotationFeature = physicalThingAnnotations.find(function(annotation) {
                        return annotation.id === drawFeature;
                    });

                    drawFeature.properties.nodegroupId = self.tile.nodegroup_id;
                    drawFeature.properties.resourceId = self.tile.resourceinstance_id;
                    drawFeature.properties.tileId = self.tile.tileid;

                    if (!annotationFeature) {
                        physicalThingAnnotations.push(drawFeature);
                    }
                });

                physicalThingAnnotationNode.annotations(physicalThingAnnotations);
            };

            var getWorkingTile = function(card) {
                /* 
                    If an auto-generated resource has a tile with data, this will return it.
                    Otherwise it returns a new tile for the card.
                */ 

                var tile = null;
                
                /* Since this is an autogenerated resource, we can assume only one associated tile. */ 
                if (card.tiles() && card.tiles().length) {
                    tile = card.tiles()[0];
                }
                else {
                    tile = card.getNewTile();
                }

                return tile;
            };

            var getRegionPhysicalThingNameCard = function() {
                return new Promise(function(resolve, _reject) {
                    var physicalThingNameNodegroupId = 'b9c1ced7-b497-11e9-a4da-a4d18cec433a';  // Name (E33)
                    var partIdentifierAssignmentPhysicalPartOfObjectNodeId = 'b240c366-8594-11ea-97eb-acde48001122';       
                    var partIdentifierAssignmentPhysicalPartOfObjectData = ko.unwrap(self.tile.data[partIdentifierAssignmentPhysicalPartOfObjectNodeId]);
        
                    if (partIdentifierAssignmentPhysicalPartOfObjectData) { /* if editing Physical Thing */
                        var partIdentifierAssignmentPhysicalPartOfObjectResourceId = partIdentifierAssignmentPhysicalPartOfObjectData[0]['resourceId']();
        
                        self.fetchCardFromResourceId(partIdentifierAssignmentPhysicalPartOfObjectResourceId, physicalThingNameNodegroupId).then(function(physicalThingNameCard) {
                            resolve(physicalThingNameCard);
                        });
                    }
                    else {
                        var physicalThingGraphId = '9519cb4f-b25b-11e9-8c7b-a4d18cec433a';
        
                        self.fetchCardFromGraphId(physicalThingGraphId, physicalThingNameNodegroupId).then(function(physicalThingNameCard) { 
                            resolve(physicalThingNameCard);
                        });
                    }

                });
            };

            self.savingTile(true);
            getRegionPhysicalThingNameCard().then(function(regionPhysicalThingNameCard) {
                var regionPhysicalThingNameTile = getWorkingTile(regionPhysicalThingNameCard);

                savePhysicalThingNameTile(regionPhysicalThingNameTile).then(function(physicalThingNameData) {
                    var physicalThingPartOfNodeId = 'f8d5fe4c-b31d-11e9-9625-a4d18cec433a'; // part of (E22)
    
                    self.fetchCardFromResourceId(physicalThingNameData.resourceinstance_id, physicalThingPartOfNodeId).then(function(regionPhysicalThingPartOfCard) {
                        var regionPhysicalThingPartOfTile = getWorkingTile(regionPhysicalThingPartOfCard);

                        savePhysicalThingPartOfTile(regionPhysicalThingPartOfTile).then(function(regionPhysicalThingPartOfData) {
                            updateSelectedAnalysisAreaInstance(regionPhysicalThingPartOfData).then(function(_data) {
                                updateAnnotations();

                                // forces refresh
                                self.analysisAreaInstances(self.card.tiles());
                                self.selectAnalysisAreaInstance(self.selectedAnalysisAreaInstance());
                                self.savingTile(false);
                            });
                        });
                    });
                });
            });
        };

        this.loadNewAnalysisAreaTile = function() {
            var newTile = self.card.getNewTile(true);  /* true flag forces new tile generation */
            self.selectAnalysisAreaInstance(newTile);
        };

        this.saveWorkflowStep = function() {
            params.form.complete(false);
            params.form.saving(true);
            let mappedInstances = self.analysisAreaInstances().map((instance) => { return { "data": instance.data }});
            params.form.savedData(mappedInstances);
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

                            if (!self.selectedAnalysisAreaInstance() || self.selectedAnalysisAreaInstance().tileid !== analysisAreaInstance.tileid ) {
                                self.selectAnalysisAreaInstance(analysisAreaInstance);
                            }
                            else if (self.selectedAnalysisAreaInstance() && self.selectedAnalysisAreaInstance().tileid === analysisAreaInstance.tileid) {
                                // self.editFeature(ko.toJS(feature));
                                console.log(self, params)
                                console.log("dbl click")
                            }
                        },
                    })
                }
            }]);

            /* overwrites iiif-annotation method */ 
            self.updateTiles = function() {
                _.each(self.featureLookup, function(value) {
                    value.selectedTool(null);
                });

                var partIdentifierAssignmentPolygonIdentifierNodeId = "97c30c42-8594-11ea-97eb-acde48001122";  // Part Identifier Assignment_Polygon Identifier (E42)

                var tileFeatures = ko.toJS(self.tile.data[partIdentifierAssignmentPolygonIdentifierNodeId].features);

                if (tileFeatures) {
                    var featuresNotInTile = self.drawFeatures().filter(function(drawFeature) {
                        return !tileFeatures.find(function(tileFeature) {
                            return tileFeature.id === drawFeature.id;
                        });
                    });

                    self.tile.data[partIdentifierAssignmentPolygonIdentifierNodeId].features([...tileFeatures, ...featuresNotInTile]);
                }
                else {
                    self.widgets.forEach(function(widget) {
                        var id = ko.unwrap(widget.node_id);
                        var features = [];
                        self.drawFeatures().forEach(function(feature){
                            if (feature.properties.nodeId === id) {
                                features.push(feature);
                            }
                        });
                        if (ko.isObservable(self.tile.data[id])) {
                            self.tile.data[id]({
                                type: 'FeatureCollection',
                                features: features
                            });
                        } 
                        else {
                            self.tile.data[id].features(features);
                        }
                    });
                }
            };
        };

        this.fetchCardFromResourceId = function(resourceId, nodegroupId) {
            return new Promise(function(resolve, _reject) {
                self._fetchCard(resourceId, null, nodegroupId).then(function(data) {
                    resolve(data);
                });
            });
        };

        this.fetchCardFromGraphId = function(graphId, nodegroupId) {
            return new Promise(function(resolve, _reject) {
                self._fetchCard(null, graphId, nodegroupId).then(function(data) {
                    resolve(data);
                });
            });
        };

        this._fetchCard = function(resourceId, graphId, nodegroupId) {
            return new Promise(function(resolve, _reject) {
                $.getJSON( arches.urls.api_card + ( resourceId || graphId ) ).then(function(data) {
                    var cardData = data.cards.find(function(card) {
                        return card.nodegroup_id === nodegroupId;
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

                    resolve(new CardViewModel({
                        card: cardData,
                        graphModel: graphModel,
                        tile: null,
                        resourceId: ko.observable(ko.unwrap(resourceId)),
                        displayname: ko.observable(data.displayname),
                        handlers: handlers,
                        cards: data.cards,
                        tiles: data.tiles,
                        cardwidgets: data.cardwidgets,
                        userisreviewer: data.userisreviewer,
                    }));

                });
            });
        };

        ko.bindingHandlers.scrollTo = {
            update: function (element, valueAccessor) {
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
        template: { require: 'text!templates/views/components/workflows/analysis-areas-annotation-step.htm' }
    });
    return viewModel;
});