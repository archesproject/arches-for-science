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
        ReportViewModel.apply(this, [params]);

        this.foo = ko.observable();

        var url = arches.urls.api_resources(params.report.get('resourceid')) + '?format=json';

        console.log("ADF(D)S", this, params)

        $.get(url, function(data) {
            console.log("WHOOOWHO", data, self)
            self.foo(data);
        });
    };

    ko.components.register('custom_summary_report', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/reports/custom_summary_report.htm' }
    });
});
