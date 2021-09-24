define([
    'jquery',
    'underscore',
    'knockout',
    'arches',
    'utils/resource',
    'utils/report',
    'views/components/reports/scenes/name'
], function($, _, ko, arches, resourceUtils, reportUtils) {
    return ko.components.register('collection-set-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);
            self.sections = [
                {'id': 'name', 'title': 'Names and Classifications'},
                {'id': 'existence', 'title': 'Existence'},
                {'id': 'description', 'title': 'Description'},
                {'id': 'documentation', 'title': 'Documentation'},
            ];
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('name');
            self.nameDataConfig = {
                exactMatch: undefined
            };
            self.documentationDataConfig = {
                'subjectOf': undefined,
            };
            self.existenceEvents = ['creation'];
            self.existenceDataConfig = {
                'creation': 'created',
            };
            self.nameCards = {};
            self.descriptionCards = {};
            self.documentationCards = {};
            self.existenceCards = {};

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
                self.existenceCards = {
                    "creation": {
                        card: self.cards?.["creation"],
                        subCards: {
                            name: 'name for creation event',
                            identifier: 'identifier for creation event',
                            timespan: 'timespan of creation event',
                            statement: 'statement about creation event',
                        }
                    },
                };
            }

            if (params.summary) {

                this.editorLink = arches.urls.resource_editor + this.report.attributes.resourceid;

                var CreatorId = '59768173-c450-11e9-874b-a4d18cec433a';
                this.creators = ko.observableArray([]);
                this.creatorObjs = resourceUtils.getNodeValues({
                    nodeId: CreatorId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);
                this.creatorObjs.forEach(function(creatorObj) {
                    if (creatorObj) {
                        resourceUtils.lookupResourceInstanceData(creatorObj.resourceId)
                            .then(function(data) {
                                self.creators.push({ name: data._source.displayname, link: arches.urls.resource_report + creatorObj.resourceId });
                            });
                    }});

                var TypeId = '442a9c87-c450-11e9-b396-a4d18cec433a';
                this.typeOfSet = ko.observable();
                this.typeOfSetId = resourceUtils.getNodeValues({
                    nodeId: TypeId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                if (this.typeOfSetId.length) {
                    $.ajax(arches.urls.concept_value + '?valueid=' + self.typeOfSetId, {
                        dataType: "json"
                    }).done(function(data) {
                        self.typeOfSet(data.value);
                    });
                }

                var DescriptionConceptValueId = 'df8e4cf6-9b0b-472f-8986-83d5b2ca28a0';
                var StatementTextId = '56c7b1bd-c450-11e9-876d-a4d18cec433a';
                var StatementTypeId = '56c7aba3-c450-11e9-9d5c-a4d18cec433a';
                this.description = resourceUtils.getNodeValues({
                    nodeId: StatementTextId,
                    where: {
                        nodeId: StatementTypeId,
                        contains: DescriptionConceptValueId
                    },
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                this.members  = ko.observableArray([]);
                var PhysicalThingAddedToId = '63e49254-c444-11e9-afbe-a4d18cec433a';

                $.ajax(arches.urls.related_resources + self.report.attributes.resourceid, {
                    dataType: "json"
                }).done(function(data) {
                    data.related_resources.resource_relationships.forEach(function(relatedResource) {
                        if (relatedResource.nodeid === PhysicalThingAddedToId) {
                            resourceUtils.lookupResourceInstanceData(relatedResource.resourceinstanceidfrom)
                                .then(function(data) {
                                    self.members.push({ name: data._source.displayname, link: arches.urls.resource_report + relatedResource.resourceinstanceidfrom });
                                });
                        }});
                });
            }
        },
        template: { require: 'text!templates/views/components/reports/collection-set.htm' }
    });
});
