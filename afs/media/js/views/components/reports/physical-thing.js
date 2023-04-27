define([
    'underscore', 
    'knockout', 
    'arches',
    'templates/views/components/reports/physical-thing.htm',
    'utils/report',
    'bindings/datatable', 
    'views/components/reports/scenes/annotation-parts'
], function(_, ko, arches, physicalThingReportTemplate, reportUtils) {
    return ko.components.register('physical-thing-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);
            self.sections = [
                {id: 'name', title: 'Names, Identifiers, Classification'}, 
                {id: 'description', title: 'Description'},
                {id: 'existence', title: 'Key Events'},
                {id: 'substance', title: 'Physical Description'},
                {id: 'actor-relations', title: 'Provenance'},
                {id: 'location', title: 'Location'},
                {id: 'parthood', title: 'Components'},
                {id: 'sethood', title: 'Related Collection and Sets'},
                {id: 'aboutness', title: 'Content and Iconography'},
                {id: 'documentation', title: 'Documentation'},
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
                    <th>Part of Object</th>
                    <th class="min-tabletl">Annotator</th>
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
            self.documentationCards = {};
            self.existenceEvents = ['production', 'destruction', 'removal from object'];
            self.existenceDataConfig = {
                production: {
                    graph: 'production',
                    metadata: [{
                        key: 'creator in production event',
                        path: 'production_carried out by',
                        type: 'resource'
                    },{
                        key: 'physical object used in production event',
                        path: 'production_used object',
                        type: 'resource'
                    },{
                        key: 'production event technique',
                        path: 'production_technique',
                        type: 'resource'
                    },{
                        key: 'production event type',
                        path: 'production_type',
                        title: true,
                        type: 'resource'
                    },{
                        key: 'location of production event',
                        path: 'production_location',
                        type: 'resource'
                    },{
                        key: 'influenced on production event',
                        path: 'production_influence',
                        type: 'resource'
                    }],
                    parts: {
                        graph: 'production_part',
                        metadata:[{
                            key: 'creator of event',
                            path: 'production_part_carried out by',
                            type: 'resource'
                        },{
                            key: 'physical object used in production event',
                            path: 'production_part_used object',
                            type: 'resource'
                        },{
                            key: 'production event technique',
                            path: 'production_part_technique',
                            type: 'kv'
                        },{
                            key: 'production event type',
                            path: 'production_part_type',
                            title: true,
                            type: 'kv'
                        },{
                            key: 'location of production event',
                            path: 'production_part_location',
                            type: 'resource'
                        },{
                            key: 'influenced on production event',
                            path: 'production_part_influence',
                            type: 'resource'
                        }]
                    }
                },
                'destruction': { 
                    graph: 'destruction',
                    metadata: [{
                        key: 'location of destruction event',
                        path: 'destruction_location',
                        type: 'resource'
                    },{
                        key: 'destruction event type',
                        path: 'destruction_type',
                        type: 'kv'
                    }]
                }, 
                'removal from object': {
                    graph: 'removal from object',
                    metadata: [{
                        key: 'object removed by part removal event',
                        path: 'removal from object_removed from',
                        type: 'resource'
                    },{
                        key: 'person in part removal event',
                        path: 'removal from object_carried out by',
                        type: 'resource'
                    },{
                        key: 'removal from object event technique',
                        path: 'removal from object_technique',
                        type: 'kv'
                    },{
                        key: 'location of part removal event',
                        path: 'removal from object_location',
                        type: 'resource'
                    },{
                        key: 'influence on part removal event',
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
                        key: 'collection added to',
                        path: 'addition to collection_added to',
                        type: 'resource'
                    },{
                        key: 'addition event type',
                        path: 'addition to collection_type',
                        type: 'kv'
                    },{
                        key: 'person in removal event',
                        path: 'addition to collection_carried out by',
                        type: 'resource'
                    }]
                }, removal: {
                    graph:'removal from set',
                    metadata: [{
                        key: 'collection removed from',
                        path: 'removal from set_removed from',
                        type: 'resource'
                    },{
                        key: 'removal event type',
                        path: 'removal from set_type',
                        type: 'kv'
                    },{
                        key: 'person in removal event',
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

                if(self.cards?.['production event of object']) {
                    const productionEventChildren = self.cards['production event of object'].tiles()?.[0]?.cards ? self.cards['production event of object'].tiles()[0].cards : self.cards['production event of object'].cards();
                    self.cards['production event of object'].children = self.createCardDictionary(productionEventChildren);
                }

                self.nameCards = {
                    name: self.cards?.['name of object'],
                    identifier: self.cards?.['identifier of object'],
                    exactMatch: self.cards?.['external uri for object'],
                    type: self.cards?.['type of object']
                };

                self.descriptionCards = {
                    statement: self.cards?.['statement or interpretation about object']
                };

                self.documentationCards = {
                    digitalReference: self.cards?.['digital reference to object'],
                    subjectOf: self.cards?.['source reference work for object']
                };

                self.existenceCards = {
                    production: {
                        card: self.cards?.['production event of object'],
                        subCards: {
                            name: 'name of production event',
                            identifier: 'identifier of production event',
                            timespan: 'timespan of production event',
                            statement: 'statement about production event',
                            part: 'production event part'
                        },
                        partCards: { 
                            name: 'name for production event part',
                            identifier: 'identifier for production event part',
                            timespan: 'timespan of production event part',
                            statement: 'statement about production event part'
                        }
                    },
                    destruction: {
                        card:  self.cards?.['destruction event of object'],
                        subCards: {
                            name: 'name for destruction event',
                            identifier: 'identifier for destruction event',
                            timespan: 'timespan of destruction event',
                            statement: 'statement about destruction event'
                        }
                    },
                    'removal from object': { 
                        card: self.cards?.['part removal event of object'],
                        subCards: {
                            name: 'name for part removal event',
                            identifier: 'identifier for part removal event',
                            timespan: 'timespan of part removal event',
                            statement: 'statement about part removal event'
                        }
                    },
                };

                self.setCards = {
                    addition: {
                        card:  self.cards?.['addition event of object to collection'],
                        subCards: {
                            name: 'name for addition event',
                            identifier: 'identifier for addition event',
                            timespan: 'timespan of addition event',
                            statement: 'statement about addition event'
                        }
                    },
                    removal: {
                        card:  self.cards?.['removal event of object from collection'],
                        subCards: {
                            name: 'name for addition event',
                            identifier: 'identifier for addition event',
                            timespan: 'timespan of addition event',
                            statement: 'statement about addition event'
                        }
                    }
                };        

                self.substanceCards = {
                    dimension: self.cards?.['dimension of object']
                };

            }

            
            self.aboutnessData = ko.observable({
                sections: 
                    [
                        {
                            title: 'Content and Iconography', 
                            data: [{
                                key: 'text carried by object', 
                                value: self.getRawNodeValue(self.resource(), 'carries'), 
                                card: self.cards?.['text carried by object'],
                                type: 'resource'
                            }]
                        }
                    ]
            });            
            
            self.locationData = ko.observable({
                sections: 
                    [
                        {
                            title: 'Current Location of Object', 
                            data: [{
                                key: 'current location', 
                                value: self.getRawNodeValue(self.resource(), 'current location'), 
                                card: self.cards?.['current location of object'],
                                type: 'resource'
                            }]
                        }
                    ]
            });

            self.parthoodData = ko.observable({
                sections: 
                    [
                        {
                            title: 'Components', 
                            data: [{
                                key: 'parent object', 
                                value: self.getRawNodeValue(self.resource(), 'part of'), 
                                card: self.cards?.['parent object'],
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
                    card: self.cards?.['parts of object'],
                }: {};

            self.actorData = ko.observable({
                sections: 
                    [
                        {
                            title: 'Provenance', 
                            data: [{
                                key: 'current owner of object', 
                                value: self.getRawNodeValue(self.resource(), 'current owner'), 
                                card: self.cards?.['current owner of object'],
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
                            title: 'Related Collection and Sets',
                            data: [{
                                key: 'Collection Object is Part Of', 
                                value: self.getRawNodeValue(self.resource(), 'member of'), 
                                card: self.cards?.['collection object is part of'],
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
                return window.fetch(digitalServiceTile.data[digitalResourceServiceIdentifierContentNodeId][arches.activeLanguage]['value'])
                    .then(function(response){
                        if(response.ok) {
                            return response.json();
                        }
                    });
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