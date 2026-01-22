import ko from 'knockout';
import ReportViewModel from 'viewmodels/report';
import defatultReportTemplate from 'templates/views/report-templates/default.htm';

export default ko.components.register('default-report', {
    viewModel: function(params) {
        params.configKeys = [];

        ReportViewModel.apply(this, [params]);
    },
    template: defatultReportTemplate
});