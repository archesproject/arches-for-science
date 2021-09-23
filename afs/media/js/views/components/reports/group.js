define([
    'jquery',
    'underscore',
    'knockout',
    'arches',
    'utils/resource',
    'utils/report',
    'views/components/reports/scenes/name'
], function($, _, ko, arches, resourceUtils, reportUtils) {
    return ko.components.register('group-report', {
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
            self.sourceData = ko.observable({
                sections:
                    [
                        {
                            title: "References",
                            data: [{
                                key: 'source reference work',
                                value: self.getRawNodeValue(self.resource(), 'source'),
                                type: 'resource'
                            }]
                        }
                    ]
            });

            self.nameDataConfig = {
                exactMatch: 'exact match',
            };
            self.documentationDataConfig = {
                subjectOf: undefined
            };
            self.existenceEvents = ['formation', 'dissolution'];
            self.existenceDataConfig = {
                'formation': 'formation',
                'dissolution': 'dissolution',
            };
            self.nameCards = {};
            self.descriptionCards = {};
            self.documentationCards = {};
            self.existenceCards = {};

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards)

                self.nameCards = {
                    name: self.cards?.["group name"],
                    identifier: self.cards?.["identifier"],
                    exactMatch: self.cards?.["uri in external list"],
                    type: self.cards?.["type of group"]
                };

                self.descriptionCards = {
                    statement: self.cards?.["group description or statement"],
                };

                self.documentationCards = {
                    label: self.cards?.["internal label"],
                    digitalReference: self.cards?.["digital reference"],
                    subjectOf: self.cards?.["references"]
                };

                self.existenceCards = {
                    'formation': { 
                        card: self.cards?.["formation"],
                        subCards: {
                            name: 'name for group formation event',
                            identifier: 'identifier for group formation event',
                            timespan: 'timespan of group formation event',
                            statement: 'statement about group formation event',
                        }
                    },
                    'dissolution': {
                        card:  self.cards?.["dissolution"],
                        subCards: {
                            name: 'name for group dissolution event',
                            identifier: 'identifier for group dissolution event',
                            timespan: 'timespan of group dissolution event',
                            statement: 'statement about group dissolution event'
                        }
                    },
                };
            }

            if (params.summary) {

                this.editorLink = arches.urls.resource_editor + this.report.attributes.resourceid;

                var FounderID = '3b5f8617-c05e-11e9-9ca5-a4d18cec433a';
                this.founders = ko.observableArray([]);
                this.founderObjs = resourceUtils.getNodeValues({
                    nodeId: FounderID,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);
                this.founderObjs.forEach(function(founderObj) {
                    if (founderObj) {
                        resourceUtils.lookupResourceInstanceData(founderObj.resourceId)
                            .then(function(data) {
                                self.founders.push({ name: data._source.displayname, link: arches.urls.resource_report + founderObj.resourceId });
                            });
                    }});

                var FormationDateId = "3b5f7497-c05e-11e9-8b4a-a4d18cec433a"; //Begining of Begining
                this.formationDate = resourceUtils.getNodeValues({
                    nodeId: FormationDateId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                var DissolutionDateId = "ae7d8ae8-d284-11e9-a201-a4d18cec433a"; //End of End
                this.dissolutionDate = resourceUtils.getNodeValues({
                    nodeId: DissolutionDateId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                var TypeId = '97f2c366-b323-11e9-98a8-a4d18cec433a';
                this.typeOfGroup = ko.observable();
                this.typeOfGroupId = resourceUtils.getNodeValues({
                    nodeId: TypeId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                if (this.typeOfGroupId.length) {
                    $.ajax(arches.urls.concept_value + '?valueid=' + self.typeOfGroupId, {
                        dataType: "json"
                    }).done(function(data) {
                        self.typeOfGroup(data.value);
                    });
                }

                this.members  = ko.observableArray([]);
                var PersonMemberOfNodeid = 'b3026e1c-b31f-11e9-aa4a-a4d18cec433a';

                $.ajax(arches.urls.related_resources + self.report.attributes.resourceid, {
                    dataType: "json"
                }).done(function(data) {
                    data.related_resources.resource_relationships.forEach(function(relatedResource) {
                        if (relatedResource.nodeid === PersonMemberOfNodeid) {
                            resourceUtils.lookupResourceInstanceData(relatedResource.resourceinstanceidfrom)
                                .then(function(data) {
                                    self.members.push({ name: data._source.displayname, link: arches.urls.resource_report + relatedResource.resourceinstanceidfrom });
                                });
                        }});
                });

                var DescriptionConceptValueId = 'df8e4cf6-9b0b-472f-8986-83d5b2ca28a0';
                var StatementTextId = '32dba023-c05e-11e9-aa88-a4d18cec433a';
                var StatementTypeId = '32db9a8f-c05e-11e9-9e7b-a4d18cec433a';
                this.description = resourceUtils.getNodeValues({
                    nodeId: StatementTextId,
                    where: {
                        nodeId: StatementTypeId,
                        contains: DescriptionConceptValueId
                    },
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);
            }
        },
        template: { require: 'text!templates/views/components/reports/group.htm' }
    });
});
