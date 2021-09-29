define([
    'jquery',
    'underscore',
    'knockout',
    'arches',
    'utils/resource',
    'utils/report'
], function($, _, ko, arches, resourceUtils, reportUtils) {
    return ko.components.register('person-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);
            self.sections = [
                {'id': 'name', 'title': 'Names and Classifications'},
                {'id': 'existence', 'title': 'Existence'},
                {'id': 'events', 'title': 'Events'},
                {'id': 'parthood', 'title': 'Parthood'},
                {'id': 'description', 'title': 'Description'},
                {'id': 'documentation', 'title': 'Documentation'},
                {'id': 'communication', 'title': 'Communication'},
                {'id': 'json', 'title': 'JSON'},
            ];
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('name');
            self.sourceData = ko.observable({
                sections:
                    [
                        {
                            title: "References",
                            data: [{
                                key: 'source reference work',
                                value: self.getRawNodeValue(self.resource(), 'source'),
                                type: 'resource'
                            }]
                        }
                    ]
            });

            self.nameDataConfig = {
                type: undefined,
            };
            self.documentationDataConfig = {
                subjectOf: undefined
            };
            self.existenceEvents = ['birth', 'death'];
            self.existenceDataConfig = {
                birth: {
                    graph: 'birth',
                    metadata: []
                },
                death: {
                    graph: 'death',
                    metadata: []
                },
            };
            self.nameCards = {};
            self.descriptionCards = {};
            self.documentationCards = {};
            self.existenceCards = {};
            self.summary = params.summary;

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards)

                self.nameCards = {
                    name: self.cards?.["name of person"],
                    identifier: self.cards?.["identifier for person"],
                    exactMatch: self.cards?.["external uri for person"],
                };

                self.descriptionCards = {
                    statement: self.cards?.["statement about person"],
                };

                self.documentationCards = {
                    digitalReference: self.cards?.["digital reference for person"],
                };

                self.existenceCards = {
                    birth: { 
                        card: self.cards?.["birth event of person"],
                        subCards: {
                            name: 'name for birth event',
                            timespan: 'timespan of birth event',
                            statement: 'statement about birth event',
                        }
                    },
                    death: {
                        card:  self.cards?.["death event of person"],
                        subCards: {
                            name: 'name for death event',
                            timespan: 'timespan of death event',
                            statement: 'statement about death event'
                        }
                    },
                };
            }

            self.parthoodData = ko.observable({
                sections: 
                    [
                        {
                            title: "Parthood", 
                            data: [{
                                key: 'member of group', 
                                value: self.getRawNodeValue(self.resource(), 'member of'), 
                                card: self.cards?.['group person is member'],
                                type: 'resource'
                            }]
                        }
                    ]
            });
        },
        template: { require: 'text!templates/views/components/reports/person.htm' }
    });
});
