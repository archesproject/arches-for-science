define([
    'jquery',
    'underscore',
    'knockout',
    'arches',
    'utils/resource',
    'utils/report',
    'views/components/reports/scenes/name'
], function($, _, ko, arches, resourceUtils, reportUtils) {
    return ko.components.register('observation-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);
            self.sections = [
                {'id': 'name', 'title': 'Names and Classifications'},
                {'id': 'description', 'title': 'Description'},
                {'id': 'documentation', 'title': 'Documentation'},
            ];
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('name');
            self.nameDataConfig = {
                exactMatch: undefined,
            };
            self.documentationDataConfig = {
                'subjectOf': undefined,
            };
            self.nameCards = {};
            self.descriptionCards = {};
            self.documentationCards = {};

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards)

                self.nameCards = {
                    name: self.cards.name,
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

                var carriedOutById = 'a77be70c-c457-11e9-a965-a4d18cec433a';
                this.carriers = ko.observableArray([]);
                this.carrierObjs = resourceUtils.getNodeValues({
                    nodeId: carriedOutById,
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
                var statementTextId = '8ec331a1-c457-11e9-8d7a-a4d18cec433a';
                var statementTypeId = '8ec31b7d-c457-11e9-8550-a4d18cec433a';
                this.description = resourceUtils.getNodeValues({
                    nodeId: statementTextId,
                    where: {
                        nodeId: statementTypeId,
                        contains: descriptionConceptValueId
                    },
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                var typeId = '7b97ee23-c457-11e9-8ce3-a4d18cec433a';
                this.typeOfObservation = ko.observable();
                this.typeOfObservationId = resourceUtils.getNodeValues({
                    nodeId: typeId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                if (this.typeOfObservationId.length) {
                    $.ajax(arches.urls.concept_value + '?valueid=' + self.typeOfObservationId, {
                        dataType: "json"
                    }).done(function(data) {
                        self.typeOfObservation(data.value);
                    });
                }

                var observedID = 'cd412ac5-c457-11e9-9644-a4d18cec433a';
                this.physicalThings = ko.observableArray([]);
                this.physicalThingObjs = resourceUtils.getNodeValues({
                    nodeId: observedID,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);
                this.physicalThingObjs.forEach(function(physicalThingObj) {
                    if (physicalThingObj) {
                        resourceUtils.lookupResourceInstanceData(physicalThingObj.resourceId)
                            .then(function(data) {
                                self.physicalThings.push({ name: data._source.displayname, link: arches.urls.resource_report + physicalThingObj.resourceId });
                            });
                    }});

                var recordedValueId = 'dd596aae-c457-11e9-956b-a4d18cec433a';
                this.digitalResources = ko.observableArray([]);
                this.digitalResourceObjs = resourceUtils.getNodeValues({
                    nodeId: recordedValueId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);
                this.digitalResourceObjs.forEach(function(digitalResourceObj) {
                    if (digitalResourceObj) {
                        resourceUtils.lookupResourceInstanceData(digitalResourceObj.resourceId)
                            .then(function(data) {
                                self.digitalResources.push({ name: data._source.displayname, link: arches.urls.resource_report + digitalResourceObj.resourceId });
                            });
                    }});

                var usedInstrumentId = '1acc9d59-c458-11e9-99e4-a4d18cec433a';
                this.instruments = ko.observableArray([]);
                this.instrumentObjs = resourceUtils.getNodeValues({
                    nodeId: usedInstrumentId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);
                this.instrumentObjs.forEach(function(instrumentObj) {
                    if (instrumentObj) {
                        resourceUtils.lookupResourceInstanceData(instrumentObj.resourceId)
                            .then(function(data) {
                                self.instruments.push({ name: data._source.displayname, link: arches.urls.resource_report + instrumentObj.resourceId });
                            });
                    }});
            }
        },
        template: { require: 'text!templates/views/components/reports/observation.htm' }
    });
});
