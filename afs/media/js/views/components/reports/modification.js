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

                this.CarriedOutBy = resourceUtils.getNodeValues({
                    nodeId: carriedOutNodeId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph)[0];

                this.Statement = resourceUtils.getNodeValues({
                    nodeId: StatementTextId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                this.Beginning = resourceUtils.getNodeValues({
                    nodeId: begOfBegNodeId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                this.End = resourceUtils.getNodeValues({
                    nodeId: endOfEndNodeId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);


                this.ObjectModified = resourceUtils.getNodeValues({
                    nodeId: modifiedNodeId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph)[0];

                this.ObjectModifiedName = ko.observable();
                this.CarriedOutByName = ko.observable();

                this.link = ko.observable(arches.urls.resource + '/' + this.ObjectModified.resourceId);
                this.carriedOutByLink = ko.observable(arches.urls.resource + '/' + this.CarriedOutBy.resourceId);

                resourceUtils.lookupResourceInstanceData(this.ObjectModified.resourceId)
                    .then(function(data) {
                        self.ObjectModifiedName(data._source.displayname);
                    });
                
                resourceUtils.lookupResourceInstanceData(this.CarriedOutBy.resourceId)
                    .then(function(data) {
                        self.CarriedOutByName(data._source.displayname);
                    });
         
            }
        },
        template: { require: 'text!templates/views/components/reports/modification.htm' }
    });
});