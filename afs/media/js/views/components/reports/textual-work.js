define([
    'jquery',
    'underscore',
    'knockout',
    'arches',
    'utils/resource',
    'utils/report',
    'views/components/reports/scenes/name'
], function($, _, ko, arches, resourceUtils, reportUtils) {
    return ko.components.register('textual-work-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);
            self.sections = [
                {'id': 'name', 'title': 'Names and Classifications'},
                {'id': 'existence', 'title': 'Existence'},
                {'id': 'substance', 'title': 'Substance'},
                {'id': 'event', 'title': 'Event'},
                {'id': 'description', 'title': 'Description'},
                {'id': 'documentation', 'title': 'Documentation'},
            ];
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('name');
            self.nameDataConfig = {
                name: "Name (top)",
                exactMatch: undefined
            };
            self.nameCards = {};
            self.descriptionDataConfig = {
                statement: "Statement (top)",
            };
            self.descriptionCards = {};
            self.documentationDataConfig = {
                subjectOf: "is about",
            };
            self.documentationCards = {};
            self.existenceEvents = ['creation'];
            self.existenceDataConfig = {
                'creation': 'Creation (partitioned)',
            };
            self.existenceCards = {};
            self.substanceCards = {};

            self.summary = params.summary;

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards)
                self.nameCards = {
                    name: self.cards?.['Textual Work Name'],
                    identifier: self.cards.Identifier,
                    exactMatch: self.cards?.['Textual Work Name'],
                    type: self.cards?.['classification'],
                }

                self.descriptionCards = {
                    statement: self.cards.Statement,
                };
                self.existenceCards = {
                    'creation': { 
                        card: self.cards?.["creation event of textual work"],
                        subCards: {
                            name: 'name for creation event',
                            timespan: 'timespan of creation event',
                            statement: 'statement about creation event',
                            part: 'creation event part'
                        }
                    },
                };
                self.substanceData = ko.observable({
                    sections: [
                        {
                            title: "Language", 
                            data: [{
                                key: 'language of textual work', 
                                value: self.getRawNodeValue(self.resource(), 'language'), 
                                card: self.cards?.['language of textual work'],
                                type: 'resource'
                            }]
                        },
                        {
                            title: "Text Content", 
                            data: [{
                                key: 'content of textual work', 
                                value: self.getRawNodeValue(self.resource(), 'content'), 
                                card: self.cards?.['content of textual work'],
                                type: 'resource'
                            }]
                        }
                    ]
                });
            }
        },
        template: { require: 'text!templates/views/components/reports/textual-work.htm' }
    });
});
