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

        this.tileDirty = ko.observable();

        this.observationInstances = ko.observableArray();
        this.selectedObservationInstance = ko.observable();
        this.selectedObservationInstance.subscribe(function(foo) {
            console.log("fofffffff", foo)
            /* TODO: switchCanvas logic */ 
            // self.switchCanvas(self.getAnnotationProperty(foo, "canvas"));

            self.highlightAnnotation();
        })

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

        this.activeTab = ko.observable('dataset');
        this.hasLoaded = ko.observable(false);

        ko.bindingHandlers.scrollTo = {
            update: function (element, valueAccessor, allBindings) {
                var _value = valueAccessor();
                var _valueUnwrapped = ko.unwrap(_value);
                if (_valueUnwrapped) {
                    element.scrollIntoView();
                }
            }
        };

        /* inheritence chain conflicts with `loading`, so added functionality is behind `hasLoaded`  */ 
        this.hasLoaded.subscribe(function(loaded) {
            if (loaded) {
                var highlight = {
                    'fillColor': 'yellow',
                    'weight': 2,
                    'opacity': 1
                };
                
                /* param used by IIIFAnnotationViewmodel only */ 
                params.onEachFeature = function(feature, layer) {
                    layer.on({
                        click: function(e) {
                            // layer.setStyle(highlight)
                            self.selectedObservationInstance(self.getObservationTileFromFeatureId(feature.id));
                            console.log("CLICK", e, feature)
                        },
                    })
                };

                IIIFAnnotationViewmodel.apply(self, [params]);

                self.manifest("/manifest/38"); /* hardcoded until we can pass data between these two steps */ 
                self.getManifestData();

                self.annotationNodes.subscribe(function(annotationNodes) {
                    var physicalThingAnnotationNodeName = "Physical Thing - Part Identifier Assignment_Polygon Identifier";
                    var physicalThingAnnotationNode = annotationNodes.find(function(annotationNode) {
                        return annotationNode.name === physicalThingAnnotationNodeName;
                    });

                    physicalThingAnnotationNode.active(true); /* sets all Physical Thing geometries to visible */
 
                    console.log("ANNOTATION NODES", physicalThingAnnotationNode)
                });

                console.log("LOADED", self, params, self.annotationNodes(), self.map())
            }
        });

        this.initialize = function() {
            console.log("INIT", self, params)

            $.getJSON( arches.urls.api_card + self.physicalThingResourceId ).then(function(data) {
                self.barfoo(data);
            });
        };

        this.getObservationTileFromFeatureId = function(featureId) {
            var partIdentifierAssignmentPolygonIdentifierNodeId = "97c30c42-8594-11ea-97eb-acde48001122";  // Part Identifier Assignment_Polygon Identifier (E42)

            return self.observationInstances().find(function(observationInstance) {
                var observationInstanceFeatures = observationInstance.data[partIdentifierAssignmentPolygonIdentifierNodeId].features();

                return observationInstanceFeatures.find(function(observationInstanceFeature) {
                    return observationInstanceFeature.id() === featureId;
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
            return tile.data[self.annotationNodeId].features[0].properties[property]
        }

        this.highlightAnnotation = function(){
            if (self.map()) {
                self.map().eachLayer(function(layer){
                    if (layer.eachLayer) {
                        layer.eachLayer(function(features){
                            if (features.eachLayer) {
                                features.eachLayer(function(feature) {

                                    console.log("HMMM FEATURE", feature)
                                    var defaultColor = feature.feature.properties.color;
                                    
                                    if (!self.selectedObservationInstance() || self.selectedObservationInstance().tileid === feature.feature.properties.tileId) {
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

        this.saveObservationTile = function() {
            self.tile.save().then(function(data) {
                self.observationInstances(self.card.tiles())

                console.log('saved the tile', data)
            });
        };

        this.loadNewObservationTile = function() {
            var newTile = self.card.getNewTile(true);  /* true flag forces new tile generation */
                
            self.physicalThingPartIdentifierAssignmentTile(newTile);

            self.tile = newTile;
            params.tile = newTile;

            self.tile.reset();
        };

        this.saveTile = function() {
            console.log("SV", self, params)
            self.tile.save().then(function(data) {
                var tile = self.card.getNewTile(true);  /* true flag forces new tile generation */
                
                self.physicalThingPartIdentifierAssignmentTile(tile);

                self.tile = tile;
                params.tile = tile;

                console.log("DATA", data, tile)
            })
        };

        this.barfoo = function(data) {
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

            self.observationInstances(card.tiles())


            self.tile.dirty.subscribe(function(dirty) {
                self.tileDirty(dirty);
                // params.dirty(dirty)
                console.log('tile diry', dirty, self.tile, self.card.tiles())
            })
            
            self.hasLoaded(true)
            self.activeTab('dataset');

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
        };

        this.initialize();
    }

    ko.components.register('analysis-areas-annotation-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/analysis-areas-annotation-step.htm' }
    });
    return viewModel;
});
