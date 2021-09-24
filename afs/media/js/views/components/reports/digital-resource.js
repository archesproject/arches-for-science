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
                'creation': {
                    graph: 'creation',
                    metadata: [{
                        key: 'creator',
                        path: 'creation_carried out by',
                        type: 'resource'
                    },{
                        key: 'creation event location',
                        path: 'creation_location',
                        type: 'resource'
                    },{
                        key: 'creation event type',
                        path: 'creation_type',
                        type: 'resource'
                    },{
                        key: 'creation event technique',
                        path: 'creation_technique',
                        type: 'resource'
                    },{
                        key: 'physical object used in creation event',
                        path: 'creation_used object',
                        type: 'resource'
                    }]
                },
            };
            self.existenceEvents = ['creation'];
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
                    name: self.cards?.['name of digital resource'],
                    identifier: self.cards?.['identifier of digital resource'],
                    type: self.cards?.['type of digital resource']
                };

                self.descriptionCards = {
                    statement: self.cards['statement about digital resource']
                };

                self.substanceCards = {
                    dimension: self.cards?.['dimension of digital resource']
                };

                self.existenceCards = {
                    'creation':{
                        card: self.cards?.["creation event of digital resource"],
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
                key: 'standards conformed to by digital resource', 
                value: self.getNodeValue(self.resource(), 'conforms to'), 
                href: self.getNodeValue(self.resource(), 'conforms to'), 
                card: self.cards?.["standards conformed to by digital resource"],
                type: 'href'
            }]);
        },
        template: { require: 'text!templates/views/components/reports/digital-resource.htm' }
    });
});
