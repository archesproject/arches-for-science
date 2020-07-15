define(['jquery', 'underscore', 'knockout', 'arches', 'viewmodels/tabbed-report', 'utils/resource'], function($, _, ko, arches, TabbedReportViewModel, resourceUtils) {
    return ko.components.register('activity-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            TabbedReportViewModel.apply(this, [params]);

            if (params.summary) {

                this.editorLink = arches.urls.resource_editor + this.report.attributes.resourceid;

                var ParticipantId = 'dbaa2022-9ae7-11ea-ab62-dca90488358a';
                this.participants = ko.observableArray([]);
                this.participantObjs = resourceUtils.getNodeValues({
                    nodeId: ParticipantId,
                    //widgetLabel: 'Carried out by.carried out by',
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);
                this.participantObjs.forEach(function(participantObj) {
                    if (participantObj) {
                        resourceUtils.lookupResourceInstanceData(participantObj.resourceId)
                            .then(function(data) {
                                self.participants.push({ name: data._source.displayname, link: arches.urls.resource_report + participantObj.resourceId });
                    })};
                });
                var TypeOfActivityId = '0b924423-ca85-11e9-865a-a4d18cec433a';
                this.typeOfActivity = ko.observable();
                this.typeOfActivityObj = resourceUtils.getNodeValues({
                    nodeId: TypeOfActivityId,
                    //widgetLabel: 'Classification.Type of Activity',
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                $.ajax(arches.urls.concept_value + '?valueid=' + self.typeOfActivityObj, {
                    dataType: "json"
                }).done(function(data) {
                    self.typeOfActivity(data.value);
                });

                var DescriptionConceptValueId = 'df8e4cf6-9b0b-472f-8986-83d5b2ca28a0';
                var StatementTextId = '0b930a8a-ca85-11e9-a000-a4d18cec433a';
                var StatementTypeId = '0b92eeb0-ca85-11e9-9f4d-a4d18cec433a';
                this.description = resourceUtils.getNodeValues({
                    nodeId: StatementTextId,
                    //widgetLabel: 'Brief Text or Statement.Statement Text',
                    where: {
                        nodeId: StatementTypeId,
                        //widgetLabel: 'Brief Text or Statement.Type of Statement',
                        contains: DescriptionConceptValueId
                    },
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                this.relatedActivities = ko.observableArray([]);

                var ParentActivityId = '0b92b30a-ca85-11e9-a41d-a4d18cec433a';
                this.parentActivityObjs = resourceUtils.getNodeValues({
                    nodeId: ParentActivityId,
                    //widgetLabel: 'Part of Broader Activity.Parent Activity',
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);
                this.parentActivityObjs.forEach(function(parentActivityObj) {
                    if (parentActivityObj) {
                        resourceUtils.lookupResourceInstanceData(parentActivityObj.resourceId)
                            .then(function(data) {
                                self.relatedActivities.push({ name: data._source.displayname, link: arches.urls.resource_report + parentActivityObj.resourceId });
                            })};
                });

                this.members  = ko.observableArray([]);
                var ChildActivityId = '0b92b30a-ca85-11e9-a41d-a4d18cec433a';

                $.ajax(arches.urls.related_resources + self.report.attributes.resourceid, {
                    dataType: "json"
                }).done(function(data) {
                    data.related_resources.resource_relationships.forEach(function(relatedResource) {
                        if (relatedResource.nodeid === ChildActivityId && relatedResource.resourceinstanceidto === self.report.attributes.resourceid) {
                            resourceUtils.lookupResourceInstanceData(relatedResource.resourceinstanceidfrom)
                                .then(function(data) {
                                    self.relatedActivities.push({ name: data._source.displayname, link: arches.urls.resource_report + relatedResource.resourceinstanceidfrom });
                                })};
                    });
                });

                this.relatedCollections = ko.observableArray([]);
                var CollectionUsedInId = '9e4f6be8-99f6-11ea-a9b7-3af9d3b32b71';

                $.ajax(arches.urls.related_resources + self.report.attributes.resourceid, {
                    dataType: "json"
                }).done(function(data) {
                    data.related_resources.resource_relationships.forEach(function(relatedResource) {
                        if (relatedResource.nodeid === CollectionUsedInId) {
                            resourceUtils.lookupResourceInstanceData(relatedResource.resourceinstanceidfrom)
                                .then(function(data) {
                                    self.relatedCollections.push({ name: data._source.displayname, link: arches.urls.resource_report + relatedResource.resourceinstanceidfrom });
                                })};
                    });
                });
            }
        },
        template: { require: 'text!templates/views/components/reports/activity.htm' }
    });
});
