define(['jquery', 'underscore', 'knockout', 'arches', 'viewmodels/tabbed-report', 'utils/resource'], function($, _, ko, arches, TabbedReportViewModel, resourceUtils) {
    return ko.components.register('textual-work-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            TabbedReportViewModel.apply(this, [params]);

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
