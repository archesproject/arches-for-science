define([
    'jquery', 
    'underscore', 
    'knockout', 
    'arches', 
    'viewmodels/tabbed-report', 
    'utils/resource', 
    'utils/report', 
    'views/components/reports/scenes/name', 
    'views/components/reports/scenes/description', 
    'views/components/reports/scenes/documentation', 
    'views/components/reports/scenes/existence', 
    'views/components/reports/scenes/substance',  
    'views/components/reports/scenes/default', 
    'views/components/reports/scenes/actor-relations'
], 
    function($, _, ko, arches, TabbedReportViewModel, resourceUtils, reportUtils) {
    return ko.components.register('instrument-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);
            self.sections = [
                {'id': 'name', 'title': 'Names and Classifications'}, 
                {'id': 'existence', 'title': 'Existence'},
                {'id': 'substance', 'title': 'Substance'},
                {'id': 'actor-relations', 'title': 'Actor Relations'},
                {'id': 'location', 'title': 'Location'},
                {'id': 'parthood', 'title': 'Parthood'},
                {'id': 'sethood', 'title': 'Sethood'},
                {'id': 'description', 'title': 'Description'},
                {'id': 'documentation', 'title': 'Documentation'},
            ];
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('name');
            self.nameDataConfig = { 'exactMatch': undefined };
            self.documentationDataConfig = {
                'subjectOf': undefined, 
                'digitalReference': undefined
            };
            self.nameCards = {};
            self.descriptionCards = {}
            self.documentationCards = {};
            self.existenceCards = {};
            self.substanceCards = {};
            self.actorCards = {};

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards);

                self.nameCards = {
                    name: self.cards["Name of Thing"],
                    identifier: self.cards.Identifier,
                    exactMatch: self.cards.ExactMatch,
                    type: self.cards["Type of Object"]
                };

                self.descriptionCards = {
                    statement: self.cards['Statement about Thing']
                };
                self.substanceCards = {
                    dimension: self.cards.dimension
                }
            }

            self.locationData = ko.observable({
                sections: 
                    [
                        {
                            title: "Location", 
                            data: [{
                                key: 'current location', 
                                value: self.getRawNodeValue(self.resource(), 'current location'), 
                                card: self.cards?.['current location'],
                                type: 'resource'
                            }]
                        }
                    ]
            });

            self.parthoodData = ko.observable({
                sections: 
                    [
                        {
                            title: "Parthood", 
                            data: [{
                                key: 'part of larger object', 
                                value: self.getRawNodeValue(self.resource(), 'part of'), 
                                card: self.cards?.['part of larger object'],
                                type: 'resource'
                            }]
                        }
                    ]
            });


            self.actorData = ko.observable({
                sections: 
                    [
                        {
                            title: "Actor Relations", 
                            data: [{
                                key: 'current owner', 
                                value: self.getRawNodeValue(self.resource(), 'current owner'), 
                                card: self.cards?.['current owner'],
                                type: 'resource'
                            }]
                        }
                    ]
            });

            self.sethoodData = ko.observable({
                sections: 
                    [
                        {
                            title: "Sethood", 
                            data: [{
                                key: 'Member of Set', 
                                value: self.getRawNodeValue(self.resource(), 'member of'), 
                                card: self.cards?.['member of'],
                                type: 'resource'
                            }]
                        }
                    ]
            });
        },
        template: { require: 'text!templates/views/components/reports/instrument.htm' }
    });
});
