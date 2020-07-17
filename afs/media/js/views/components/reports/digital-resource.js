define(['jquery','underscore', 'knockout', 'arches', 'viewmodels/tabbed-report', 'utils/resource'], function($, _, ko, arches, TabbedReportViewModel, resourceUtils) {
    return ko.components.register('digital-resource-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            TabbedReportViewModel.apply(this, [params]);

            if (params.summary) {
                // var resourceid = params.report.attributes.resourceid;
                var ResourceType = '09c1778a-ca7b-11e9-860b-a4d18cec433a';
                var StatementTextId = 'da1fbca1-ca7a-11e9-8256-a4d18cec433a';
                var FilesId = '7c486328-d380-11e9-b88e-a4d18cec433a';
                var ShowsVisualId = '1e732b0-ca7a-11e9-b369-a4d18cec433a';

                // this.CreatedBy = resourceUtils.getNodeValues({
                //     nodeId: '', // what is the nodeid?
                //     returnTiles: false
                // }, this.report.get('tiles'), this.report.graph);

                this.Statement = resourceUtils.getNodeValues({
                    nodeId: StatementTextId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);


                this.ShowsVisualValue = resourceUtils.getNodeValues({
                    nodeId: ShowsVisualId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                this.ShowsVisualName = ko.observable();
                this.ResourceTypeName = ko.observable();


                this.ResourceTypeValue = resourceUtils.getNodeValues({
                    nodeId: ResourceType,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                this.FilesValue = resourceUtils.getNodeValues({
                    nodeId: FilesId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);
                // console.log(this.FilesValue);

                if (this.ResourceTypeValue.length) {
                    $.ajax(arches.urls.concept_value + '?valueid=' + self.ResourceTypeValue, {
                        dataType: "json"
                    }).done(function(data) {
                        self.ResourceTypeName(data.value);
                    });
                }

                this.link = ko.observable(arches.urls.resource + '/' + this.ShowsVisualValue);

                resourceUtils.lookupResourceInstanceData(this.ShowsVisualValue)
                    .then(function(data) {
                        self.ShowsVisualName(data._source.displayname);
                    });

            }
        },
        template: { require: 'text!templates/views/components/reports/digital-resource.htm' }
    });
});
