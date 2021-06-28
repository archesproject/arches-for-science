define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'models/graph',
    'viewmodels/card',
    'views/components/plugins/manifest-manager',
], function(_, $, arches, ko, koMapping, GraphModel, CardViewModel) {
    function viewModel(params) {
        var self = this;

        this.isManifestManagerHidden = ko.observable(true);
        this.shouldShowEditService = ko.observable(false);

        this.selectedPhysicalThingImageServiceName = ko.observable();
        this.selectedPhysicalThingImageServiceName.subscribe(function(imageServiceName) {
            params.dirty(true);

            if (imageServiceName) {
                var resourceData = self.getResourceDataAssociatedWithPreviouslyPersistedTile(imageServiceName);
                if (resourceData) { params.dirty(false); }
            }
        });

        var objectStepData = params.form.externalStepData['objectstep']['data'];
        this.physicalThingResourceId = koMapping.toJS(objectStepData['sample-object-resource-instance'][0][1]);

        this.physicalThingDigitalReferenceCard = ko.observable();
        this.physicalThingDigitalReferenceCard.subscribe(function(card) {
            self.getPhysicalThingRelatedDigitalReferenceData(card);
        });

        this.physicalThingDigitalReferenceTile = ko.observable();

        this.physicalThingDigitalReferencePreferredManifestResourceData = ko.observableArray();
        this.physicalThingDigitalReferenceAlternateManifestResourceData = ko.observableArray();

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
                    return manifestData['@id'];
                }
                else {
                    return 'IIIF FROM UPLOADED FILES DOES NOT CONTAIN A DIRECT REFERENCE TO MANIFEST';
                }
            })()); // IIFE

            self.digitalResourceServiceIdentifierTile.data[digitalResourceServiceIdentifierTypeNodeId](["f32d0944-4229-4792-a33c-aadc2b181dc7"]); // uniform resource locators concept value id
            self.digitalResourceServiceTile.data[digitalResourceServiceTypeConformanceNodeId](manifestData['@context']);
        });

        
        this.initialize = function() {
            params.form.save = self.save;

            if (!self.physicalThingDigitalReferenceCard() || !self.physicalThingDigitalReferenceTile()) {
                self.getPhysicalThingDigitalReferenceData();
            }
        };

        this.getResourceDataAssociatedWithPreviouslyPersistedTile = function(imageServiceName) {
            var preferredManifestResourceData = self.physicalThingDigitalReferencePreferredManifestResourceData().find(function(manifestData) { return manifestData.displayname === imageServiceName; });
            var alternateManifestResourceData = self.physicalThingDigitalReferenceAlternateManifestResourceData().find(function(manifestData) { return manifestData.displayname === imageServiceName; });

            var manifestResourceData = preferredManifestResourceData || alternateManifestResourceData; /* the same displayname should not exist in both values */
            
            /* will not have tiles if creating a new manifest */ 
            if (manifestResourceData && manifestResourceData.tiles && params.form.previouslyPersistedComponentData) {
                var previouslyPersistedTileId = params.form.previouslyPersistedComponentData[0].tileid;

                var tileMatchingPreviouslyPersistedTile = manifestResourceData.tiles.find(function(tile) {
                    return tile.tileid === previouslyPersistedTileId;
                });

                if (tileMatchingPreviouslyPersistedTile && manifestResourceData.displayname === imageServiceName) {
                    return manifestResourceData;
                }
            }
        };

        this.save = function() {
            params.form.complete(false);
            params.form.saving(true);

            if (self.manifestData()) {
                self.digitalResourceNameTile.save().then(function(data) {
                    self.digitalResourceStatementTile.resourceinstance_id = data.resourceinstance_id;
    
                    self.digitalResourceStatementTile.save().then(function(data) {
                        self.digitalResourceServiceTile.resourceinstance_id = data.resourceinstance_id;
    
                        self.digitalResourceServiceTile.save().then(function(data) {
                            self.digitalResourceServiceIdentifierTile.resourceinstance_id = data.resourceinstance_id;
                            self.digitalResourceServiceIdentifierTile.parenttile_id = data.tileid;
    
                            self.digitalResourceServiceIdentifierTile.save().then(function(data) {
                                params.form.savedData.push(data);
    
                                var digitalReferenceTile = self.physicalThingDigitalReferenceTile();
    
                                var digitalSourceNodeId = 'a298ee52-8d59-11eb-a9c4-faffc265b501'; // Digital Source (E73) (physical thing)
    
                                digitalReferenceTile.data[digitalSourceNodeId] = [{
                                    "resourceId": data.resourceinstance_id,
                                    "ontologyProperty": "http://www.cidoc-crm.org/cidoc-crm/P67i_is_referred_to_by",
                                    "inverseOntologyProperty": "http://www.cidoc-crm.org/cidoc-crm/P67_refers_to"
                                }];
                                
                                var digitalReferenceTypeNodeId = 'f11e4d60-8d59-11eb-a9c4-faffc265b501'; // Digital Reference Type (E55) (physical thing)
                                digitalReferenceTile.data[digitalReferenceTypeNodeId] = '1497d15a-1c3b-4ee9-a259-846bbab012ed'; // Preferred Manifest concept value
                    
                                digitalReferenceTile.save().then(function() {
                                    params.form.complete(true);
                                    params.form.saving(false);
                                });
                            });
                        });
                    });
                });
            }
            else {
                var preferredManifestResourceData = self.physicalThingDigitalReferencePreferredManifestResourceData().find(function(manifestData) { return manifestData.displayname === self.selectedPhysicalThingImageServiceName(); });
                var alternateManifestResourceData = self.physicalThingDigitalReferenceAlternateManifestResourceData().find(function(manifestData) { return manifestData.displayname === self.selectedPhysicalThingImageServiceName(); });
    
                var manifestResourceData = preferredManifestResourceData || alternateManifestResourceData; /* the same displayname should not exist in both values */

                if (manifestResourceData && manifestResourceData.tiles) {
                    var digitalResourceServiceIdentifierNodegroupId = '56f8e26e-ca7c-11e9-9aa3-a4d18cec433a';
                    
                    var matchingTile = manifestResourceData.tiles.find(function(tile) {
                        return tile.nodegroup_id === digitalResourceServiceIdentifierNodegroupId;
                    });
    
                    params.form.savedData.push(matchingTile);
                }

                params.form.complete(true);
                params.form.saving(false);        
            }
        };

        this.openManifestManager = function() {
            self.isManifestManagerHidden(false);

        };

        this.handleExitFromManifestManager = function() {
            self.isManifestManagerHidden(true);

            if (
                self.manifestData() 
                && self.manifestData()['label']
                && !self.physicalThingDigitalReferencePreferredManifestResourceData().find(function(manifestData) { return manifestData.displayname === self.manifestData()['label']; })
            ) {
                self.physicalThingDigitalReferencePreferredManifestResourceData.push({
                    'displayname': self.manifestData()['label']
                });

                self.selectedPhysicalThingImageServiceName(self.manifestData()['label']);
            }
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
            var digitalSourceNodeId = 'a298ee52-8d59-11eb-a9c4-faffc265b501'; // Digital Source (E73) (physical thing)

            var preferredManifestConceptValueId = '1497d15a-1c3b-4ee9-a259-846bbab012ed';
            var alternateManifestConceptValueId = "00d5a7a6-ff2f-4c44-ac85-7a8ab1a6fb70";
            
            var tiles = card.tiles() || [];

            tiles.forEach(function(tile) {
                var digitalReferenceTypeValue = ko.unwrap(tile.data[digitalReferenceTypeNodeId]);

                if (digitalReferenceTypeValue === ( preferredManifestConceptValueId || alternateManifestConceptValueId ))  {
                    var physicalThingManifestResourceId = tile.data[digitalSourceNodeId]()[0].resourceId();
                    
                    $.getJSON( arches.urls.api_card + physicalThingManifestResourceId ).then(function(data) {
                        if (digitalReferenceTypeValue === preferredManifestConceptValueId) {
                            self.physicalThingDigitalReferencePreferredManifestResourceData.push(data);
                        }
                        else if (digitalReferenceTypeValue === alternateManifestConceptValueId) {
                            self.physicalThingDigitalReferenceAlternateManifestResourceData.push(data);
                        }
                        
                        var resourceData = self.getResourceDataAssociatedWithPreviouslyPersistedTile(data.displayname);
                        if (resourceData) {
                            self.selectedPhysicalThingImageServiceName(resourceData.displayname);
                        }
                        else if (!self.selectedPhysicalThingImageServiceName()) {
                            self.selectedPhysicalThingImageServiceName(self.physicalThingDigitalReferencePreferredManifestResourceData()[0].displayname);
                        }
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
