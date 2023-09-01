define([
    'jquery',
    'underscore',
    'knockout',
    'templates/views/components/reports/group.htm',
    'arches',
    'utils/resource',
    'utils/report',
    'views/components/reports/scenes/name',
    'views/components/reports/scenes/communication'
], function($, _, ko, groupReportTemplate, arches, resourceUtils, reportUtils) {
    return ko.components.register('group-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);
            self.sections = [
                {id: 'name', title: 'Names, Identifiers, Classifications'},
                {id: 'description', title: 'Description'},
                {id: 'existence', title: 'Timeline'},
                {id: 'location', title: 'Location'},
                {id: 'documentation', title: 'Documentation'},
                {id: 'communication', title: 'Contacts'},
                {id: 'members', title: 'Group Members'},
                {id: 'entities', title: 'Larger Entities'},
                {id: 'json', title: 'JSON'}
            ];
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('name');
            self.sourceData = ko.observable({
                sections:
                    [
                        {
                            title: 'References',
                            data: [{
                                key: 'source reference work',
                                value: self.getRawNodeValue(self.resource(), 'source'),
                                type: 'resource'
                            }]
                        }
                    ]
            });

            self.nameDataConfig = {
                exactMatch: 'exact match',
            };
            self.documentationDataConfig = {
                subjectOf: undefined,
                label: undefined
            };

            self.existenceEvents = ['formation', 'dissolution'];
            self.existenceDataConfig = {
                formation: {
                    graph: 'formation', 
                    metadata: [{
                        key: 'person in formation event',
                        path: 'formation_carried out by',
                        type: 'resource'
                    },{
                        key: 'location of formation event',
                        path: 'formation_location',
                        type: 'resource'
                    }]
                },
                dissolution: {
                    graph: 'dissolution',
                    metadata: [{
                        key: 'source reference for dissolution event',
                        path: 'dissolution_source',
                        type: 'resource'
                    },{
                        key: 'location of dissolution event',
                        path: 'dissolution_location',
                        type: 'resource'
                    }]
                },
            };

            self.eventEvents = ['professional activity'];
            self.eventDataConfig = {
                'professional activity': {
                    graph: 'professional activity', 
                    metadata: [{
                        key: 'professional activity type',
                        path: 'professional activity_type',
                        type: 'kv'
                    },{
                        key: 'location of professional activity',
                        path: 'professional activity_location',
                        type: 'resource'
                    },{
                        key: 'source reference work for professional activity',
                        path: 'professional activity_source',
                        type: 'resource'
                    }]
                },
            };

            self.nameCards = {};
            self.descriptionCards = {};
            self.documentationCards = {};
            self.existenceCards = {};
            self.eventCards = {};
            self.communicationCards = {};
            self.summary = params.summary;

            //Summary Report
            self.nameSummary = ko.observable();
            self.parentGroupSummary = ko.observable();
            self.locationSummary = ko.observable();
            self.activitySummary = ko.observable();
            self.identifierSummary = ko.observable();

            self.nameSummary(self.resource()['name']?.map(x => {
                const content = self.getNodeValue(x, 'name_content');
                const type = self.getNodeValue(x, 'name_type');
                return {content, type}
            }));

            self.parentGroupSummary(self.getResourceListNodeValue(self.resource(), 'member of'));

            self.locationSummary(self.getResourceListNodeValue(self.resource(), 'residence'));

            self.activitySummary(self.resource()['professional activity']?.map(x => {
                const type = self.getNodeValue(x, 'professional activity_type');
                const technique = self.getNodeValue(x, 'professional activity_technique');
                const locations = self.getResourceListNodeValue(x, 'professional activity_location');
                const sources = self.getResourceListNodeValue(x, 'professional activity_source');
                return {type, technique, locations, sources}
            }));

            self.identifierSummary(self.resource()['identifier']?.map(x => {
                const content = self.getNodeValue(x, 'identifier_content');
                const type = self.getNodeValue(x, 'identifier_type');
                return {content, type}
            }));

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards)

                self.nameCards = {
                    name: self.cards?.['name of group'],
                    identifier: self.cards?.['identifier of group'],
                    exactMatch: self.cards?.['external uri of group'],
                    type: self.cards?.['type of group']
                };

                self.descriptionCards = {
                    statement: self.cards?.['statement about group'],
                };

                self.documentationCards = {
                    digitalReference: self.cards?.['digital reference to group'],
                };                
                
                self.communicationCards = {
                    contactPoints: self.cards?.['address or contact point of group'],
                };

                self.existenceCards = {
                    formation: { 
                        card: self.cards?.['formation event of group'],
                        subCards: {
                            name: 'name for formation event',
                            identifier: 'identifier for formation event',
                            timespan: 'timespan of formation event',
                            statement: 'statement about formation event',
                        }
                    },
                    dissolution: {
                        card:  self.cards?.['dissolution event of group'],
                        subCards: {
                            name: 'name for formation event',
                            identifier: 'identifier for dissolution event',
                            timespan: 'timespan of dissolution event',
                            statement: 'statement about dissolution event'
                        }
                    },
                };


                self.eventCards = {
                    'professional activity': { 
                        card: self.cards?.['professional activity group known for'],
                        subCards: {
                            name: 'name for professional activity',
                            identifier: 'identifier for professional activity',
                            timespan: 'timespan of professional activity',
                            statement: 'statement about professional activity',
                        }
                    },
                };
            }
            
            self.locationData = ko.observable({
                sections: 
                    [
                        {
                            title: 'Location', 
                            data: [{
                                key: 'residence or associated location of group', 
                                value: self.getRawNodeValue(self.resource(), 'residence'), 
                                card: self.cards?.['residence or associated location of group'],
                                type: 'resource'
                            }]
                        }
                    ]
            });

            self.parthoodData = ko.observable({
                sections: 
                    [
                        {
                            title: 'Parthood', 
                            data: [{
                                key: 'parent group', 
                                value: self.getRawNodeValue(self.resource(), 'member of'), 
                                card: self.cards?.['parent group'],
                                type: 'resource'
                            }]
                        }
                    ]
            });

            self.groupMemberTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(4).fill(null)
            };

            self.getTableConfig = (numberOfColumn) => {
                return {
                    ...self.defaultTableConfig,
                    columns: Array(numberOfColumn).fill(null),
                    columnDefs: []
                }
            };

            self.collectionOfGroupMembers = ko.observableArray();
            self.collectionOfLargerEntities = ko.observableArray();
            self.visible = {
                groupMembers: ko.observable(true),
                largerEntities: ko.observable(true),
            };

            const resourceId = ko.unwrap(self.reportMetadata).resourceinstanceid;
            const loadRelatedResources = async() => {
                const result = await reportUtils.getRelatedResources(resourceId);
                const relatedResources = result?.related_resources;
                const parents = result?.resource_relationships.map(relationship => relationship.resourceinstanceidto);
                const children = result?.resource_relationships.map(relationship => relationship.resourceinstanceidfrom);
                const groupGraphID = '07883c9e-b25c-11e9-975a-a4d18cec433a';
                const personGraphID = 'f71f7b9c-b25b-11e9-901e-a4d18cec433a';

                let relatedPeopleandGroups = relatedResources.filter(resource => resource?.graph_id === personGraphID || resource?.graph_id === groupGraphID);
                relatedPeopleandGroups.map(element => {
                    element.link = reportUtils.getResourceLink({resourceId: element.resourceinstanceid}),
                    element.resourceType = result?.node_config_lookup[element.graph_id].name,
                    element.displaydescription = reportUtils.stripTags(element.displaydescription)
                    return element
                });

                self.collectionOfGroupMembers(relatedPeopleandGroups.filter(relatedPersonGroup => 
                    children.includes(relatedPersonGroup.resourceinstanceid)));
                self.collectionOfLargerEntities(relatedPeopleandGroups.filter(relatedPersonGroup => 
                    parents.includes(relatedPersonGroup.resourceinstanceid)));
            };

            loadRelatedResources();
        },
        template: groupReportTemplate
    });
});
