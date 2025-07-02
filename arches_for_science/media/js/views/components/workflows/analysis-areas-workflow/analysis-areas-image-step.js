define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'models/graph',
    'viewmodels/card',
    'templates/views/components/workflows/analysis-areas-workflow/analysis-areas-image-step.htm',
    'views/components/workflows/stringUtils',
    'utils/iiif-utils',
    'views/components/plugins/manifest-manager',
], function(_, $, arches, ko, koMapping, GraphModel, CardViewModel, analysisAreasImageStepTemplate, stringUtils, iiifUtils) {
    function viewModel(params) {
        var self = this;
        params.pageVm.loading(true);

        this.workflowId = params.form.workflowId;

        this.isManifestManagerHidden = ko.observable(true);
        this.shouldShowSelectService = ko.observable(true);

        this.selectedPhysicalThingImageServiceName = ko.observable();
        this.selectedPhysicalThingImageServiceName.subscribe(function(imageServiceName) {
            params.dirty(true);

            if (imageServiceName) {
                var resourceData = self.getResourceDataAssociatedWithPreviouslyPersistedTile(imageServiceName);
                if (resourceData) { params.dirty(false); }
            }
        });

        this.physicalThingResourceId = koMapping.toJS(params.physicalThingResourceId);

        this.physicalThingDigitalReferenceCard = ko.observable();
        this.physicalThingDigitalReferenceCard.subscribe(function(card) {
            self.getPhysicalThingRelatedDigitalReferenceData(card);
        });

        this.physicalThingDigitalReferenceTile = ko.observable();

        this.physicalThingDigitalReferencePreferredManifestResourceData = ko.observableArray();
        this.physicalThingDigitalReferenceAlternateManifestResourceData = ko.observableArray();
        this.locked = params.form.locked;
        const digitalResourceServiceIdentifierNodegroupId = '56f8e26e-ca7c-11e9-9aa3-a4d18cec433a';
        const digitalResourceServiceIdentifierContentNodeId = '56f8e9bd-ca7c-11e9-b578-a4d18cec433a';

        this.manifestData = ko.observable();
        
        this.initialize = function() {
            params.form.save = self.save;
            params.form.reset = self.reset;

            if (!self.physicalThingDigitalReferenceCard() || !self.physicalThingDigitalReferenceTile()) {
                self.getPhysicalThingDigitalReferenceData();
            }
        };

        this.getResourceDataAssociatedWithPreviouslyPersistedTile = function(imageServiceName) {
            var preferredManifestResourceData = self.physicalThingDigitalReferencePreferredManifestResourceData().find(function(manifestData) { return manifestData.displayname === imageServiceName; });
            var alternateManifestResourceData = self.physicalThingDigitalReferenceAlternateManifestResourceData().find(function(manifestData) { return manifestData.displayname === imageServiceName; });

            var manifestResourceData = preferredManifestResourceData || alternateManifestResourceData; /* the same displayname should not exist in both values */
            
            /* will not have tiles if creating a new manifest */ 
            if (manifestResourceData && manifestResourceData.tiles && params.form.savedData()) {
                var previouslyPersistedTileId = params.form.savedData().tileid;

                var tileMatchingPreviouslyPersistedTile = manifestResourceData.tiles.find(function(tile) {
                    return tile.tileid === previouslyPersistedTileId;
                });

                if (tileMatchingPreviouslyPersistedTile && manifestResourceData.displayname === imageServiceName) {
                    return manifestResourceData;
                }
            }
        };

        this.save = async function() {
            params.form.complete(false);
            params.form.saving(true);
            params.form.lockExternalStep("select-project", true);
            const label = iiifUtils.getManifestLabel(self.manifestData());
            if (label === self.selectedPhysicalThingImageServiceName()) {
                const manifestId = iiifUtils.getManifestId(self.manifestData());
                const response = await fetch(`${arches.urls.manifest_x_canvas}?manifest=${manifestId}`);
                const data = await response.json();
                const digitalResourcesResourceId = data.digital_resource;

                const card_response = await fetch(arches.urls.api_card + digitalResourcesResourceId);
                const card_data = await card_response.json();
                const digitalServiceTile = card_data.tiles.find(function(tile) {
                    return tile.nodegroup_id === digitalResourceServiceIdentifierNodegroupId;
                });
                params.form.savedData(digitalServiceTile);

                var digitalReferenceTile = self.physicalThingDigitalReferenceTile();

                var digitalSourceNodeId = 'a298ee52-8d59-11eb-a9c4-faffc265b501'; // Digital Source (E73) (physical thing)
                // relationship valueids
                const digitalSource = "be3f33e9-216d-4355-8766-aced1e95616c";
                const digitalSourceFor = "ff6a0510-6c91-4c45-8c67-dbbcf8d7d7fa";

                digitalReferenceTile.data[digitalSourceNodeId] = [{
                    "resourceId": digitalResourcesResourceId,
                    "ontologyProperty": digitalSource,
                    "inverseOntologyProperty": digitalSourceFor
                }];

                var digitalReferenceTypeNodeId = 'f11e4d60-8d59-11eb-a9c4-faffc265b501'; // Digital Reference Type (E55) (physical thing)
                digitalReferenceTile.data[digitalReferenceTypeNodeId] = '1497d15a-1c3b-4ee9-a259-846bbab012ed'; // Preferred Manifest concept value

                digitalReferenceTile.transactionId = params.form.workflowId;
                digitalReferenceTile.save().then(function(data) {
                    params.form.complete(true);
                    params.form.saving(false);
                });
            }
            else {
                var preferredManifestResourceData = self.physicalThingDigitalReferencePreferredManifestResourceData().find(function(manifestData) { return manifestData.displayname === self.selectedPhysicalThingImageServiceName(); });
                var alternateManifestResourceData = self.physicalThingDigitalReferenceAlternateManifestResourceData().find(function(manifestData) { return manifestData.displayname === self.selectedPhysicalThingImageServiceName(); });
    
                var manifestResourceData = preferredManifestResourceData || alternateManifestResourceData; /* the same displayname should not exist in both values */

                if (manifestResourceData && manifestResourceData.tiles) {
                    var matchingTile = manifestResourceData.tiles.find(function(tile) {
                        return tile.nodegroup_id === digitalResourceServiceIdentifierNodegroupId;
                    });
    
                    params.form.savedData(matchingTile);
                }
                params.form.complete(true);
                params.form.saving(false);        
            }
        };

        this.reset = function() {
            if (params.form.savedData()) {
                var previouslyPersistedResourceId = params.form.savedData().resourceinstance_id;

                var preferredManifestResourceData = self.physicalThingDigitalReferencePreferredManifestResourceData().find(function(manifestData) { return manifestData.resourceid === previouslyPersistedResourceId; });
                var alternateManifestResourceData = self.physicalThingDigitalReferenceAlternateManifestResourceData().find(function(manifestData) { return manifestData.resourceid === previouslyPersistedResourceId; });
    
                var manifestResourceData = preferredManifestResourceData || alternateManifestResourceData; /* the same displayname should not exist in both values */

                if (manifestResourceData) {
                    self.selectedPhysicalThingImageServiceName(manifestResourceData.displayname);
                }
            }
        };

        this.openManifestManager = function() {
            self.isManifestManagerHidden(false);

        };

        this.handleExitFromManifestManager = function() {
            self.isManifestManagerHidden(true);
            const label = iiifUtils.getManifestLabel(self.manifestData());

            if (
                label
                && !self.physicalThingDigitalReferencePreferredManifestResourceData().find(function(manifestData) { return manifestData.displayname === self.manifestData()['label']; })
            ) {
                const thumbnail = iiifUtils.getManifestThumbnail(self.manifestData());
                self.physicalThingDigitalReferencePreferredManifestResourceData.push({
                    'displayname': label,
                    'thumbnail': thumbnail,
                });

                self.selectedPhysicalThingImageServiceName(label);
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

        this.getThumbnail = function(digitalResourceData) {
            const digitalServiceTile = digitalResourceData.tiles.find(function(tile) {
                return tile.nodegroup_id === digitalResourceServiceIdentifierNodegroupId;
            });
            return window.fetch(digitalServiceTile.data[digitalResourceServiceIdentifierContentNodeId][arches.activeLanguage]['value'])
                .then(function(response){
                    if(response.ok) {
                        return response.json();
                    }
                });
        };

        /* function used for getting the names of digital resources already related to physical thing */ 
        this.getPhysicalThingRelatedDigitalReferenceData = function(card) {
            var digitalReferenceTypeNodeId = 'f11e4d60-8d59-11eb-a9c4-faffc265b501'; // Digital Reference Type (E55) (physical thing)
            var digitalSourceNodeId = 'a298ee52-8d59-11eb-a9c4-faffc265b501'; // Digital Source (E73) (physical thing)

            var preferredManifestConceptValueId = '1497d15a-1c3b-4ee9-a259-846bbab012ed';
            var alternateManifestConceptValueId = "00d5a7a6-ff2f-4c44-ac85-7a8ab1a6fb70";
            
            var tiles = card.tiles() || [];

            const hasManifest = tiles.some(function(tile) {
                var digitalReferenceTypeValue = ko.unwrap(tile.data[digitalReferenceTypeNodeId]);
                return (digitalReferenceTypeValue === ( preferredManifestConceptValueId || alternateManifestConceptValueId ));
            });

            if (!hasManifest){
                params.pageVm.loading(false);
            }

            tiles.forEach(function(tile) {
                var digitalReferenceTypeValue = ko.unwrap(tile.data[digitalReferenceTypeNodeId]);

                if (digitalReferenceTypeValue === ( preferredManifestConceptValueId || alternateManifestConceptValueId ))  {
                    var physicalThingManifestResourceId = tile.data[digitalSourceNodeId]()[0].resourceId();

                    $.getJSON( arches.urls.api_card + physicalThingManifestResourceId )
                        .then(function(data) {
                            self.getThumbnail(data)
                                .then(function(json) {
                                    data.thumbnail = iiifUtils.getManifestThumbnail(json);
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
                        })
                        .always(function() {
                            params.pageVm.loading(false);
                        });
                }
            });
        };

        this.initialize();
    }

    ko.components.register('analysis-areas-image-step', {
        viewModel: viewModel,
        template: analysisAreasImageStepTemplate
    });
    return viewModel;
});
