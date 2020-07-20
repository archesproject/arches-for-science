define(['jquery', 'underscore', 'knockout', 'arches', 'viewmodels/tabbed-report', 'utils/resource'], function($, _, ko, arches, TabbedReportViewModel, resourceUtils) {
    return ko.components.register('modification-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            TabbedReportViewModel.apply(this, [params]);

            if (params.summary) {
                // var resourceid = params.report.attributes.resourceid;
                var StatementTextId = 'ad9f5dca-c456-11e9-b5a1-a4d18cec433a';
                var modifiedNodeId = 'cb3f3ae1-c45a-11e9-8594-a4d18cec433a';
                var carriedOutNodeId = '85869d3d-c456-11e9-a9b6-a4d18cec433a';
                var begOfBegNodeId = 'a95cde05-c456-11e9-8fe4-a4d18cec433a';
                var endOfEndNodeId = 'a95cebba-c456-11e9-816a-a4d18cec433a';
                var typeNodeId = '7a22d1e8-c456-11e9-a20c-a4d18cec433a';

                this.carriers = ko.observableArray([]);
                this.carrierObjs = resourceUtils.getNodeValues({
                    nodeId: carriedOutNodeId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                this.carrierObjs.forEach(function(carrierObj) {
                    if (carrierObj) {
                        resourceUtils.lookupResourceInstanceData(carrierObj.resourceId)
                            .then(function(data) {
                                self.carriers.push({ name: data._source.displayname, link: arches.urls.resource_report + carrierObj.resourceId });
                            });
                    }});

                var DescriptionConceptValueId = 'df8e4cf6-9b0b-472f-8986-83d5b2ca28a0';
                var StatementTypeId = 'ad9f562e-c456-11e9-92f8-a4d18cec433a';
                this.description = resourceUtils.getNodeValues({
                    nodeId: StatementTextId,
                    where: {
                        nodeId: StatementTypeId,
                        contains: DescriptionConceptValueId
                    },
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                this.typeOfMod = ko.observable();
                this.typeOfModId = resourceUtils.getNodeValues({
                    nodeId: typeNodeId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                if (this.typeOfModId.length) {
                    $.ajax(arches.urls.concept_value + '?valueid=' + self.typeOfModId, {
                        dataType: "json"
                    }).done(function(data) {
                        self.typeOfMod(data.value);
                    });
                }

                this.Beginning = resourceUtils.getNodeValues({
                    nodeId: begOfBegNodeId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                this.End = resourceUtils.getNodeValues({
                    nodeId: endOfEndNodeId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                this.ModifiedObjects = ko.observableArray([]);

                this.objectModifiedObjs = resourceUtils.getNodeValues({
                    nodeId: modifiedNodeId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                this.objectModifiedObjs.forEach(function(objectModifiedObj) {
                    if (objectModifiedObj) {
                        resourceUtils.lookupResourceInstanceData(objectModifiedObj.resourceId)
                            .then(function(data) {
                                self.ModifiedObjects.push({ name: data._source.displayname, link: arches.urls.resource_report + objectModifiedObj.resourceId });
                            });
                    }});

            }
        },
        template: { require: 'text!templates/views/components/reports/modification.htm' }
    });
});
