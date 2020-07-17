define(['jquery', 'underscore', 'knockout', 'arches', 'viewmodels/tabbed-report', 'utils/resource'], function($, _, ko, arches, TabbedReportViewModel, resourceUtils) {
    return ko.components.register('group-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            TabbedReportViewModel.apply(this, [params]);

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
