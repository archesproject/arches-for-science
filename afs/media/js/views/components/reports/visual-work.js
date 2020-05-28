define(['jquery', 'underscore', 'knockout', 'arches', 'viewmodels/tabbed-report', 'utils/resource'], function($, _, ko, arches, TabbedReportViewModel, resourceUtils) {
    return ko.components.register('visual-work-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            TabbedReportViewModel.apply(this, [params]);

            if (params.summary) {
                // var resourceid = params.report.attributes.resourceid;
                var StatementTextId = 'e58ecc2e-c062-11e9-ba30-a4d18cec433a'; // ok
                var TypeOfWorkId = '28a4ae07-c062-11e9-a11d-a4d18cec433a';
                var DepictsPhysicalId = '5513933a-c062-11e9-9e4b-a4d18cec433a';

                // this.CreatedBy = resourceUtils.getNodeValues({
                //     nodeId: '', // what is the nodeid?
                //     returnTiles: false
                // }, this.report.get('tiles'), this.report.graph);

                this.Statement = resourceUtils.getNodeValues({
                    nodeId: StatementTextId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);


                this.DepictsPhysicalValue = resourceUtils.getNodeValues({
                    nodeId: DepictsPhysicalId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                this.DepictsPhysicalName = ko.observable();
                this.TypeOfWorkName = ko.observable();

                this.TypeOfWorkValue = resourceUtils.getNodeValues({
                    nodeId: TypeOfWorkId,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                // TODO: get concept value label for TypeOfWorkValue

                $.ajax(arches.urls.concept_value + '?valueid=' + self.TypeOfWorkValue, {
                    dataType: "json"
                }).done(function(data) {
                    self.TypeOfWorkName(data.value);
                });

                this.link = ko.observable(arches.urls.resource + '/' + this.DepictsPhysicalValue);

                resourceUtils.lookupResourceInstanceData(this.DepictsPhysicalValue)
                    .then(function(data) {
                        self.DepictsPhysicalName(data._source.displayname);
                    });
         
            }
        },
        template: { require: 'text!templates/views/components/reports/visual-work.htm' }
    });
});