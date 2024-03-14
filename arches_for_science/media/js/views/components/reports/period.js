define([
    'jquery',
    'underscore',
    'knockout',
    'templates/views/components/reports/period.htm',
    'arches',
    'utils/resource',
    'utils/report',
    'views/components/reports/scenes/name'
], function($, _, ko, periodReportTemplate, arches, resourceUtils, reportUtils) {
    return ko.components.register('period-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);
            self.sections = [
                {'id': 'name', 'title': arches.translations.namesClassifications},
                {'id': 'description', 'title': arches.translations.description},
                {'id': 'documentation', 'title': arches.translations.documentation},
            ];
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('name');
            self.nameDataConfig = {
                exactMatch: "exact match"
            };
            self.documentationDataConfig = {
                'subjectOf': undefined,
            };
            self.nameCards = {};
            self.descriptionCards = {};
            self.documentationCards = {};
            self.summary = params.summary;

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards)

                self.nameCards = {
                    name: self.cards.name,
                    identifier: self.cards.Identifier,
                    exactMatch: self.cards.ExactMatch,
                    type: self.cards.Classification
                };

                self.descriptionCards = {
                    statement: self.cards.Statement,
                };
            }
        },
        template: periodReportTemplate
    });
});
