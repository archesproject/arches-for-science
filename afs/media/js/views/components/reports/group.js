define([
    'jquery',
    'underscore',
    'knockout',
    'arches',
    'utils/resource',
    'utils/report',
    'views/components/reports/scenes/name'
], function($, _, ko, arches, resourceUtils, reportUtils) {
    return ko.components.register('group-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);
            self.sections = [
                {'id': 'name', 'title': 'Names and Classifications'},
                {'id': 'existence', 'title': 'Existence'},
                {'id': 'description', 'title': 'Description'},
                {'id': 'documentation', 'title': 'Documentation'},
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
                exactMatch: 'exact match',
            };
            self.documentationDataConfig = {
                subjectOf: undefined
            };
            self.existenceEvents = ['formation', 'dissolution'];
            self.existenceDataConfig = {
                'formation': 'formation',
                'dissolution': 'dissolution',
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
                    name: self.cards?.["group name"],
                    identifier: self.cards?.["identifier"],
                    exactMatch: self.cards?.["uri in external list"],
                    type: self.cards?.["type of group"]
                };

                self.descriptionCards = {
                    statement: self.cards?.["group description or statement"],
                };

                self.documentationCards = {
                    label: self.cards?.["internal label"],
                    digitalReference: self.cards?.["digital reference"],
                };

                self.existenceCards = {
                    'formation': { 
                        card: self.cards?.["formation"],
                        subCards: {
                            name: 'name for group formation event',
                            identifier: 'identifier for group formation event',
                            timespan: 'timespan of group formation event',
                            statement: 'statement about group formation event',
                        }
                    },
                    'dissolution': {
                        card:  self.cards?.["dissolution"],
                        subCards: {
                            name: 'name for group dissolution event',
                            identifier: 'identifier for group dissolution event',
                            timespan: 'timespan of group dissolution event',
                            statement: 'statement about group dissolution event'
                        }
                    },
                };
            }
        },
        template: { require: 'text!templates/views/components/reports/group.htm' }
    });
});
