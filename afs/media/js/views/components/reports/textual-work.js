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
                {'id': 'description', 'title': 'Description'},
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

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards)

                self.nameCards = {
                    name: self.cards['Textual Work Name'],
                    identifier: self.cards.Identifier,
                    exactMatch: self.cards.ExactMatch,
                    type: self.cards.Classification
                }

                self.descriptionCards = {
                    statement: self.cards.Statement,
                };
            }

            if (params.summary) {

                this.editorLink = arches.urls.resource_editor + this.report.attributes.resourceid;

                var carrierId = '1174e9c7-c073-11e9-8fb7-a4d18cec433a';
                this.carriers = ko.observableArray([]);
                this.carrierObjs = resourceUtils.getNodeValues({
                    nodeId: carrierId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);
                this.carrierObjs.forEach(function(carrierObj) {
                    if (carrierObj) {
                        resourceUtils.lookupResourceInstanceData(carrierObj.resourceId)
                            .then(function(data) {
                                self.carriers.push({ name: data._source.displayname, link: arches.urls.resource_report + carrierObj.resourceId });
                            });
                    }});

                var descriptionConceptValueId = 'df8e4cf6-9b0b-472f-8986-83d5b2ca28a0';
                var statementTextId = '0096f959-c073-11e9-b26c-a4d18cec433a';
                var statementTypeId = '0096f387-c073-11e9-9edb-a4d18cec433a';
                this.description = resourceUtils.getNodeValues({
                    nodeId: statementTextId,
                    where: {
                        nodeId: statementTypeId,
                        contains: descriptionConceptValueId
                    },
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                var typeId = 'dc946b1e-c070-11e9-a005-a4d18cec433a';
                this.typeOfTextualWork = ko.observable();
                this.typeOfTextualWorkId = resourceUtils.getNodeValues({
                    nodeId: typeId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                if (this.typeOfTextualWorkId.length) {
                    $.ajax(arches.urls.concept_value + '?valueid=' + self.typeOfTextualWorkId, {
                        dataType: "json"
                    }).done(function(data) {
                        self.typeOfTextualWork(data.value);
                    });
                }

                this.otherTextualWork  = ko.observableArray([]);
                var parentTextualWorkId = 'fe0b1602-c073-11e9-adb3-a4d18cec433a';
                this.parentTextualWorkObjs = resourceUtils.getNodeValues({
                    nodeId: parentTextualWorkId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);
                this.parentTextualWorkObjs.forEach(function(parentTextualWorkObj) {
                    if (parentTextualWorkObj) {
                        resourceUtils.lookupResourceInstanceData(parentTextualWorkObj.resourceId)
                            .then(function(data) {
                                self.otherTextualWork.push({ name: data._source.displayname, link: arches.urls.resource_report + parentTextualWorkObj.resourceId });
                            });
                    }});

                var partOfTextualWorkId = 'fe0b1602-c073-11e9-adb3-a4d18cec433a';
                $.ajax(arches.urls.related_resources + self.report.attributes.resourceid, {
                    dataType: "json"
                }).done(function(data) {
                    data.related_resources.resource_relationships.forEach(function(relatedResource) {
                        if (relatedResource.nodeid === partOfTextualWorkId && relatedResource.resourceinstanceidto === self.report.attributes.resourceid) {
                            resourceUtils.lookupResourceInstanceData(relatedResource.resourceinstanceidfrom)
                                .then(function(data) {
                                    self.otherTextualWork.push({ name: data._source.displayname, link: arches.urls.resource_report + relatedResource.resourceinstanceidfrom });
                                });
                        }});
                });
            }
        },
        template: { require: 'text!templates/views/components/reports/textual-work.htm' }
    });
});
