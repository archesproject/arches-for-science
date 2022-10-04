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
    'views/components/reports/scenes/json', 
    'views/components/reports/scenes/default' 
], 
    function($, _, ko, arches, TabbedReportViewModel, resourceUtils, reportUtils) {
    return ko.components.register('instrument-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);
            self.sections = [
                {'id': 'name', 'title': 'Names, Identifiers, Classification'},
                {'id': 'description', 'title': 'Description'},
                {'id': 'actor-relations', 'title': 'Actor Relations'},
                {'id': 'location', 'title': 'Location'},
                {'id': 'component', 'title': 'Components'},
                {'id': 'instrument', 'title': 'Instrument Configuration'},
                {'id': 'documentation', 'title': 'Documentation'},
                {'id': 'json', 'title': 'JSON'},
            ];
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('name');
            self.nameDataConfig = { 'exactMatch': undefined };
            self.documentationDataConfig = {
                'subjectOf': undefined, 
            };
            
            self.nameCards = {};
            self.descriptionCards = {}
            self.documentationCards = {};
            self.textualReferenceCards = {};
            self.summary = params.summary;

            self.textualReferenceTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(3).fill(null)
            };

            self.nameTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(3).fill(null)
            };


            self.visible = {
                textualReference: ko.observable(true),
                names: ko.observable(true)
            }
            
            self.textualReference = ko.observableArray();
            self.textualReferenceDisplay = ko.observable(true);
            
            const textualReferenceData = self.resource()['Textual Reference'];
            
            if(textualReferenceData) {
                self.textualReference(textualReferenceData.map(x => {
                    const type = self.getNodeValue(x, "textual reference type");
                    const source = self.getNodeValue(x, "textual source");
                    const link = self.getResourceLink(self.getRawNodeValue(x, "textual source"));
                    const tileid = self.getTileId(x);
                    return {link, type, source, tileid};
                }));
            };

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards);

                self.nameCards = {
                    name: self.cards?.['name of instrument'],
                    identifier: self.cards?.['identifier for instrument'],
                    type: self.cards?.['type of instrument']
                };

                self.documentationCards = {
                    digitalReference: self.cards?.['digital reference to instrument']
                };

                self.textualReferenceCards = self.cards?.['textual reference to instrument'];

                self.descriptionCards = {
                    statement: self.cards?.['statement about instrument']
                };
            }

            self.locationData = ko.observable({
                sections: 
                    [
                        {
                            title: "Location", 
                            data: [{
                                key: 'current location', 
                                value: self.getRawNodeValue(self.resource(), 'current location'), 
                                card: self.cards?.['current location of instrument'],
                                type: 'resource'
                            }]
                        }
                    ]
            });

            self.parthoodData = ko.observable({
                sections: 
                    [
                        {
                            title: "Parent Instrument", 
                            data: [{
                                key: 'parent instrument', 
                                value: self.getRawNodeValue(self.resource(), 'part of'), 
                                card: self.cards?.['parent instrument'],
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
                                card: self.cards?.['current owner of instrument'],
                                type: 'resource'
                            }]
                        }
                    ]
            });

            self.sethoodData = ko.observable({
                sections: 
                    [
                        {
                            title: "Instrument Configuration", 
                            data: [{
                                key: 'Member of Set', 
                                value: self.getRawNodeValue(self.resource(), 'member of'), 
                                card: self.cards?.['part of set'],
                                type: 'resource'
                            }]
                        }
                    ]
            });

            self.namesSearchData = ko.observable();
            self.typeSearchData = ko.observable();
            const nameData = self.resource()?.Name;

            if (nameData) {
                self.namesSearchData(nameData.map(x => {
                    const type = self.getNodeValue(x, 'name_type');
                    const content = self.getNodeValue(x, 'name_content');
                    const language = self.getNodeValue(x, 'name_language');
                    const tileid = self.getTileId(x);
                    return { type, content, language, tileid }
                }));
            };

            self.typeSearchData = ko.observable({
                sections: [
                    {
                        title: 'Classification',
                        data: [{
                            key: 'type',
                            value: self.resource()?.type,
                            card: undefined,
                            type: 'resource'
                        }]
                    }
                ]
            });
        },
        template: { require: 'text!templates/views/components/reports/instrument.htm' }
    });
});
