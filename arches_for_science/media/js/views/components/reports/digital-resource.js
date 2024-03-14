define([
    'jquery',
    'underscore', 
    'knockout', 
    'templates/views/components/reports/digital-resource.htm',
    'arches', 
    'utils/resource', 
    'utils/report', 
    'views/components/reports/scenes/name', 
    'views/components/reports/scenes/description', 
    'views/components/reports/scenes/documentation', 
    'views/components/reports/scenes/existence', 
    'views/components/reports/scenes/substance',
    'views/components/reports/scenes/json',  
    'views/components/reports/scenes/default'
], function($, _, ko, digitalResourceReportTemplate, arches, resourceUtils, reportUtils) {
    return ko.components.register('digital-resource-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);

            const cardIds = self.cardIds = Object.freeze({
                nameOfDigitalResource: 'd2fdae3d-ca7a-11e9-ad84-a4d18cec433a',
                identifierOfDigitalResource: 'db05b5ca-ca7a-11e9-82ca-a4d18cec433a',
                typeOfDigitalResource: '09c1778a-ca7b-11e9-860b-a4d18cec433a',
                statementAboutDigitalResource: 'da1fac57-ca7a-11e9-86a3-a4d18cec433a',
                dimensionOfDigitalResource: 'd816108a-ca7a-11e9-9ce8-a4d18cec433a',
                creationEventOfDigitalResource: 'de951c11-ca7a-11e9-a778-a4d18cec433a',
                filesOfDigitalResource: '7c486328-d380-11e9-b88e-a4d18cec433a',
                textCarriedByDigitalResource: 'a90b3a99-ca7a-11e9-8bc5-a4d18cec433a',
                collectionThatIncludesDigitalResource: 'e19aee91-ca7c-11e9-98d8-a4d18cec433a',
                digitalServiceOfDigitalResource: '29c8c76e-ca7c-11e9-9e11-a4d18cec433a',
                standardsConformedToByDigitalResource: 'a4af8528-ca7f-11e9-8f7b-a4d18cec433a',
                parentDigitalResource: '1b3d7f38-ca7b-11e9-ab2c-a4d18cec433a'
            });

            self.sections = [
                {id: 'name', title: arches.translations.namesClassifications},
                {id: 'existence', title: arches.translations.existence},
                {id: 'substance', title: arches.translations.substance},
                {id: 'events', title: arches.translations.events},
                {id: 'parthood', title: arches.translations.parthood},
                {id: 'sethood', title: arches.translations.sethood},
                {id: 'carriers', title: arches.translations.carriers},
                {id: 'aboutness', title: arches.translations.aboutness},
                {id: 'description', title: arches.translations.description},
                {id: 'documentation', title: arches.translations.documentation},
                {id: 'json', title: 'JSON'},
            ];

            self.filesTable = {
                ...self.defaultTableConfig,
                columns: Array(3).fill(null)
            };

            self.getTableConfig = (numberOfColumn) => {
                return {
                    ...self.defaultTableConfig,
                    columns: Array(numberOfColumn).fill(null),
                    columnDefs: []
                }
            };


            self.visible = { files: ko.observable(true) }
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('name');
            self.nameDataConfig = { exactMatch: undefined };
            self.documentationDataConfig = {
                'subjectOf': undefined, 
                'digitalReference': undefined
            };
            self.existenceDataConfig = {
                creation: {
                    graph: 'creation',
                    metadata: [{
                        nodeid: 'de954e91-ca7a-11e9-af76-a4d18cec433a',
                        path: 'creation_carried out by',
                        type: 'resource'
                    },{
                        nodeid: 'de955a05-ca7a-11e9-8f7a-a4d18cec433a',
                        path: 'creation_location',
                        type: 'resource'
                    },{
                        nodeid: 'de952c0c-ca7a-11e9-9fd3-a4d18cec433a',
                        path: 'creation_type',
                        type: 'resource'
                    },{
                        nodeid: 'de952e6e-ca7a-11e9-8e0a-a4d18cec433a',
                        path: 'creation_technique',
                        type: 'resource'
                    },{
                        nodeid: 'de954c14-ca7a-11e9-a427-a4d18cec433a',
                        path: 'creation_used object',
                        type: 'resource'
                    }]
                },
            };

            self.eventsDataConfig = {
                'digital service': {
                    graph: 'service',
                    metadata: [{
                        nodeid: 'cec360bd-ca7f-11e9-9ab7-a4d18cec433a',
                        path: 'service_conforms to',
                        type: 'resource'
                    },{
                        nodeid: '5ceedd21-ca7c-11e9-a60f-a4d18cec433a',
                        path: 'service_type',
                        type: 'resource'
                    }]
                },
            };
            self.existenceEvents = ['creation'];
            self.eventsEvents = ['digital service'];
            self.nameCards = {};
            self.descriptionCards = {}
            self.documentationCards = {};
            self.substanceCards = {};
            self.existenceCards = {};
            self.summary = params.summary;

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards)
                self.nameCards = {
                    name: self.cards?.[cardIds.nameOfDigitalResource],
                    identifier: self.cards?.[cardIds.identifierOfDigitalResource],
                    type: self.cards?.[cardIds.typeOfDigitalResource]
                };

                self.descriptionCards = {
                    statement: self.cards[cardIds.statementAboutDigitalResource]
                };

                self.substanceCards = {
                    dimension: self.cards?.[cardIds.dimensionOfDigitalResource]
                };

                self.eventsCards = {
                    'digital service': {
                        card: self.cards?.[cardIds.digitalServiceOfDigitalResource]
                    }
                };

                self.existenceCards = {
                    creation: {
                        card: self.cards?.[cardIds.creationEventOfDigitalResource],
                        subCards: {
                            name: 'de950826-ca7a-11e9-9e62-a4d18cec433a',
                            identifier: 'de951321-ca7a-11e9-86e2-a4d18cec433a',
                            timespan: 'de952085-ca7a-11e9-a7dc-a4d18cec433a',
                            statement: 'ef5c1e19-ca7a-11e9-bccf-a4d18cec433a',
                        }
                    },
                };
            }

            self.aboutnessData = ko.observable({
                sections: 
                    [
                        {
                            title: arches.translations.aboutness,
                            data: [{
                                key: self.cards?.[cardIds.textCarriedByDigitalResource].model.name(), 
                                value: self.getRawNodeValue(self.resource(), 'carries text'), 
                                card: self.cards?.[cardIds.textCarriedByDigitalResource],
                                type: 'resource'
                            }]
                        }
                    ]
            });       


            self.parthoodData = ko.observable({
                sections: 
                    [
                        {
                            title: arches.translations.parthood,
                            data: [{
                                key: self.cards?.[cardIds.parentDigitalResource].model.name(), 
                                value: self.getRawNodeValue(self.resource(), 'part of'), 
                                type: 'resource'
                            }]
                        }
                    ]
            });

            self.files = ko.observableArray(
                self.getRawNodeValue(self.resource(), 'file')?.map(x => {
                    const name =  self.getNodeValue(x, 'file_details', 0, 'name');
                    const tileid =  self.getTileId(x);
                    const metadataExists = self.nestedDataExists(x, '@node_id', '@tile_id', 'file_details');
                    return {name, metadataExists, tileid}
                }
            ));

            self.sethoodData = ko.observable({
                sections: 
                    [
                        {
                            title: arches.translations.sethood,
                            data: [{
                                key: self.cards?.[cardIds.collectionThatIncludesDigitalResource].model.name(), 
                                value: self.getRawNodeValue(self.resource(), 'member of'), 
                                card: self.cards?.[cardIds.collectionThatIncludesDigitalResource],
                                type: 'resource'
                            }]
                        }
                    ]
            });

            self.additionalData = ko.observableArray([{
                key: self.cards?.[cardIds.standardsConformedToByDigitalResource].model.name(), 
                value: self.getNodeValue(self.resource(), 'conforms to'), 
                href: self.getNodeValue(self.resource(), 'conforms to'), 
                card: self.cards?.[cardIds.standardsConformedToByDigitalResource],
                type: 'href'
            }]);

            // Summary report
            self.nameSummary = ko.observable();
            self.statementsSummary = ko.observable();

            const thumbnailUrl = `/thumbnail/${params.report.report_json.resourceinstanceid}`;
            self.thumbnail = ko.observable();

            fetch(thumbnailUrl, {method: 'HEAD'}).then(resp => { 
                if (resp.ok) {
                    self.thumbnail(thumbnailUrl);
                }
            });

            const nameData = [self.getRawNodeValue(self.resource()?.name)];
            if (nameData) {
                self.nameSummary(nameData.map(x => {
                    const type = self.getNodeValue(x, 'name_type');
                    const content = self.getNodeValue(x, 'name_content');
                    return { type, content }
                }));
            };

            const statementData = self.getRawNodeValue(self.resource()?.statement);
            if (statementData) {
                self.statementsSummary(statementData.map(x => {
                    const type = self.getNodeValue(x, 'Statement_type');
                    const content = self.getNodeValue(x, 'Statement_content');
                    return { type, content }
                }));
            };
        },
        template: digitalResourceReportTemplate
    });
});
