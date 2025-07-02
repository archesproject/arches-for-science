define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'models/graph',
    'viewmodels/card',
    'utils/iiif-utils',
    'templates/views/components/workflows/add-chemical-analysis-images-workflow/add-chemical-analysis-images-image-step.htm',
    'views/components/plugins/manifest-manager',
], function(_, $, arches, ko, koMapping, GraphModel, CardViewModel, iiifUtils, addChemicalAnalysisImagesImageStepTemplate) {
    function viewModel(params) {
        var self = this;
        params.pageVm.loading(true);
        const datasetFileNodeId = "7c486328-d380-11e9-b88e-a4d18cec433a";

        this.workflowId = params.form.workflowId;

        this.isManifestManagerHidden = ko.observable(true);
        this.shouldShowEditService = ko.observable(true);

        this.selectedPhysicalThingImageServiceName = ko.observable();
        this.selectedPhysicalThingImageServiceName.subscribe(function(imageServiceName) {
            params.dirty(true);

            if (imageServiceName) {
                var resourceData = self.getResourceDataAssociatedWithPreviouslyPersistedTile(imageServiceName);
                if (resourceData) { params.dirty(false); }
            }
        });

        this.digitalResourcesInstanceIds = ko.observableArray();

        this.observationResourceId = koMapping.toJS(params.observationResourceId);

        this.observationDigitalReferenceCard = ko.observable();
        this.observationDigitalReferenceCard.subscribe(function(card) {
            //---//
            self.getPhysicalThingRelatedDigitalReferenceData(card);
        });

        this.observationResourceInstanceId = ko.observable();
        this.observationDigitalReferenceTile = ko.observable();

        this.observationDigitalReferencePreferredManifestResourceData = ko.observableArray();
        this.observationDigitalReferenceAlternateManifestResourceData = ko.observableArray();

        this.physicalThingResourceId = koMapping.toJS(params.physicalThingResourceId);

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
        this.locked = params.form.locked;
        
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

        const digitalResourceTypeNodegroupId = '09c1778a-ca7b-11e9-860b-a4d18cec433a';
        const digitalResourceTypeCard = params.form.topCards.find(function(topCard) {
            return topCard.nodegroupid === digitalResourceTypeNodegroupId;
        });
        this.digitalResourceTypeTile = digitalResourceTypeCard.getNewTile();

        const digitalResourceServiceIdentifierNodegroupId = '56f8e26e-ca7c-11e9-9aa3-a4d18cec433a';
        var digitalResourceServiceIdentifierCard = digitalResourceServiceCard.cards().find(function(topCard) {
            return topCard.nodegroupid === digitalResourceServiceIdentifierNodegroupId;
        });
        this.digitalResourceServiceIdentifierTile = digitalResourceServiceIdentifierCard.getNewTile();


        var digitalResourceFileNodegroupId = '7c486328-d380-11e9-b88e-a4d18cec433a';
        var digitalResourceFileCard = params.form.topCards.find(function(topCard) {
            return topCard.nodegroupid === digitalResourceFileNodegroupId;
        });
        this.digitalResourceFileTile = digitalResourceFileCard.getNewTile();
        

        const digitalResourceNameContentNodeId = 'd2fdc2fa-ca7a-11e9-8ffb-a4d18cec433a';
        const digitalResourceStatementContentNodeId = 'da1fbca1-ca7a-11e9-8256-a4d18cec433a';
        const digitalResourceServiceTypeConformanceNodeId = 'cec360bd-ca7f-11e9-9ab7-a4d18cec433a';
        const digitalResourceServiceIdentifierContentNodeId = '56f8e9bd-ca7c-11e9-b578-a4d18cec433a';
        const digitalResourceServiceIdentifierTypeNodeId = '56f8e759-ca7c-11e9-bda1-a4d18cec433a';
        const digitalResourceServiceTypeNodeId= '5ceedd21-ca7c-11e9-a60f-a4d18cec433a';
        const digitalResourceTypeNodeId = '09c1778a-ca7b-11e9-860b-a4d18cec433a';

        const digitalResourceFileNodeId = '7c486328-d380-11e9-b88e-a4d18cec433a';

        this.buildStrObject = str => {
            return {[arches.activeLanguage]: {
                "value": str,
                "direction": arches.languages.find(lang => lang.code == arches.activeLanguage).default_direction
            }};
        };

        this.manifestManagerFormData = ko.observable();
        this.formData = new window.FormData();
        
        this.saveDatasetFile = (formData, file) => {
            //Tile structure for the Digital Resource 'File' nodegroup

            if(file) {
                let fileInfo;
                
                if (!ko.unwrap(file.tileId)) {
                    fileInfo = {
                        name: file.name,
                        accepted: true,
                        height: file.height,
                        lastModified: file.lastModified,
                        size: file.size,
                        status: file.status,
                        type: file.type,
                        width: file.width,
                        url: null,
                        uploaded: ko.observable(false),
                        // eslint-disable-next-line camelcase
                        file_id: null,
                        index: 0,
                        content: window.URL.createObjectURL(file),
                        error: file.error,
                    };


                    formData.append(`file-list_${datasetFileNodeId}_data`, JSON.stringify(fileInfo));
                    formData.append(`file-list_${datasetFileNodeId}_preloaded`, new Blob([file]), file.name);
                }
            }
        };

        

        this.fileData = Array();
        this.fileDataPreloaded = Array();
        this.manifestManagerFormData.subscribe(function(manifestManagerFormData) {
            var files = manifestManagerFormData.getAll('files');
            Array.from(files).forEach(file => {
                // Then save a file tile to the digital resource for each associated file
                self.saveDatasetFile(self.formData, file);
            });
                });

        this.manifestData = ko.observable();
        this.manifestData.subscribe(function(manifestData) {
            if (manifestData) {
                self.digitalResourceNameTile.data[digitalResourceNameContentNodeId](self.buildStrObject(manifestData.label));
                const manifestDescription = Array.isArray(manifestData.description) ? self.buildStrObject(manifestData.description[0]) : self.buildStrObject(manifestData.description);
                self.digitalResourceStatementTile.data[digitalResourceStatementContentNodeId](manifestDescription);
                self.digitalResourceServiceIdentifierTile.data[digitalResourceServiceIdentifierContentNodeId](self.buildStrObject(manifestData['@id']));
                self.digitalResourceServiceIdentifierTile.data[digitalResourceServiceIdentifierTypeNodeId](["f32d0944-4229-4792-a33c-aadc2b181dc7"]); // uniform resource locators concept value id
                self.digitalResourceServiceTile.data[digitalResourceServiceTypeConformanceNodeId](self.buildStrObject(manifestData['@context']));
            }
            else {
                self.digitalResourceNameTile.data[digitalResourceNameContentNodeId](null);
                self.digitalResourceStatementTile.data[digitalResourceStatementContentNodeId](null);
                self.digitalResourceServiceIdentifierTile.data[digitalResourceServiceIdentifierContentNodeId](null);
                self.digitalResourceServiceIdentifierTile.data[digitalResourceServiceIdentifierTypeNodeId](null);
                self.digitalResourceServiceTile.data[digitalResourceServiceTypeConformanceNodeId](null);
            }
        });

        
        this.initialize = function() {
            params.form.save = self.save;
            params.form.reset = self.reset;

            if (!self.observationDigitalReferenceCard() || !self.observationDigitalReferenceTile()) {
                self.getObservationDigitalReferenceData(); 
            }

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

        this.savePhysicalThingDigitalReferenceTile = function(data) {
            var digitalReferenceTile = self.physicalThingDigitalReferenceTile();
            var digitalSourceNodeId = 'a298ee52-8d59-11eb-a9c4-faffc265b501'; // Digital Source (E73) (physical thing)

            var digitalResourceInstanceId = data.resourceinstance_id

            digitalReferenceTile.data[digitalSourceNodeId] = [{
                "resourceId": digitalResourceInstanceId,
                "ontologyProperty": "http://www.cidoc-crm.org/cidoc-crm/P67i_is_referred_to_by",
                "inverseOntologyProperty": "http://www.cidoc-crm.org/cidoc-crm/P67_refers_to"
            }];

            var digitalReferenceTypeNodeId = 'f11e4d60-8d59-11eb-a9c4-faffc265b501'; // Digital Reference Type (E55) (physical thing)
            digitalReferenceTile.data[digitalReferenceTypeNodeId] = '1497d15a-1c3b-4ee9-a259-846bbab012ed'; // Preferred Manifest concept value

            digitalReferenceTile.transactionId = params.form.workflowId;
            return digitalReferenceTile.save();
        }

        this.saveObservationDigitalReferenceTile = function(data) {
            if (self.observationDigitalReferenceTile()) {
                self.observationResourceInstanceId(self.observationDigitalReferenceTile().resourceinstance_id);
                var digitalReferenceTile = self.observationDigitalReferenceTile();
                var digitalSourceNodeId = '0ae14d2a-8e30-11eb-a9c4-faffc265b501'; // Digital Source (E73) (observation)

                var digitalResourceInstanceId = data.resourceinstance_id

                digitalReferenceTile.data[digitalSourceNodeId] = [{
                    "resourceId": digitalResourceInstanceId,
                    "ontologyProperty": "http://www.cidoc-crm.org/cidoc-crm/P67i_is_referred_to_by",
                    "inverseOntologyProperty": "http://www.cidoc-crm.org/cidoc-crm/P67_refers_to"
                }];

                var digitalReferenceTypeNodeId = '0ae14c58-8e30-11eb-a9c4-faffc265b501'; // Digital Reference Type (E55) (observation)
                digitalReferenceTile.data[digitalReferenceTypeNodeId] = '1497d15a-1c3b-4ee9-a259-846bbab012ed'; // Preferred Manifest concept value

                digitalReferenceTile.transactionId = params.form.workflowId;
                return digitalReferenceTile.save();
            }
        };

        this.save = async function() {
            params.form.complete(false);
            params.form.saving(true);
            params.pageVm.loading(true);

            params.form.lockExternalStep("select-project", true);
            if (self.manifestData() && self.manifestData()['label'] === self.selectedPhysicalThingImageServiceName()) {
                const manifest_response = await fetch(`${arches.urls.manifest_x_canvas}?manifest=${self.manifestData()['@id']}`);
                const manifest_data = await manifest_response.json();
                const digitalResourcesResourceId = manifest_data.digital_resource;
                const card_response = await fetch(arches.urls.api_card + digitalResourcesResourceId);
                const card_data = await card_response.json();

                const digitalServiceTile = card_data.tiles.find(function(tile) {
                    return tile.nodegroup_id === digitalResourceServiceIdentifierNodegroupId;
                });

                self.savePhysicalThingDigitalReferenceTile(digitalServiceTile);
                self.saveObservationDigitalReferenceTile(digitalServiceTile);

                digitalServiceTile.digitalResourceInstancesIds = [];
                digitalServiceTile.digitalResourceInstancesIds = self.digitalResourcesInstanceIds();
                digitalServiceTile.ManifestResourceId = digitalServiceTile.resourceinstance_id;
                params.form.savedData(digitalServiceTile);
                params.form.value(digitalServiceTile);

                params.form.complete(true);
                params.form.saving(false);
                params.pageVm.loading(false);
            }
            else {
                var preferredManifestResourceData = self.physicalThingDigitalReferencePreferredManifestResourceData().find(function(manifestData) { return manifestData.displayname === self.selectedPhysicalThingImageServiceName(); });
                var alternateManifestResourceData = self.physicalThingDigitalReferenceAlternateManifestResourceData().find(function(manifestData) { return manifestData.displayname === self.selectedPhysicalThingImageServiceName(); });
    
                var manifestResourceData = preferredManifestResourceData || alternateManifestResourceData; /* the same displayname should not exist in both values */

                if (manifestResourceData && manifestResourceData.tiles) {
                    var matchingTile = manifestResourceData.tiles.find(function(tile) {
                        return tile.nodegroup_id === digitalResourceServiceIdentifierNodegroupId;
                    });
    
                    self.saveObservationDigitalReferenceTile(matchingTile);
    
                    matchingTile.digitalResourceInstancesIds = [];
                    matchingTile.digitalResourceInstancesIds = self.digitalResourcesInstanceIds();
                    matchingTile.ManifestResourceId = matchingTile.resourceinstance_id;
                    params.form.savedData(matchingTile);
                    params.form.value(matchingTile);
    
                    params.form.complete(true);
                    params.form.saving(false);
                    params.pageVm.loading(false);
                }
                else {
                    params.form.complete(true);
                    params.form.saving(false);
                    params.pageVm.loading(false);
                }
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

        this.getObservationDigitalReferenceData = function() {
            $.getJSON( arches.urls.api_card + self.observationResourceId ).then(function(data) {
                var digitalReferenceCardData = data.cards.find(function(card) {
                    return card.nodegroup_id === '0ae149ba-8e30-11eb-a9c4-faffc265b501';
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
                    resourceId: ko.observable(self.observationResourceId),
                    displayname: ko.observable(data.displayname),
                    handlers: handlers,
                    cards: data.cards,
                    tiles: data.tiles,
                    cardwidgets: data.cardwidgets,
                    userisreviewer: data.userisreviewer,
                });

                self.observationDigitalReferenceCard(digitalReferenceCard);
                self.observationDigitalReferenceTile(digitalReferenceCard.getNewTile());
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

        this.getObservationRelatedDigitalReferenceData = function(card) {
            var digitalReferenceTypeNodeId = '0ae14c58-8e30-11eb-a9c4-faffc265b501'; // Digital Reference Type (E55) (observation)
            var digitalSourceNodeId = '0ae14d2a-8e30-11eb-a9c4-faffc265b501'; // Digital Source (E73) (observation)

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

    ko.components.register('add-chemical-analysis-images-image-step', {
        viewModel: viewModel,
        template: addChemicalAnalysisImagesImageStepTemplate
    });
    return viewModel;
});
