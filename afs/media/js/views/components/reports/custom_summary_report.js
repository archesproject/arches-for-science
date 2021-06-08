define([
    'jquery',
    'underscore',
    'knockout',
    'knockout-mapping',
    'arches',
    'viewmodels/report',
    'bindings/chosen'
], function($, _, ko, koMapping, arches, ReportViewModel) {
    var viewModel = function(params) {
        var self = this;

        this.report = params.report;
        console.log("in custom summary report", self, params)
    };

    ko.components.register('custom_summary_report', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/reports/custom_summary_report.htm' }
    });
});
