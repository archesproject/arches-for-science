define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'leaflet',
    'models/graph',
    'viewmodels/card',
    'views/components/iiif-annotation',
], function(_, $, arches, ko, koMapping, L, GraphModel, CardViewModel, IIIFAnnotationViewmodel) {
    function viewModel(params) {
        var self = this;
        _.extend(this, params);

        var objectStepData = params.form.externalStepData['objectstep']['data'];
        this.physicalThingResourceId = koMapping.toJS(objectStepData['sample-object-resource-instance'][0][1]);

        this.physicalThingPartIdentifierAssignmentCard = ko.observable();
        this.physicalThingPartIdentifierAssignmentTile = ko.observable();

        this.partIdentifierAssignmentLabelWidget = ko.observable();
        this.partIdentifierAssignmentPolygonIdentifierWidget = ko.observable();
        this.partIdentifierAssignmentPhysicalPartOfObjectWidget = ko.observable();
        this.partIdentifierAssignmentAnnotatorWidget = ko.observable();

        this.activeTab = ko.observable();
        this.hasExternalCardData = ko.observable(false);

        this.observationInstances = ko.observableArray();
        
        this.selectedObservationInstance = ko.observable();
        this.selectedObservationInstance.subscribe(function(selectedObservationInstance) {
            self.highlightAnnotation();

            if (selectedObservationInstance) {
                /* TODO: switchCanvas logic */ 
                
                self.tile = selectedObservationInstance;
                params.tile = selectedObservationInstance;
                self.physicalThingPartIdentifierAssignmentTile(selectedObservationInstance);
            }
        });

        this.tileDirty = ko.computed(function() {
            if (self.physicalThingPartIdentifierAssignmentTile()) {
                return self.physicalThingPartIdentifierAssignmentTile().dirty();
            }
        });

        this.selectedObservationInstanceFeatures = ko.computed(function() {
            var partIdentifierAssignmentPolygonIdentifierNodeId = "97c30c42-8594-11ea-97eb-acde48001122";  // Part Identifier Assignment_Polygon Identifier (E42)

            if (self.selectedObservationInstance()) {
                if (ko.unwrap(self.selectedObservationInstance().data[partIdentifierAssignmentPolygonIdentifierNodeId])) {
                    var partIdentifierAssignmentPolygonIdentifierData = ko.unwrap(self.selectedObservationInstance().data[partIdentifierAssignmentPolygonIdentifierNodeId]);
                    return ko.unwrap(partIdentifierAssignmentPolygonIdentifierData.features);
                }
            }
        });

        this.observationFilterTerm = ko.observable();
        this.filteredObservationInstances = ko.computed(function() {
            if (self.observationFilterTerm()) {
                return self.observationInstances().filter(function(observationInstance) {
                    var partIdentifierAssignmentLabelNodeId = '3e541cc6-859b-11ea-97eb-acde48001122';
                    return observationInstance.data[partIdentifierAssignmentLabelNodeId]().includes(self.observationFilterTerm());
                });
            }
            else {
                return self.observationInstances();
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

                self.manifest("/manifest/38"); /* hardcoded until we can pass data between these two steps */ 
                self.getManifestData();
            }
        });

        this.initialize = function() {
            $.getJSON( arches.urls.api_card + self.physicalThingResourceId ).then(function(data) {
                self.loadExternalCardData(data);
            });
        };

        this.getObservationTileFromFeatureId = function(featureId) {
            var partIdentifierAssignmentPolygonIdentifierNodeId = "97c30c42-8594-11ea-97eb-acde48001122";  // Part Identifier Assignment_Polygon Identifier (E42)

            return self.observationInstances().find(function(observationInstance) {
                var observationInstanceFeatures = observationInstance.data[partIdentifierAssignmentPolygonIdentifierNodeId].features();

                return observationInstanceFeatures.find(function(observationInstanceFeature) {
                    return ko.unwrap(observationInstanceFeature.id) === featureId;
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
                                    
                                    if (self.selectedObservationInstance() && self.selectedObservationInstance().tileid === feature.feature.properties.tileId) {
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

        this.selectObservationInstance = function(observationInstance) {
            var previouslySelectedObservationInstance = self.selectedObservationInstance();

            /* resets any changes not explicity saved to the tile */ 
            if (previouslySelectedObservationInstance) {
                previouslySelectedObservationInstance.reset();
            }

            self.selectedObservationInstance(observationInstance);
        };

        this.setPhysicalThingGeometriesToVisible = function(annotationNodes) {
            var physicalThingAnnotationNodeName = "Physical Thing - Part Identifier Assignment_Polygon Identifier";
            var physicalThingAnnotationNode = annotationNodes.find(function(annotationNode) {
                return annotationNode.name === physicalThingAnnotationNodeName;
            });
            physicalThingAnnotationNode.active(true); 
        };

        this.saveObservationTile = function() {
            self.tile.save().then(function(data) {
                self.observationInstances(self.card.tiles());
                self.selectObservationInstance(self.tile);
            });
        };

        this.loadNewObservationTile = function() {
            var newTile = self.card.getNewTile(true);  /* true flag forces new tile generation */
            self.selectObservationInstance(newTile);
        };

        // this.saveTile = function() {
        //     self.tile.save().then(function(data) {
        //         self.observationInstances(self.card.tiles())
        //     });
        // };

        this.loadExternalCardData = function(data) {
            var partIdentifierAssignmentNodeGroupId =  'fec59582-8593-11ea-97eb-acde48001122';  // Part Identifier Assignment (E13) 

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

            self.observationInstances(card.tiles());

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
                            var observationInstance = self.getObservationTileFromFeatureId(feature.id);

                            if (!self.selectedObservationInstance() || self.selectedObservationInstance().tileid !== observationInstance.tileid ) {
                                self.selectObservationInstance(observationInstance);
                            }
                            else if (self.selectedObservationInstance() && self.selectedObservationInstance().tileid === observationInstance.tileid) {
                                console.log("dbl click")
                            }
                        },
                    })
                }
            }]);
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
