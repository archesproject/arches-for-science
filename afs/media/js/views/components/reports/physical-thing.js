define(['underscore', 'knockout', 'knockout-mapping', 'viewmodels/tabbed-report'], function(_, ko, koMapping, TabbedReportViewModel) {
    return ko.components.register('physical-thing-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];

            TabbedReportViewModel.apply(this, [params]);

            this.onInit = function(option) {
                console.log('onInit');
                console.log(option);
            };
        },
        template: { require: 'text!templates/views/components/reports/physical-thing.htm' }
    });
});