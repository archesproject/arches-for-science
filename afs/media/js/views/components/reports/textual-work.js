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
                {'id': 'parthood', 'title': 'Parthood'},
                {'id': 'aboutness', 'title': 'Aboutness'},
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
                creation: {
                    graph: 'creation (partitioned)',
                    metadata: [{
                        key: 'Creation Event Type',
                        path: 'creation (partitioned)_type',
                        type: 'kv'
                    },{
                        key: 'Creator of Textual Work',
                        path: 'creation (partitioned)_carried out by',
                        type: 'resource'
                    },{
                        key: 'Creation Event Location',
                        path: 'creation (partitioned)_location',
                        type: 'resource'
                    }],
                    parts: {
                        graph: 'creation (partitioned)_part',
                        metadata:[{
                            key: 'Creation Event Part Type',
                            path: 'creation (partitioned)_part_type',
                            type: 'kv'
                        },{
                            key: 'Creator in Creation Event Part',
                            path: 'creation (partitioned)_part_carried out by',
                            type: 'resource'
                        },{
                            key: 'Creation Event Part Location',
                            path: 'creation (partitioned)_part_location',
                            type: 'resource'
                        }]
                    }
                }
            };
            self.existenceCards = {};
            self.eventEvents = ['publication'];
            self.eventDataConfig = {
                publication: {
                    graph: 'publication',
                    metadata: [{
                        key: 'Publication Event Type',
                        path: 'Publication_type',
                        type: 'kv'
                    },{
                        key: 'Particular Technique',
                        path: 'Publication_technique',
                        type: 'kv'
                    },{
                        key: 'Publication Event Location',
                        path: 'Publication_location',
                        type: 'resource'
                    }]
                }
            };
            self.eventCards = {};
            self.substanceCards = {};

            self.summary = params.summary;

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards);
                self.nameCards = {
                    name: self.cards?.['Textual Work Name'],
                    identifier: self.cards.Identifier,
                    exactMatch: self.cards?.['Textual Work Name'],
                    type: self.cards?.['classification'],
                };
                self.descriptionCards = {
                    statement: self.cards.Statement,
                };
                self.existenceCards = {
                    creation: { 
                        card: self.cards?.["creation event of textual work"],
                        subCards: {
                            name: 'name for creation event',
                            timespan: 'timespan for creation event',
                            statement: 'statement about creation',
                            part: 'creation event part'
                        },
                        partCards: {
                            name: 'name for creation event part',
                            statement: 'statement about creation event part',
                            timespan: 'timespan of creation event part',
                        }
                    },
                };
                self.eventCards = {
                    publication: {
                        card: self.cards?.["publication event of textual work"],
                        subCards: {
                            name: 'name for publication event',
                            statement: 'statement of publication event',
                            timespan: 'timespan of publication event',
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
                self.parthoodData = ko.observable({
                    sections: [
                        {
                            title: "Part of Text", 
                            data: [{
                                key: 'parent textual work', 
                                value: self.getRawNodeValue(self.resource(), 'part of'), 
                                card: self.cards?.['parent textual work'],
                                type: 'resource'
                            }]
                        }
                    ]
                });    
                self.aboutnessData = ko.observable({
                    sections: [
                        {
                            title: "Text Subjects", 
                            data: [{
                                key: 'subject(s) of textual work', 
                                value: self.getRawNodeValue(self.resource(), 'subject'), 
                                card: self.cards?.["subject(s) of textual work"],
                                type: 'resource'
                            }]
                        },
                        {
                            title: "Textual Referent", 
                            data: [{
                                key: 'source reference work of textual work', 
                                value: self.getRawNodeValue(self.resource(), 'is about'), 
                                card: self.cards?.["source reference work of textual work"],
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
