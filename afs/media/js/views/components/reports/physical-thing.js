define([
    'underscore', 
    'knockout', 
    'arches', 
    'utils/resource', 
    'utils/physical-thing', 
    'utils/report',
    'bindings/datatable', 
    'views/components/reports/scenes/name', 
    'views/components/reports/scenes/description', 
    'views/components/reports/scenes/documentation', 
    'views/components/reports/scenes/existence', 
    'views/components/reports/scenes/substance', 
    'views/components/reports/scenes/actor-relations'], function(_, ko, arches, resourceUtils, physicalThingUtils, reportUtils) {
    return ko.components.register('physical-thing-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);
            self.sections = [
                {'id': 'name', 'title': 'Names and Classifications'}, 
                {'id': 'existence', 'title': 'Existence'},
                {'id': 'substance', 'title': 'Substance'},
                {'id': 'actor-relations', 'title': 'Actor Relations'},
                {'id': 'description', 'title': 'Description'},
                {'id': 'documentation', 'title': 'Documentation'},
            ];
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('substance');
            self.nameCards = {};
            self.descriptionCards = {};
            self.documentationCards = {};
            self.existenceEvents = ['production', 'destruction', 'removal from object'];
            self.existenceDataConfig = {'destruction': 'destruction', 'removal from object': 'removal from object'};
            self.existenceCards = {};
            self.substanceCards = {};
            self.actorCards = {};
            self.summary = params.summary;

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards);

                if(self.cards?.["production (partitioned)"]) {
                    const productionEventChildren = self.cards["production (partitioned)"].tiles()?.[0]?.cards ? self.cards["production (partitioned)"].tiles()[0].cards : self.cards["production (partitioned)"].cards();
                    self.cards["production (partitioned)"].children = self.createCardDictionary(productionEventChildren);
                }

                self.nameCards = {
                    name: self.cards.name,
                    identifier: self.cards.identifier,
                    exactMatch: self.cards.exactmatch,
                    type: self.cards.classification
                };

                self.descriptionCards = {
                    statement: self.cards.statement
                };

                self.documentationCards = {
                    digitalReference: self.cards?.["digital reference"],
                    subjectOf: self.cards?.["subject of"]
                };

                self.existenceCards = {
                    production: {
                        card: self.cards?.["production (partitioned)"],
                        subCards: {
                            name: 'name for production event',
                            identifier: 'identifier for production event',
                            timespan: 'timespan of production event',
                            statement: 'statement about production event',
                            part: 'production event part'
                        }
                    },
                    destruction: {
                        card:  self.cards?.["destruction"],
                        subCards: {
                            name: 'name for destruction event',
                            identifier: 'identifier for destruction event',
                            timespan: 'timespan of destruction event',
                            statement: 'statement about destruction event'
                        }
                    },
                    'removal from object': { 
                        card: self.cards?.["removal from object"],
                        subCards: {
                            name: 'name for part removal event',
                            identifier: 'identifier for part removal event',
                            timespan: 'timespan of removal from object',
                            statement: 'statement about part removal event'
                        }
                    },
                },

                self.substanceCards = {
                    dimension: self.cards.dimension
                }

                self.actorCards = {
                    owner: self.cards["current owner"]
                }
            }

            self.additionalData = ko.observableArray([{
                key: 'material', 
                value: self.getNodeValue(self.resource(), 'material'), 
                card: self.cards?.["material(s)"],
                type: 'kv'
            }]);
        },
        template: { require: 'text!templates/views/components/reports/physical-thing.htm' }
    });
});