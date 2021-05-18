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

        /* 
            prevents unneccesary VM load, should be removed
            if/when ReportViewModel is refactored to be more generic.
        */ 
        // if (!params.summary) {
        //     ReportViewModel.apply(this, [params]);
        // }

        console.log(self, params)

        this.configForm = false; // legacy artifact

        this.summary = params.summary;
        this.resourceData = ko.observable();

        var url = arches.urls.api_resources(params.report.get('resourceid')) + '?format=json';

        $.get(url, function(data) {
            console.log("WHOOOHO", self, params)
            self.resourceData(data);
        });
    };

    ko.components.register('custom_summary_report', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/reports/custom_summary_report.htm' }
    });
});
