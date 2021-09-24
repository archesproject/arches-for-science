define([
    'jquery',
    'underscore', 
    'knockout', 
    'arches', 
    'utils/resource', 
    'utils/report', 
    'views/components/reports/scenes/name', 
    'views/components/reports/scenes/description', 
    'views/components/reports/scenes/documentation', 
    'views/components/reports/scenes/existence', 
    'views/components/reports/scenes/substance'], 
    function($, _, ko, arches, resourceUtils, reportUtils) {
    return ko.components.register('digital-resource-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);
            self.sections = [
                {'id': 'name', 'title': 'Names and Classifications'}, 
                {'id': 'existence', 'title': 'Existence'},
                {'id': 'substance', 'title': 'Substance'},
                {'id': 'description', 'title': 'Description'},
                {'id': 'documentation', 'title': 'Documentation'},
            ];
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
                'production': 'creation',
            };
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
                    name: self.cards.Name,
                    identifier: self.cards.Identifier,
                    exactMatch: self.cards.ExactMatch,
                    type: self.cards.Classification
                };

                self.descriptionCards = {
                    statement: self.cards['Statement']
                };

                self.substanceCards = {
                    dimension: self.cards.dimension
                };

                self.existenceCards = {
                    'production': { 
                        card: self.cards?.["production"],
                        subCards: {
                            name: 'name for creation event',
                            identifier: 'identifier for creation event',
                            timespan: 'timespan of creation event',
                            statement: 'statement about creation event',
                        }
                    },
                };
            }

            self.additionalData = ko.observableArray([{
                key: 'conforms to standard', 
                value: self.getNodeValue(self.resource(), 'conforms to'), 
                href: self.getNodeValue(self.resource(), 'conforms to'), 
                card: self.cards?.["conforms to standard"],
                type: 'href'
            }]);
        },
        template: { require: 'text!templates/views/components/reports/digital-resource.htm' }
    });
});
