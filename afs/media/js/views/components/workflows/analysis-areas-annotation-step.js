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
        _.extend(this, params)

        this.activeTab = ko.observable('dataset');

        this.hasLoaded = ko.observable(false);


        this.partIdentifierAssignmentLabelWidget = ko.observable();
        this.partIdentifierAssignmentPolygonIdentifierWidget = ko.observable();
        this.partIdentifierAssignmentPhysicalPartOfObjectWidget = ko.observable();
        this.partIdentifierAssignmentAnnotatorWidget = ko.observable();

        this.tileDirty = ko.observable();


        /* inheritence chain conflicts with `loading`, so added functionality is behind `hasLoaded`  */ 
        this.hasLoaded.subscribe(function(loaded) {
            if (loaded) {
                IIIFAnnotationViewmodel.apply(self, [params]);

                self.manifest("/manifest/38"); /* hardcoded until we can pass data between these two steps */ 
                self.getManifestData();
            }
        });

        var objectStepData = params.form.externalStepData['objectstep']['data'];
        this.physicalThingResourceId = koMapping.toJS(objectStepData['sample-object-resource-instance'][0][1]);


        this.physicalThingPartIdentifierAssignmentCard = ko.observable();
        this.physicalThingPartIdentifierAssignmentTile = ko.observable();
        
        this.initialize = function() {
            self.getPhysicalThingPartIdentifierAssignmentData();
        };

        this.saveObservationTile = function() {
            self.tile.save().then(function(data) {
                console.log('saved the tile', data)
            });
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

        this.getPhysicalThingPartIdentifierAssignmentData = function() {
            $.getJSON( arches.urls.api_card + self.physicalThingResourceId ).then(function(data) {
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


                self.tile.dirty.subscribe(function(dirty) {
                    self.tileDirty(dirty);
                    // params.dirty(dirty)
                    console.log('tile diry', dirty, self.tile)
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
                
                console.log("FDSSDIO", partIdentifierAssignmentPhysicalPartOfObjectWidget)
            });
        };

        this.initialize();
    }

    ko.components.register('analysis-areas-annotation-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/analysis-areas-annotation-step.htm' }
    });
    return viewModel;
});
