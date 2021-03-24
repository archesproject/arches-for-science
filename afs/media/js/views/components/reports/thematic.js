define([
    'jquery',
    'underscore',
    'knockout',
    'knockout-mapping',
    'viewmodels/report',
    'arches',
    'bindings/chosen'
], function($, _, ko, koMapping, ReportViewModel, arches) {
    TAB_DATA = [
        {
            "title": "Names/Classification"
        },
        {
            "title": "Existence"
        },
        {
            "title": "Parameters"
        },
        {
            "title": "Parts"
        },
        {
            "title": "Temporal Relations"
        },
        {
            "title": "Location"
        },
        {
            "title": "Descriptions"
        }
    ];

    var viewModel = function(params) {
        var self = this;

        ReportViewModel.apply(this, [params]);

        this.activeTabIndex = ko.observable(0);
        this.activeTab = ko.observable(TAB_DATA[self.activeTabIndex()]);

        this.hideEmptyReportSections = ko.observable(false);
    };

    ko.components.register('thematic-report', {
        viewModel: viewModel,
        template: { require: 'text!report-templates/thematic' }
    });
});
