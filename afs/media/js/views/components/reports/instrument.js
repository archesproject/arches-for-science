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
    'views/components/reports/scenes/substance'
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

            if (params.summary) {

                this.editorLink = arches.urls.resource_editor + this.report.attributes.resourceid;

                var ownerId = 'b6c9ba34-99f6-11ea-a9b7-3af9d3b32b71';
                this.owners = ko.observableArray([]);
                this.ownerObjs = resourceUtils.getNodeValues({
                    nodeId: ownerId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);
                this.ownerObjs.forEach(function(ownerObj) {
                    if (ownerObj) {
                        resourceUtils.lookupResourceInstanceData(ownerObj.resourceId)
                            .then(function(data) {
                                self.owners.push({ name: data._source.displayname, link: arches.urls.resource_report + ownerObj.resourceId });
                            });
                    }});

                var descriptionConceptValueId = 'df8e4cf6-9b0b-472f-8986-83d5b2ca28a0';
                var statementTextId = 'b6cba3ee-99f6-11ea-a9b7-3af9d3b32b71';
                var statementTypeId = 'b6cb842c-99f6-11ea-a9b7-3af9d3b32b71';
                this.description = resourceUtils.getNodeValues({
                    nodeId: statementTextId,
                    where: {
                        nodeId: statementTypeId,
                        contains: descriptionConceptValueId
                    },
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                var typeId = 'b6c9f4cc-99f6-11ea-a9b7-3af9d3b32b71';
                this.typeOfInstrument = ko.observable();
                this.typeOfInstrumentId = resourceUtils.getNodeValues({
                    nodeId: typeId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                if (this.typeOfInstrumentId.length) {
                    $.ajax(arches.urls.concept_value + '?valueid=' + self.typeOfInstrumentId, {
                        dataType: "json"
                    }).done(function(data) {
                        self.typeOfInstrument(data.value);
                    });
                }

                this.observations  = ko.observableArray([]);
                var usedInstrumentId = '1acc9d59-c458-11e9-99e4-a4d18cec433a';
                $.ajax(arches.urls.related_resources + self.report.attributes.resourceid, {
                    dataType: "json"
                }).done(function(data) {
                    data.related_resources.resource_relationships.forEach(function(relatedResource) {
                        if (relatedResource.nodeid === usedInstrumentId) {
                            resourceUtils.lookupResourceInstanceData(relatedResource.resourceinstanceidfrom)
                                .then(function(data) {
                                    self.observations.push({ name: data._source.displayname, link: arches.urls.resource_report + relatedResource.resourceinstanceidfrom });
                                });
                        }});
                });
            }
        },
        template: { require: 'text!templates/views/components/reports/instrument.htm' }
    });
});
