define([
    'underscore', 
    'knockout', 
    'arches',
    'templates/views/components/reports/physical-thing.htm',
    'utils/report',
    'bindings/datatable', 
    'views/components/reports/scenes/annotation-parts',
    'views/components/reports/scenes/material'
], function(_, ko, arches, physicalThingReportTemplate, reportUtils) {
    return ko.components.register('physical-thing-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);

            const cardIds = self.cardIds = Object.freeze({
                productionEventOfObject: 'cc15650c-b497-11e9-a64d-a4d18cec433a',
                destructionEventOfObject: 'fc651451-b497-11e9-9d7b-a4d18cec433a',
                partRemovalEventOfObject: 'b11f217a-d2bc-11e9-8dfa-a4d18cec433a',
                dimensionOfObject: '0b7f8d0a-b498-11e9-a189-a4d18cec433a',
                nameOfObject: 'b9c1ced7-b497-11e9-a4da-a4d18cec433a',
                identifierOfObject: '22c150ca-b498-11e9-9adc-a4d18cec433a',
                externalUriForObject: '47971a2e-ac13-11ea-9f58-024e0d439fdb',
                currentOwnerOfObject: 'b008dacc-b31d-11e9-84af-a4d18cec433a',
                partsOfObject: 'fec59582-8593-11ea-97eb-acde48001122',
                collectionObjectIsPartOf: '63e49254-c444-11e9-afbe-a4d18cec433a',
                typeOfObject: '8ddfe3ab-b31d-11e9-aff0-a4d18cec433a',
                statementOrInterpretationAboutObject: '1952bb0a-b498-11e9-a679-a4d18cec433a',
                digitalReferenceToObject: '8a4ad932-8d59-11eb-a9c4-faffc265b501',
                additionEventOfObjectToCollection: '57f25133-d2bd-11e9-9131-a4d18cec433a',
                removalEventOfObjectFromCollection: 'a1490580-d2bd-11e9-af41-a4d18cec433a',
                textCarriedByObject: '23bf9ca1-b31e-11e9-8dd7-a4d18cec433a',
                currentLocationOfObject: 'a030e34f-b31d-11e9-8c0b-a4d18cec433a',
                parentObject: 'f8d5fe4c-b31d-11e9-9625-a4d18cec433a',
                elements: 'cbf9ba14-b31d-11e9-8529-a4d18cec433a'
            });

            self.sections = [
                {id: 'name', title: arches.translations.namesIdentifiersClassifications},
                {id: 'description', title: arches.translations.description},
                {id: 'existence', title: arches.translations.keyEvents},
                {id: 'substance', title: arches.translations.physicalDescription},
                {id: 'actor-relations', title: arches.translations.provenance},
                {id: 'location', title: arches.translations.location},
                {id: 'parthood', title: arches.translations.components},
                {id: 'sethood', title: arches.translations.relatedCollectionSets},
                {id: 'aboutness', title: arches.translations.contentIconography},
                {id: 'documentation', title: arches.translations.documentation},
                {id: 'json', title: 'JSON'},
            ];

            self.physicalThingProvenanceDescriptionTypes = [
                "provenance statement"
            ]
            self.physicalThingPhysicalDescriptionTypes = [
                "dimensions description",
                "materials/technique description"
            ]

            self.physicalThingExcludedDescriptionTypes = _.union(
                self.physicalThingProvenanceDescriptionTypes, self.physicalThingPhysicalDescriptionTypes
            )

            self.annotationTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(6).fill(null)
            };

            self.getTableConfig = (numberOfColumn) => {
                return {
                    ...self.defaultTableConfig,
                    columns: Array(numberOfColumn).fill(null),
                    columnDefs: []
                }
            };

            self.annotationTableHeader = 
                `<tr class="afs-table-header">
                    <th>Region Name</th>
                    <th>${arches.translations.partOfObject}</th>
                    <th class="min-tabletl">${arches.translations.annotator}</th>
                    <th class="none">Assigned Property Type</th>
                    <th class="none">Geometric Annotation Identifier</th>
                    <th class="afs-table-control all"></th>
                </tr>`

            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('name');
            self.visible = {parts: ko.observable(true)};
            self.selectedAnnotationTileId = ko.observable(null);
            self.nameCards = {};
            self.descriptionCards = {};
            self.materialCards = {};
            self.documentationCards = {};
            self.existenceEvents = ['production', 'destruction', 'removal from object'];
            self.existenceDataConfig = {
                production: {
                    graph: 'production',
                    metadata: [{
                        nodeid: 'cc16893d-b497-11e9-94b0-a4d18cec433a',
                        path: 'production_carried out by',
                        type: 'resource'
                    },{
                        nodeid: 'cc15a23a-b497-11e9-bb7f-a4d18cec433a',
                        path: 'production_used object',
                        type: 'resource'
                    },{
                        nodeid: 'cc168005-b497-11e9-a303-a4d18cec433a',
                        path: 'production_technique',
                        type: 'resource'
                    },{
                        nodeid: 'cc15ce0f-b497-11e9-bedd-a4d18cec433a',
                        path: 'production_type',
                        title: true,
                        type: 'resource'
                    },{
                        nodeid: 'cc15bb30-b497-11e9-b68a-a4d18cec433a',
                        path: 'production_location',
                        type: 'resource'
                    },{
                        nodeid: 'cc1591c7-b497-11e9-967e-a4d18cec433a',
                        path: 'production_influence',
                        type: 'resource'
                    }],
                    parts: {
                        graph: 'production_part',
                        metadata:[{
                            nodeid: 'cc16698f-b497-11e9-af2a-a4d18cec433a',
                            path: 'production_part_carried out by',
                            type: 'resource'
                        },{
                            nodeid: 'cc167668-b497-11e9-8b05-a4d18cec433a',
                            path: 'production_part_used object',
                            type: 'resource'
                        },{
                            nodeid: 'cc159614-b497-11e9-b8df-a4d18cec433a',
                            path: 'production_part_technique',
                            type: 'kv'
                        },{
                            nodeid: 'cc1605f5-b497-11e9-babb-a4d18cec433a',
                            path: 'production_part_type',
                            title: true,
                            type: 'kv'
                        },{
                            nodeid: 'cc168394-b497-11e9-a76d-a4d18cec433a',
                            path: 'production_part_location',
                            type: 'resource'
                        },{
                            nodeid: 'cc164b5e-b497-11e9-84fd-a4d18cec433a',
                            path: 'production_part_influence',
                            type: 'resource'
                        }]
                    }
                },
                'destruction': { 
                    graph: 'destruction',
                    metadata: [{
                        path: 'destruction_location',
                        nodeid: 'fc653a19-b497-11e9-b323-a4d18cec433a',
                        type: 'resource'
                    },{
                        nodeid: 'fc651bfa-b497-11e9-9648-a4d18cec433a',
                        path: 'destruction_type',
                        type: 'kv'
                    }]
                }, 
                'removal from object': {
                    graph: 'removal from object',
                    metadata: [{
                        nodeid: '38814345-d2bd-11e9-b9d6-a4d18cec433a',
                        path: 'removal from object_removed from',
                        type: 'resource'
                    },{
                        nodeid: '37cde794-d31f-11e9-8be2-a4d18cec433a',
                        path: 'removal from object_carried out by',
                        type: 'resource'
                    },{
                        nodeid: 'b11f2ff8-d2bc-11e9-8c50-a4d18cec433a',
                        path: 'removal from object_technique',
                        type: 'kv'
                    },{
                        nodeid: 'b11f63d7-d2bc-11e9-a754-a4d18cec433a',
                        path: 'removal from object_location',
                        type: 'resource'
                    },{
                        nodeid: 'b11f3819-d2bc-11e9-a1f6-a4d18cec433a',
                        path: 'removal from object_influence',
                        type: 'resource'
                    }]
                }
            };

            self.setEvents = ['addition', 'removal'];
            self.setDataConfig = {
                addition: {
                    graph: 'addition to collection',
                    metadata: [{
                        nodeid: '7f13dbde-d2bd-11e9-9adc-a4d18cec433a',
                        path: 'addition to collection_added to',
                        type: 'resource'
                    },{
                        nodeid: '57f2ba0a-d2bd-11e9-a295-a4d18cec433a',
                        path: 'addition to collection_type',
                        type: 'kv'
                    },{
                        nodeid: '93a9dbe1-d31f-11e9-a20f-a4d18cec433a',
                        path: 'addition to collection_carried out by',
                        type: 'resource'
                    }]
                }, removal: {
                    graph:'removal from set',
                    metadata: [{
                        nodeid: 'bb5d10d7-d2bd-11e9-b144-a4d18cec433a',
                        path: 'removal from set_removed from',
                        type: 'resource'
                    },{
                        nodeid: 'a149317a-d2bd-11e9-a02f-a4d18cec433a',
                        path: 'removal from set_type',
                        type: 'kv'
                    },{
                        nodeid: '9689fbe8-d321-11e9-8eaf-a4d18cec433a',
                        path: 'removal from set_carried out by',
                        type: 'resource'
                    }]
                }};

            self.existenceCards = {};
            self.substanceCards = {};
            self.setCards = {}
            self.summary = params.summary;

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards);

                if(self.cards?.[cardIds.productionEventOfObject]) {
                    const productionEventChildren = self.cards[cardIds.productionEventOfObject].tiles()?.[0]?.cards ? self.cards[cardIds.productionEventOfObject].tiles()[0].cards : self.cards[cardIds.productionEventOfObject].cards();
                    self.cards[cardIds.productionEventOfObject].children = self.createCardDictionary(productionEventChildren);
                }

                self.nameCards = {
                    name: self.cards?.[cardIds.nameOfObject],
                    identifier: self.cards?.[cardIds.identifierOfObject],
                    exactMatch: self.cards?.[cardIds.externalUriForObject],
                    type: self.cards?.[cardIds.typeOfObject]
                };

                self.materialCards = {
                    elements: self.cards?.[cardIds.elements]
                };

                self.descriptionCards = {
                    statement: self.cards?.[cardIds.statementOrInterpretationAboutObject]
                };

                self.documentationCards = {
                    digitalReference: self.cards?.[cardIds.digitalReferenceToObject],
                };

                self.existenceCards = {
                    production: {
                        card: self.cards?.[cardIds.productionEventOfObject],
                        subCards: {
                            name: 'cc1558a3-b497-11e9-9310-a4d18cec433a',
                            identifier: 'cc153f33-b497-11e9-bab1-a4d18cec433a',
                            timespan: 'cc15718f-b497-11e9-a9e8-a4d18cec433a',
                            statement: '6c1d4051-bee9-11e9-a4d2-a4d18cec433a',
                            part: 'cc1577b8-b497-11e9-8f11-a4d18cec433a'
                        },
                        partCards: { 
                            name: 'cc1545ae-b497-11e9-9f51-a4d18cec433a',
                            identifier: 'cc155257-b497-11e9-9ed7-a4d18cec433a',
                            timespan: 'cc157e05-b497-11e9-8f5a-a4d18cec433a',
                            statement: '7ae6204a-bee9-11e9-bd2a-a4d18cec433a'
                        }
                    },
                    destruction: {
                        card:  self.cards?.[cardIds.destructionEventOfObject],
                        subCards: {
                            name: 'fc6503cc-b497-11e9-a303-a4d18cec433a',
                            identifier: 'fc64ff42-b497-11e9-b739-a4d18cec433a',
                            timespan: 'fc64fa42-b497-11e9-83d1-a4d18cec433a',
                            statement: 'fc650868-b497-11e9-9222-a4d18cec433a'
                        }
                    },
                    'removal from object': { 
                        card: self.cards?.[cardIds.partRemovalEventOfObject],
                        subCards: {
                            name: 'b11f1228-d2bc-11e9-b283-a4d18cec433a',
                            identifier: 'b11f0a30-d2bc-11e9-a6f5-a4d18cec433a',
                            timespan: 'b11f19c7-d2bc-11e9-9621-a4d18cec433a',
                            statement: 'b11f0e4c-d2bc-11e9-87c4-a4d18cec433a'
                        }
                    },
                };

                self.setCards = {
                    addition: {
                        card:  self.cards?.[cardIds.additionEventOfObjectToCollection],
                        subCards: {
                            name: '57f23078-d2bd-11e9-bd35-a4d18cec433a',
                            identifier: '57f2288a-d2bd-11e9-87f9-a4d18cec433a',
                            timespan: '57f23f94-d2bd-11e9-a248-a4d18cec433a',
                            statement: '57f22c99-d2bd-11e9-8df9-a4d18cec433a'
                        }
                    },
                    removal: {
                        card:  self.cards?.[cardIds.additionEventOfObjectToCollection],
                        subCards: {
                            name: 'a148ed47-d2bd-11e9-a6fd-a4d18cec433a',
                            identifier: 'a148e2cf-d2bd-11e9-ab6b-a4d18cec433a',
                            timespan: 'a148f7c0-d2bd-11e9-95ca-a4d18cec433a',
                            statement: 'a148e83d-d2bd-11e9-b696-a4d18cec433a'
                        }
                    }
                };        

                self.substanceCards = {
                    dimension: self.cards?.[cardIds.dimensionOfObject]
                };

            }

            
            self.aboutnessData = ko.observable({
                sections: 
                    [
                        {
                            title: arches.translations.contentIconography,
                            data: [{
                                key: self.cards?.[cardIds.textCarriedByObject].model.name(), 
                                value: self.getRawNodeValue(self.resource(), 'carries'), 
                                card: self.cards?.[cardIds.textCarriedByObject],
                                type: 'resource'
                            }]
                        }
                    ]
            });            
            
            self.locationData = ko.observable({
                sections: 
                    [
                        {
                            title: arches.translations.currentLocation,
                            data: [{
                                key: self.cards?.[cardIds.currentLocationOfObject].model.name(), 
                                value: self.getRawNodeValue(self.resource(), 'current location'), 
                                card: self.cards?.[cardIds.currentLocationOfObject],
                                type: 'resource'
                            }]
                        }
                    ]
            });

            self.parthoodData = ko.observable({
                sections: 
                    [
                        {
                            title: arches.translations.components,
                            data: [{
                                key: self.cards?.[cardIds.parentObject].model.name(), 
                                value: self.getRawNodeValue(self.resource(), 'part of'), 
                                card: self.cards?.[cardIds.parentObject],
                                type: 'resource'
                            }]
                        }
                    ]
            });

            self.selectedAnnotationTileId = ko.observable();
            const parts = self.getRawNodeValue(self.resource(), 'part identifier assignment')
            self.annotation = parts ? {
                    info: parts.map((x => {
                        const column1 = self.getNodeValue(x, 'part identifier assignment_label'); // label/name
                        const column2 = self.getRawNodeValue(x, 'part identifier assignment_physical part of object'); // object part
                        const column3 = self.getRawNodeValue(x, 'part identifier assignment_annotator'); //annotator
                        const column4 = self.getNodeValue(x, 'part identifier assignment_assigned property type'); 
                        const column5 = self.getNodeValue(x, 'part identifier assignment_polygon identifier', 'part identifier assignment_polygon identifier_classification');
                        const tileId = self.getTileId(x);
                        const featureCollection = self.getNodeValue(x, 'part identifier assignment_polygon identifier');
                        for (feature of featureCollection.features){
                            feature.properties.tileId = tileId;
                        }
                        return {column1, column2, column3, column4, column5, tileId, featureCollection}
                    })),
                    card: self.cards?.[cardIds.partsOfObject],
                }: {};

            self.actorData = ko.observable({
                sections: 
                    [
                        {
                            title: arches.translations.provenance,
                            data: [{
                                key: self.cards?.[cardIds.currentOwnerOfObject].model.name(), 
                                value: self.getRawNodeValue(self.resource(), 'current owner'), 
                                card: self.cards?.[cardIds.currentOwnerOfObject],
                                type: 'resource'
                            }]
                        }
                    ]
            });

            self.parts = ko.observableArray();

            self.sethoodData = ko.observable({
                sections: 
                    [
                        {
                            title: arches.translations.relatedCollectionSets,
                            data: [{
                                key: self.cards?.[cardIds.collectionObjectIsPartOf].model.name(), 
                                value: self.getRawNodeValue(self.resource(), 'member of'), 
                                card: self.cards?.[cardIds.collectionObjectIsPartOf],
                                type: 'resource'
                            }]
                        }
                    ]
            });

            ////// Search Details section //////
            self.nameSummary = ko.observable();
            self.imageSummary = ko.observable();
            self.statementsSummary = ko.observable();
            self.typeSummary = ko.observable();
            self.identifierSummary = ko.observable();
            self.ownerSummary = ko.observable();
            self.dimensionsSummary = ko.observable();
            self.creationSummary = ko.observable();
            self.externalURISummary = ko.observable();

            const nameData = self.resource()?.name;
            if (nameData) {
                self.nameSummary(nameData.map(x => {
                    const type = self.getNodeValue(x, 'name_type');
                    const content = self.getNodeValue(x, 'name_content');
                    const language = self.getNodeValue(x, 'name_language');
                    return { type, content, language }
                }));
            };

            self.getThumbnail = async(digitalResourceData) => {
                const digitalResourceServiceIdentifierNodegroupId = '56f8e26e-ca7c-11e9-9aa3-a4d18cec433a';
                const digitalResourceServiceIdentifierContentNodeId = '56f8e9bd-ca7c-11e9-b578-a4d18cec433a';
                const digitalServiceTile = digitalResourceData.tiles.find(function(tile) {
                    return tile.nodegroup_id === digitalResourceServiceIdentifierNodegroupId;
                });
                const thumbnailUrl = digitalServiceTile.data[digitalResourceServiceIdentifierContentNodeId][arches.activeLanguage]?.['value'];
                if(thumbnailUrl){
                    return window.fetch()
                        .then(function(response){
                            if(response.ok) {
                                return response.json();
                            }
                        });
                }
            };

            const resourceId = ko.unwrap(self.reportMetadata).resourceinstanceid;
            const loadRelatedResources = async() => {
                const digitalResourceGraphId = '707cbd78-ca7a-11e9-990b-a4d18cec433a';
                const IIIFManifestConceptId = '0c682c76-a6a4-48f0-9c5b-1203a6dc33da';

                const result = await reportUtils.getRelatedResources(resourceId);
                const relatedResources = result?.related_resources;
                
                const relatedDigitalResources = relatedResources.filter(resource => resource.graph_id === digitalResourceGraphId);

                if (relatedDigitalResources.length) {
                    relatedDigitalResources.forEach(async resource => {
                        const resourceDomainConceptIds = resource.domains.map(x => x.conceptid)
                    
                        // If there is an IIIF manifest in the related resources, load the thumbnail from that manifest
                        if (resourceDomainConceptIds.includes(IIIFManifestConceptId)) {
                            const imageResource = await self.getThumbnail(resource);
                            if (imageResource) {
                                self.imageSummary([{
                                    displayname: imageResource.label,
                                    thumbnail: imageResource.sequences[0].canvases[0].thumbnail['@id']
                                }]);
                            }
                        }
                    });
                }
            };

            loadRelatedResources();

            const statementData = self.resource()?.statement;
            if (statementData) {
                self.statementsSummary(statementData.map(x => {
                    const type = self.getNodeValue(x, 'statement_type');
                    const content = self.getNodeValue(x, 'statement_content');
                    const language = self.getNodeValue(x, 'statement_language');
                    return { type, content, language }
                }));
            };

            const typeData = self.resource()?.type;
            if (typeData) {
                self.typeSummary([{
                    type: self.getNodeValue(typeData)
                }]);
            };

            const identiferData = self.resource()?.identifier;
            if (identiferData) {
                self.identifierSummary(identiferData.map(x => {
                    const type = self.getNodeValue(x, 'identifier_type');
                    const content = self.getNodeValue(x, 'identifier_content');
                    return { type, content }
                }));
            };

            const ownerData = self.resource()?.['current owner'];
            if (ownerData) {
                self.ownerSummary(ownerData['instance_details'].map(x => {
                    const displayValue = self.getNodeValue(x);
                    const link = self.getResourceLink({resourceId: self.getNodeValue(x, 'resourceId')});
                    return { displayValue, link }
                }));
            };

            const dimensionData = self.resource()?.dimension;
            if (dimensionData) {
                self.dimensionsSummary(dimensionData.map(x => {
                    const value = self.getNodeValue(x, 'Dimension_value ');
                    const unit = self.getNodeValue(x , 'dimension_unit');
                    const type = self.getNodeValue(x, 'dimension_type');
                    return { type, value, unit }
                }));
            };

            const creationData = self.resource()?.production;
            if (creationData) { 
                self.creationSummary(creationData.map(x => {
                    const creator = self.getNodeValue(x, 'Production_carried out by');
                    const creationDate = self.getNodeValue(x?.production_time, 'Production_time_begin of the begin');
                    const type = self.getNodeValue(x, 'Production_type');
                    const technique = self.getNodeValue(x, 'Production_technique');
                    const location = self.getNodeValue(x, 'Production_location');
                    const productionLocationResource = x?.production_location?.instance_details ? x?.production_location?.instance_details[0] : null;
                    const locationLink = reportUtils.getResourceLink({resourceId: productionLocationResource?.resourceId});
                    return { creator, creationDate, type, technique, location, locationLink};
                }));
            };

            const uriData = self.resource()?.exactmatch
            if (uriData) {
                self.externalURISummary([{
                    displayValue: self.getNodeValue(uriData)
                }]);
            }
        },
        template: physicalThingReportTemplate
    });
});