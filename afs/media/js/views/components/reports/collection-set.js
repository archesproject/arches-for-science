define([
    'jquery',
    'underscore',
    'knockout',
    'templates/views/components/reports/collection-set.htm',
    'arches',
    'utils/resource',
    'utils/report',
    'views/components/reports/scenes/name'
], function($, _, ko, collectionSetSceneTemplate, arches, resourceUtils, reportUtils) {
    return ko.components.register('collection-set-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);
            self.sections = [
                {id: 'name', title: 'Names, Identifiers, Classification'},
                {id: 'description', title: 'Description'},
                {id: 'existence', title: 'Timeline'},
                {id: 'events', title: 'Events'},
                {id: 'projects', title: 'Related Projects'},
                {id: 'publications', title: 'Publications'},
                {id: 'documentation', title: 'Documentation'},
                {id: 'json', title: 'JSON'},
            ];
            self.visible = {
                textualReference: ko.observable(true),
                relatedProject: ko.observable(true),
            };
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('name');
            self.nameDataConfig = {
                exactMatch: undefined
            };
            self.documentationDataConfig = {
                subjectOf: undefined,
                label: undefined // set to undefined per airtable - not visible
            };
            self.existenceEvents = ['creation'];
            self.existenceDataConfig = {
                creation: { 
                    graph: 'created',
                    metadata: [{
                        key: 'creator',
                        path: 'created_carried out by',
                        type: 'resource'
                    },{
                        key: 'creation event location',
                        path: 'created_location',
                        type: 'resource'
                    },{
                        key: 'creation event type',
                        path: 'created_type',
                        type: 'resource'
                    }]}
            };


            self.eventEvents = ['curation'];
            self.eventDataConfig = {
                curation: { 
                    graph: 'curation',
                    metadata: [{
                        key: 'person in curation event',
                        path: 'curation_carried out by',
                        type: 'resource'
                    },{
                        key: 'location of curation event',
                        path: 'curation_location',
                        type: 'resource'
                    },{
                        key: 'curation event type',
                        path: 'curation_type',
                        type: 'kv'
                    }]}
            };
            self.nameCards = {};
            self.descriptionCards = {};
            self.documentationCards = {};
            self.existenceCards = {};
            self.eventCards = {};
            self.summary = params.summary;

            self.textualReferenceTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(3).fill(null)
            }

            self.relatedProjectTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(2).fill(null)
            };

            self.textualReference = ko.observableArray();
            const textualReferenceNode = self.getRawNodeValue(self.resource(), 'textual reference');
            if(Array.isArray(textualReferenceNode)){
                self.textualReference(textualReferenceNode.map(node => {
                    const textualSource = self.getNodeValue(node, 'textual source');
                    const textualSourceLink = self.getResourceLink(self.getRawNodeValue(node, 'textual source'));
                    const textualReferenceType = self.getNodeValue(node, 'textual reference type');
                    const tileid = self.getTileId(node);
                    return {textualSource, textualSourceLink, textualReferenceType, tileid};
                }));
            }

            self.relatedProject = ko.observableArray();
            const relatedProjectNode = self.getRawNodeValue(self.resource(), 'used in');
            if(relatedProjectNode) {
                self.relatedProjectTileid = self.getTileId(relatedProjectNode);
                self.relatedProject(self.getRawNodeValue(relatedProjectNode, 'instance_details').map(detail => {
                    const displayname = self.getNodeValue(detail);
                    const link = self.getResourceLink(self.getRawNodeValue(detail));
                    return {displayname, link};
                }));
            }
            //Summary Report
            self.getTableConfig = (numberOfColumn) => {
                return {
                    ...self.defaultTableConfig,
                    columns: Array(numberOfColumn).fill(null),
                    columnDefs: []
                }
            };

            self.nameSummary = ko.observable();
            self.typeSummary = ko.observable();
            self.relatedProjectSummary = ko.observable();
            self.statementSummary = ko.observable();

            self.nameSummary(self.resource()['Name']?.map(x => {
                const content = self.getNodeValue(x, 'name_content');
                const type = self.getNodeValue(x, 'name_type');
                return {content, type}
            }));

            self.relatedProjectSummary(self.getResourceListNodeValue(self.resource(), 'used in'));

            const type = self.getNodeValue(self.resource(), 'type');
            if (type && type != '--') {
                self.typeSummary({
                    type: self.getNodeValue(self.resource(), 'type')
                });
            } 

            const statement = self.getNodeValue(self.resource(), 'statement', 'statement_content');
            if (statement && statement != '--') {
                self.statementSummary({
                    content: statement,
                    type: self.getNodeValue(self.resource(), 'statement', 'statement_type')
                });
            } 

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards)

                self.nameCards = {
                    name: self.cards?.['name of collection'],
                    identifier: self.cards?.['identifier of collection'],
                    type: self.cards?.['type of collection']
                };
                
                self.descriptionCards = {
                    statement: self.cards?.['statement about collection'],
                };
                
                self.documentationCards = {
                    digitalReference: self.cards?.['digital reference to collection'],
                };

                self.existenceCards = {
                    creation: {
                        card: self.cards?.['creation event of collection'],
                        subCards: {
                            name: 'name for creation event',
                            identifier: 'identifier of creation event',
                            timespan: 'timespan of creation event',
                            statement: 'statement about creation event',
                        }
                    },
                };

                self.eventCards = {
                    curation: {
                        card: self.cards?.['curation event of collection'],
                        subCards: {
                            name: 'name for curation event',
                            identifier: 'identifier of curation event',
                            timespan: 'timespan of curation event',
                            statement: 'statement about curation event',
                        }
                    },
                };
            }
        },
        template: collectionSetSceneTemplate
    });
});
