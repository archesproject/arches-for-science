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

        /* inheritence chain conflicts with `loading`, so added functionality is behind `hasLoaded`  */ 
        this.hasLoaded.subscribe(function(loaded) {
            if (loaded) {
                IIIFAnnotationViewmodel.apply(self, [params]);

                self.manifest("/manifest/38"); /* hardcoded until we can pass data between these two steps */ 
                self.getManifestData();
            }
        });

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


        var objectStepData = params.form.externalStepData['objectstep']['data'];
        this.physicalThingResourceId = koMapping.toJS(objectStepData['sample-object-resource-instance'][0][1]);


        this.physicalThingPartIdentifierAssignmentCard = ko.observable();
        this.physicalThingPartIdentifierAssignmentTile = ko.observable();
        
        this.initialize = function() {
            self.getPhysicalThingPartIdentifierAssignmentData()
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
                    params.dirty(dirty)
                    console.log('tile diry', dirty, self.tile)
                })

                
                
                
                self.hasLoaded(true)
                self.activeTab('dataset');
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
