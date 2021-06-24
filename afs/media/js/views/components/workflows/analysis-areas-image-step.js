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

        this.isManifestManagerHidden = ko.observable(true);

        this.selectedPhysicalThingImageService = ko.observable();
        this.selectedPhysicalThingImageService.subscribe(function(bar) {
            params.dirty(true)
            console.log(bar)
        });

        var objectStepData = params.form.externalStepData['objectstep']['data'];
        this.physicalThingResourceId = koMapping.toJS(objectStepData['sample-object-resource-instance'][0][1]);

        this.physicalThingDigitalReferenceCard = ko.observable();
        this.physicalThingDigitalReferenceCard.subscribe(function(card) {
            self.getPhysicalThingRelatedDigitalReferenceData(card);
        });
        this.physicalThingDigitalReferenceTile = ko.observable();
        this.physicalThingDigitalReferencePreferredManifestResourceData = ko.observableArray();


        var digitalResourceNameNodegroupId = 'd2fdae3d-ca7a-11e9-ad84-a4d18cec433a';
        var digitalResourceNameCard = params.form.topCards.find(function(topCard) {
            return topCard.nodegroupid === digitalResourceNameNodegroupId;
        });
        this.digitalResourceNameTile = digitalResourceNameCard.getNewTile();

        
        var digitalResourceStatementNodegroupId = 'da1fac57-ca7a-11e9-86a3-a4d18cec433a';
        var digitalResourceStatementCard = params.form.topCards.find(function(topCard) {
            return topCard.nodegroupid === digitalResourceStatementNodegroupId;
        });
        this.digitalResourceStatementTile = digitalResourceStatementCard.getNewTile();
        
        
        var digitalResourceServiceNodegroupId = '29c8c76e-ca7c-11e9-9e11-a4d18cec433a';
        var digitalResourceServiceCard = params.form.topCards.find(function(topCard) {
            return topCard.nodegroupid === digitalResourceServiceNodegroupId;
        });
        this.digitalResourceServiceTile = digitalResourceServiceCard.getNewTile();


        var digitalResourceServiceIdentifierNodegroupId = '56f8e26e-ca7c-11e9-9aa3-a4d18cec433a';
        var digitalResourceServiceIdentifierCard = digitalResourceServiceCard.cards().find(function(topCard) {
            return topCard.nodegroupid === digitalResourceServiceIdentifierNodegroupId;
        });
        this.digitalResourceServiceIdentifierTile = digitalResourceServiceIdentifierCard.getNewTile();


        var digitalResourceNameContentNodeId = 'd2fdc2fa-ca7a-11e9-8ffb-a4d18cec433a';
        var digitalResourceStatementContentNodeId = 'da1fbca1-ca7a-11e9-8256-a4d18cec433a';
        var digitalResourceServiceTypeConformanceNodeId = 'cec360bd-ca7f-11e9-9ab7-a4d18cec433a';
        var digitalResourceServiceIdentifierContentNodeId = '56f8e9bd-ca7c-11e9-b578-a4d18cec433a';
        var digitalResourceServiceIdentifierTypeNodeId = '56f8e759-ca7c-11e9-bda1-a4d18cec433a';

        this.manifestData = ko.observable();
        this.manifestData.subscribe(function(manifestData) {
            self.digitalResourceNameTile.data[digitalResourceNameContentNodeId](manifestData.label);
            self.digitalResourceStatementTile.data[digitalResourceStatementContentNodeId](manifestData.description);

            self.digitalResourceServiceIdentifierTile.data[digitalResourceServiceIdentifierContentNodeId]((function() {
                // TO BE REFACTORED ONCE MANIFEST_MANAGER RETURNS PROPER FORMAT FOR UPLOADED FILES

                if (manifestData['@id']) {
                    return manifestData['@id']
                }
                else {
                    return 'IIIF FROM UPLOADED FILES DOES NOT CONTAIN A DIRECT REFERENCE TO MANIFEST'
                }
            })()); // IIFE

            self.digitalResourceServiceIdentifierTile.data[digitalResourceServiceIdentifierTypeNodeId](["f32d0944-4229-4792-a33c-aadc2b181dc7"]); // uniform resource locators concept value id
            self.digitalResourceServiceTile.data[digitalResourceServiceTypeConformanceNodeId](manifestData['@context']);
        });

        
        this.initialize = function() {
            if (!ko.unwrap(params.saveFunction)) {
                params.saveFunction(self.save);
            }

            if (!self.physicalThingDigitalReferenceCard() || !self.physicalThingDigitalReferenceTile()) {
                self.getPhysicalThingDigitalReferenceData();
            }
        };

        this.save = function() {
            self.digitalResourceNameTile.save().then(function(data) {
                self.digitalResourceStatementTile.resourceinstance_id = data.resourceinstance_id;

                self.digitalResourceStatementTile.save().then(function(data) {
                    self.digitalResourceServiceTile.resourceinstance_id = data.resourceinstance_id;

                    self.digitalResourceServiceTile.save().then(function(data) {
                        self.digitalResourceServiceIdentifierTile.resourceinstance_id = data.resourceinstance_id;
                        self.digitalResourceServiceIdentifierTile.parenttile_id = data.tileid;

                        self.digitalResourceServiceIdentifierTile.save().then(function(data) {
                            var digitalReferenceTile = self.physicalThingDigitalReferenceTile();

                            var digitalSourceNodeId = 'a298ee52-8d59-11eb-a9c4-faffc265b501'; // Digital Source (E73) (physical thing)

                            digitalReferenceTile.data[digitalSourceNodeId] = [{
                                "resourceId": data.resourceinstance_id,
                                "ontologyProperty": "http://www.cidoc-crm.org/cidoc-crm/P67i_is_referred_to_by",
                                "inverseOntologyProperty": "http://www.cidoc-crm.org/cidoc-crm/P67_refers_to"
                            }];
                            
                            var digitalReferenceTypeNodeId = 'f11e4d60-8d59-11eb-a9c4-faffc265b501'; // Digital Reference Type (E55) (physical thing)
                            digitalReferenceTile.data[digitalReferenceTypeNodeId] = '1497d15a-1c3b-4ee9-a259-846bbab012ed' // Preferred Manifest concept value
                
                            digitalReferenceTile.save()
                        });
                    });
                });
            });
        };

        this.openManifestManager = function() {
            self.isManifestManagerHidden(false);

        };

        this.handleExitFromManifestManager = function() {
            self.isManifestManagerHidden(true);

            self.physicalThingDigitalReferencePreferredManifestResourceData.push({
                'displayname': self.manifestData()['label']
            });
            
            self.selectedPhysicalThingImageService(self.manifestData()['label']);
        };

        this.getPhysicalThingDigitalReferenceData = function() {
            $.getJSON( arches.urls.api_card + self.physicalThingResourceId ).then(function(data) {
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

                var digitalReferenceCard = new CardViewModel({
                    card: digitalReferenceCardData,
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

                self.physicalThingDigitalReferenceCard(digitalReferenceCard);
                self.physicalThingDigitalReferenceTile(digitalReferenceCard.getNewTile());
            });
        };

        /* function used for getting the names of digital resources already related to physical thing */ 
        this.getPhysicalThingRelatedDigitalReferenceData = function(card) {
            var digitalReferenceTypeNodeId = 'f11e4d60-8d59-11eb-a9c4-faffc265b501'; // Digital Reference Type (E55) (physical thing)
            
            var tiles = card.tiles() || [];
            tiles.forEach(function(tile) {
                if (ko.unwrap(tile.data[digitalReferenceTypeNodeId]) === '1497d15a-1c3b-4ee9-a259-846bbab012ed')  { // Preferred Manifest concept value
                    var digitalSourceNodeId = 'a298ee52-8d59-11eb-a9c4-faffc265b501'; // Digital Source (E73) (physical thing)
                    var physicalThingPreferredManifestResourceId = tile.data[digitalSourceNodeId]()[0].resourceId();
                    
                    $.getJSON( arches.urls.api_card + physicalThingPreferredManifestResourceId ).then(function(data) {
                        self.physicalThingDigitalReferencePreferredManifestResourceData.push(data);
                    });
                }
            });
        };


        this.initialize();
    }

    ko.components.register('analysis-areas-image-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/analysis-areas-image-step.htm' }
    });
    return viewModel;
});
