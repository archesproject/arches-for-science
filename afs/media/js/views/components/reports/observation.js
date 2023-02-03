define([
    'jquery',
    'underscore',
    'knockout',
    'templates/views/components/reports/observation.htm',
    'arches',
    'utils/resource',
    'utils/report',
    'views/components/reports/scenes/name',
    'views/components/reports/scenes/json' 
], function($, _, ko, observationReportTemplate, arches, resourceUtils, reportUtils) {
    return ko.components.register('observation-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);
            self.sections = [
                {id: 'name', title: 'Names, Identifiers, Classification'},
                {id: 'description', title: 'Description'},
                {id: 'substance', title: 'Dates'},
                {id: 'data', title: 'Data'},
                {id: 'parthood', title: 'Parent Project'},
                {id: 'objects', title: 'Related Objects'},
                {id: 'documentation', title: 'Documentation'},
                {id: 'json', title: 'JSON'},
            ];
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('name');
            self.nameDataConfig = {
                exactMatch: undefined,
            };
            self.documentationDataConfig = {
                'subjectOf': undefined,
                'label': undefined
            };
            self.substanceDataConfig = {
                dimension: undefined,
                timespan: {path: 'timespan', key: 'timespan of observation'}
            };
            self.nameCards = {};
            self.descriptionCards = {};
            self.documentationCards = {};
            self.substanceCards = {};
            self.summary = params.summary;

            self.relatedObjectsTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(3).fill(null)
            };

            self.collectionOfRelatedObjects = ko.observableArray();
            self.visible = {
                relatedObjects: ko.observable(true),
            };

            const resourceId = ko.unwrap(self.reportMetadata).resourceinstanceid;
            const loadRelatedResources = async() => {
                const physicalThingGraphId = '9519cb4f-b25b-11e9-8c7b-a4d18cec433a';
                const digitalResourceGraphId = "707cbd78-ca7a-11e9-990b-a4d18cec433a";
                const typeNodeId = '8ddfe3ab-b31d-11e9-aff0-a4d18cec433a'
                const partOfNodeId = 'f8d5fe4c-b31d-11e9-9625-a4d18cec433a'
                const smapleConceptIds = ['77d8cf19-ce9c-4e0a-bde1-9148d870e11c'] // sample

                const result = await reportUtils.getRelatedResources(resourceId);
                const relatedPhysicalThings = result?.related_resources.filter(resource => 
                    resource?.graph_id === physicalThingGraphId);
                const relatedDigitalResources = result?.related_resources.filter(resource => 
                    resource?.graph_id === digitalResourceGraphId);
    
                self.collectionOfRelatedObjects(relatedPhysicalThings.map(element => {
                    element.link = reportUtils.getResourceLink({resourceId: element.resourceinstanceid}),
                    element.displaydescription = reportUtils.stripTags(element.displaydescription)
                    return element
                }));

                self.annotations = []

                /* If the observation is for a areas
                There can be more than one geometry */
                relatedDigitalResources.map(async (resource) => {
                    const digitalRessourceRelResources = await reportUtils.getRelatedResources(resource.resourceinstanceid);
                    const areaPhysicalThing = digitalRessourceRelResources?.related_resources.find((rr) => rr.graph_id == physicalThingGraphId);
                    const areaPhysicalThingResourceId = areaPhysicalThing?.resourceinstanceid;

                    if (areaPhysicalThing) {
                        const partentPhysicalThingResourceId = areaPhysicalThing?.tiles.find(
                            tile => tile.data[partOfNodeId]).data[partOfNodeId][0].resourceId;

                        let parts;
                        if (partentPhysicalThingResourceId) {
                            let parentResource;
                            await window.fetch(arches.urls.api_resources(partentPhysicalThingResourceId) + '?format=json&compact=false&v=beta')
                                .then(response => response.json())
                                .then(data => { parentResource = data.resource; })

                            parts = self.getRawNodeValue(parentResource, 'part identifier assignment').filter(
                                x => self.getRawNodeValue(x, 'part identifier assignment_physical part of object', 'resourceId') == areaPhysicalThingResourceId
                            )
                        }
                        
                        const annotation = parts ? {
                                info: parts.map((x => {
                                    const column1 = self.getNodeValue(x, 'part identifier assignment_label'); // label/name
                                    const column2 = self.getRawNodeValue(x, 'part identifier assignment_physical part of object'); // object part
                                    const column3 = self.getRawNodeValue(x, 'part identifier assignment_annotator'); //annotator
                                    const tileId = self.getTileId(x);
                                    const featureCollection = self.getNodeValue(x, 'part identifier assignment_polygon identifier');
                                    for (feature of featureCollection.features){
                                        feature.properties.tileId = tileId;
                                    }
                                    return {column1, column2, column3, tileId, featureCollection}
                                })),
                            }: {};

                        const annotationTableConfig = {
                            ...self.defaultTableConfig,
                            columns: Array(4).fill(null)
                        };
            
                        const annotationTableHeader =
                            `<tr class="afs-table-header">
                                <th>Area Name</th>
                                <th>Part of Object</th>
                                <th class="min-tabletl">Annotator</th>
                                <th class="afs-table-control all"></th>
                            </tr>`

                        const selectedAnnotationTileId = ko.observable();

                        self.annotations.push({annotation, annotationTableConfig, selectedAnnotationTileId, annotationTableHeader})
                    }
                });

                /* If the observation is from a sample
                There should be one geometry and table isn't necessary */
                const samplePhysicalThing = relatedPhysicalThings.find(thing => 
                    (!!thing.tiles.find(tile => (
                        tile.data[typeNodeId] && 
                        tile.data[typeNodeId].filter(x => smapleConceptIds.includes(x)).length > 0)
                    ))
                );
                
                const samplePhysicalThingResourceId = samplePhysicalThing?.resourceinstanceid;
                const sampleingActivityGraphId = "03357848-1d9d-11eb-a29f-024e0d439fdb";

                if (samplePhysicalThingResourceId) {
                    const sampleRelatedResources = await reportUtils.getRelatedResources(samplePhysicalThingResourceId);
                    const sampleingActivityResource = sampleRelatedResources?.related_resources.find(resource => 
                        resource?.graph_id === sampleingActivityGraphId
                    );
                    const samplingUnitTiles = sampleingActivityResource?.tiles.filter((tile) => {
                        return tile.nodegroup_id == 'b3e171a7-1d9d-11eb-a29f-024e0d439fdb' && 
                        tile.data['b3e171ab-1d9d-11eb-a29f-024e0d439fdb'][0]['resourceId'] == samplePhysicalThingResourceId
                    });

                    const annotation = samplingUnitTiles ? {
                        info: samplingUnitTiles.map((tile => {
                            const column1 = samplePhysicalThing.displayname;
                            const tileId = tile.tileid;
                            const featureCollection = tile.data['b3e171ae-1d9d-11eb-a29f-024e0d439fdb'];
                            for (feature of featureCollection.features){
                                feature.properties.tileId = tileId;
                            }
                            return {column1, tileId, featureCollection}
                        })),
                    }: {};

                    const selectedAnnotationTileId = ko.observable();
                    const annotationTableConfig = undefined;
                    const annotationTableHeader = undefined;

                    self.annotations.push({annotation, annotationTableConfig, selectedAnnotationTileId, annotationTableHeader})
                }
            };

            loadRelatedResources();

            //Summary Report
            self.getTableConfig = (numberOfColumn) => {
                return {
                    ...self.defaultTableConfig,
                    columns: Array(numberOfColumn).fill(null),
                    columnDefs: []
                }
            };

            self.timespanTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(4).fill(null),
                columnDefs: [],
                ordering: false,
            }

            self.nameSummary = ko.observable();
            self.statementSummary = ko.observable();
            self.objectObservedSummary = ko.observable();
            self.procedureSummary = ko.observable();
            self.personSummary = ko.observable();
            self.timeSpanSummary = ko.observable();

            self.nameSummary(self.resource()['Name']?.map(x => {
                const content = self.getNodeValue(x, 'name_content');
                const type = self.getNodeValue(x, 'name_type');
                return {content, type}
            }));

            self.statementSummary(self.resource()['Statement']?.map(x => {
                const content = self.getNodeValue(x, 'statement_content');
                const type = self.getNodeValue(x, 'statement_type');
                return {content, type}
            }));

            self.objectObservedSummary(self.getResourceListNodeValue(self.resource(), 'observed'));
            self.personSummary(self.getResourceListNodeValue(self.resource(), 'carried out by'));

            const procedure = self.getRawNodeValue(self.resource(), 'used process');
            if (procedure) {
                displayValue = self.getNodeValue(self.resource(), 'used process');
                link = self.getResourceLink(self.getRawNodeValue(self.resource(), 'used process'));
                self.procedureSummary({displayValue, link});
            }

            const timespan = self.getRawNodeValue(self.resource(), 'timespan');
            if (timespan) {
                const earliestBegin = self.getNodeValue(timespan, 'TimeSpan_begin of the begin');
                const lastestBegin = self.getNodeValue(timespan, 'TimeSpan_begin of the end');
                const earliestEnd = self.getNodeValue(timespan, 'TimeSpan_end of the begin');
                const lastestEnd = self.getNodeValue(timespan, 'TimeSpan_end of the end');
                self.timeSpanSummary({earliestBegin, lastestBegin, earliestEnd, lastestEnd})
            }

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards)

                self.nameCards = {
                    name: self.cards?.['name of observation'],
                    identifier: self.cards?.['identifier of observation'],
                    type: self.cards?.['type of observation']
                }

                self.descriptionCards = {
                    statement: self.cards?.['statement about observation'],
                };

                self.documentationCards = {
                    digitalReference: self.cards?.['digital reference to observation'],
                };

                self.substanceCards = {
                    timespan: self.cards?.['timespan of observation'],
                };
            };

            self.parthoodData = ko.observable({
                sections: 
                    [
                        {
                            title: 'Parent Event',
                            data: [{
                                key: 'parent event of observation', 
                                value: self.getRawNodeValue(self.resource(), 'part of'), 
                                card: self.cards?.['parent event of observation'],
                                type: 'resource'
                            }]
                        }
                    ]
            });

            self.dataData = ko.observable({
                sections: 
                    [
                        {
                            title: 'Recorded Value',
                            data: [{
                                key: 'recorded value of observation', 
                                value: self.getRawNodeValue(self.resource(), 'recorded value'), 
                                card: self.cards?.['recorded value of observation'],
                                type: 'resource'
                            }]
                        }
                    ]
            });

            self.descriptionData = ko.observable({
                sections: 
                    [
                        {
                            title: 'Parameters & Outcomes', 
                            data: [{
                                key: 'technique of observation', 
                                value: self.getRawNodeValue(self.resource(), 'technique'), 
                                card: self.cards?.['technique of observation'],
                                type: 'resource'
                            },{
                                key: 'location of observation', 
                                value: self.getRawNodeValue(self.resource(), 'took place at'), 
                                card: self.cards?.['location of observation'],
                                type: 'resource'
                            },{
                                key: 'procedure / method used during observation', 
                                value: self.getRawNodeValue(self.resource(), 'used process'), 
                                card: self.cards?.['parent event of observation'],
                                type: 'resource'
                            },{
                                key: 'person carrying out observation', 
                                value: self.getRawNodeValue(self.resource(), 'carried out by'), 
                                card: self.cards?.['person carrying out observation'],
                                type: 'resource'
                            },{
                                key: 'instrument / tool used for observation', 
                                value: self.getRawNodeValue(self.resource(), 'used instrument'), 
                                card: self.cards?.['instrument/tool used for observation'],
                                type: 'resource'
                            },{
                                key: 'digital resource used in observation', 
                                value: self.getRawNodeValue(self.resource(), 'used digital resource'), 
                                card: self.cards?.['digital resource used in observation'],
                                type: 'resource'
                            }]
                        }
                    ]
            });
        },
        
        template: observationReportTemplate
    });
});
