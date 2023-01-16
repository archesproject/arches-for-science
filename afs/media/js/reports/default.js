define([
    'knockout',
    'viewmodels/report',
    'templates/views/report-templates/default.htm'
], function(ko, ReportViewModel, defatultReportTemplate) {
    return ko.components.register('default-report', {
        viewModel: function(params) {
            params.configKeys = [];

            ReportViewModel.apply(this, [params]);
        },
        template: defatultReportTemplate
    });
});
