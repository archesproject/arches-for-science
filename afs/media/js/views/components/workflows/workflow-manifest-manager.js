define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'models/graph',
    'viewmodels/card',
    'viewmodels/provisional-tile',
    'views/components/plugins/manifest-manager',
], function(_, $, arches, ko, koMapping, GraphModel, CardViewModel, ProvisionalTileViewModel) {
    function viewModel(params) {
        var self = this;

        var digitalResourcesNameNodegroupId = 'd2fdae3d-ca7a-11e9-ad84-a4d18cec433a';
        var digitalResourceNameCard = params.form.topCards.find(function(topCard) {
            return topCard.nodegroupid === digitalResourcesNameNodegroupId;
        });
        this.digitalResourceNameTile = digitalResourceNameCard.getNewTile();

        
        var digitalResourcesStatementNodegroupId = 'da1fac57-ca7a-11e9-86a3-a4d18cec433a';
        var digitalResourceStatementCard = params.form.topCards.find(function(topCard) {
            return topCard.nodegroupid === digitalResourcesStatementNodegroupId;
        });
        this.digitalResourceStatementTile = digitalResourceStatementCard.getNewTile();

        var digitalResourcesNameContentNodeId = 'd2fdc2fa-ca7a-11e9-8ffb-a4d18cec433a';
        var digitalResourcesStatementContentNodeId = 'da1fbca1-ca7a-11e9-8256-a4d18cec433a';
        
        var objectStepData = params.form.externalStepData['objectstep']['data'];
        this.physicalThingData = koMapping.toJS(objectStepData['sample-object-resource-instance'][0][1][0]);

        this.isManifestManagerHidden = ko.observable(true);

        this.manifestData = ko.observable();
        this.manifestData.subscribe(function(manifestData) {
            console.log('manifestData', manifestData)
            params.dirty(true)
            self.digitalResourceNameTile.data[digitalResourcesNameContentNodeId](manifestData.label);
            self.digitalResourceStatementTile.data[digitalResourcesStatementContentNodeId](manifestData.description);
        });

        console.log("AAA", self)

        params.saveFunction(function() {
            self.digitalResourceNameTile.save().then(function(data) {
                console.log('digitalResourceNameData', data)

                self.digitalResourceStatementTile.resourceinstance_id = data.resourceinstance_id;

                self.digitalResourceStatementTile.save().then(function(data) {
                    console.log("digitalResourceStatementData", data, self.digitalResourceStatementTile, params)

                    console.log("b", self, this)


                    self.updatePhysicalThingWithDigitalResource(data).then(function(data) {
                        console.log("updatePhysicalThingData", data)
                    });
                });
            });
        });

        this.initialize = function() {
        };

        this.toggleManifestManagerHidden = function() {
            self.isManifestManagerHidden(!self.isManifestManagerHidden());
        };

        this.updatePhysicalThingWithDigitalResource = function(digitalResourceData) {
            console.log("in updatePhysicalTHingWIthDR", digitalResourceData, self, this)



            $.getJSON( arches.urls.api_card + self.physicalThingData.resourceId ).then(function(data) {
                var digitalReferenceCardData = data.cards.find(function(card) {
                    return card.nodegroup_id === '8a4ad932-8d59-11eb-a9c4-faffc265b501';
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

                // var provisionalTileViewModel = new ProvisionalTileViewModel({
                //     tile: null,
                //     reviewer: data.userisreviewer
                // });

                var digitalReferenceCard = new CardViewModel({
                    card: digitalReferenceCardData,
                    graphModel: graphModel,
                    tile: null,
                    resourceId: ko.observable(self.physicalThingData.resourceId),
                    displayname: data.displayname,
                    handlers: handlers,
                    cards: data.cards,
                    tiles: data.tiles,
                    provisionalTileViewModel: null,
                    cardwidgets: data.cardwidgets,
                    userisreviewer: data.userisreviewer,
                });

                var digitalReferenceTile = digitalReferenceCard.getNewTile();

                var digitalSourceNodeId = 'a298ee52-8d59-11eb-a9c4-faffc265b501'; // Digital Source (E73) (physical thing)
                digitalReferenceTile.data[digitalSourceNodeId] = [{
                    "resourceId": digitalResourceData.resourceinstance_id,
                    "ontologyProperty": "http://www.cidoc-crm.org/cidoc-crm/P67i_is_referred_to_by",
                    "inverseOntologyProperty": "http://www.cidoc-crm.org/cidoc-crm/P67_refers_to"
                }]
                
                var digitalReferenceTypeNodeId = 'f11e4d60-8d59-11eb-a9c4-faffc265b501'; // Digital Reference Type (E55) (physical thing)
                digitalReferenceTile.data[digitalReferenceTypeNodeId] = '1497d15a-1c3b-4ee9-a259-846bbab012ed' // Preferred Manifest concept


                console.log("digitalReferenceTile", digitalReferenceTile)

                digitalReferenceTile.save().then(function(tileData) {
                    console.log("dsds tiledata", tileData)

                //     var resourceInstanceIdFrom = self.physicalThingData.resourceId;
                //     var resourceInstanceIdTo = digitalResourceData.resourceinstance_id;
        
                //     var relationshipType = 'http://www.cidoc-crm.org/cidoc-crm/P67i_is_referred_to_by';
                //     var inverseRelationshipType = 'http://www.cidoc-crm.org/cidoc-crm/P67_refers_to';
        
                //     var nodeId = 'a298ee52-8d59-11eb-a9c4-faffc265b501'; // Digital Source (E73) (physical thing)
        
                //     $.ajax({
                //         url: arches.urls.api_related_resources,
                //         type: 'POST',
                //         data: {
                //             'resourceinstanceid_from': resourceInstanceIdFrom,
                //             'resourceinstanceid_to': resourceInstanceIdTo,
                //             'relationship_type': relationshipType,
                //             'inverse_relationship_type': inverseRelationshipType,
                //             'node_id': nodeId,
                //             'tile_id': tileData.tileid,
                //         }
                //     }).then(function(data) {
                //         console.log('in importn resp', data)
                //     })
                })

                




                // tile.save().then(function(tileData) {

                // });



                
                console.log('dsoi', data, foo, tile)
            });

            // return $.ajax({
            //     url: arches.urls.api_node_value,
            //     type: 'POST',
            //     data: {
            //         'resourceinstanceid': self.physicalThingData.resourceId,
            //         'nodeid': 'a298ee52-8d59-11eb-a9c4-faffc265b501', // Digital Source (E73) (physical thing)
            //         'data': digitalResourceData,
            //         'tileid': null,
            //     }
            // })
        };

        this.initialize();
    }

    ko.components.register('workflow-manifest-manager', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/workflow-manifest-manager.htm' }
    });
    return viewModel;
});
