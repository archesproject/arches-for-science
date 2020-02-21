define(['jquery',
    'knockout',
    'bindings/plotly',
    'bindings/select2-query'
], function($, ko) {
    /**
    * A viewmodel used for generic AFS instrument files
    *
    * @constructor
    * @name AfsInstrumentViewModel
    *
    * @param  {string} params - a configuration object
    */
    var AfsInstrumentViewModel = function(params) {
        var self = this;
        this.params = params;
        this.fileType = 'text/plain';
        this.url = "";
        this.type = "";
        this.loading = ko.observable(true);
        this.commonData = params.state;
        this.fileViewer = params.fileViewer;
        this.filter = ko.observable('');
        this.displayContent = ko.unwrap(this.params.displayContent);
        if ('chartData' in params.state === false) {
            this.commonData.chartData = ko.observable();
            this.commonData.seriesData = ko.observableArray([]);
        }
        if ('chartTitle' in params.state === false) {
            this.commonData.chartTitle = ko.observable("Sample Reflectance");
            this.commonData.titleSize = ko.observable(24);
            this.commonData.xAxisLabel = ko.observable("Energy");
            this.commonData.xAxisLabelSize = ko.observable(18);
            this.commonData.yAxisLabel = ko.observable("Count");
            this.commonData.yAxisLabelSize = ko.observable(18);
        }
        if ('selectedData' in params.state === false) {
            this.commonData.selectedData = ko.observable('data1');
        }

        this.parsedData = this.commonData.parsedData;
        this.chartData = this.commonData.chartData;
        this.selectedData = this.commonData.selectedData;
        this.chartTitle = this.commonData.chartTitle;
        this.titleSize = this.commonData.titleSize;
        this.xAxisLabel = this.commonData.xAxisLabel;
        this.xAxisLabelSize = this.commonData.xAxisLabelSize;
        this.yAxisLabel = this.commonData.yAxisLabel;
        this.yAxisLabelSize = this.commonData.yAxisLabelSize;
        this.yAxisLabelSize = this.commonData.yAxisLabelSize;
        this.seriesData = this.commonData.seriesData;

        this.addData = function(tile) {
            var fileInfo = this.fileViewer.getUrl(tile);
            this.getChartingData(tile.tileid, fileInfo.url, fileInfo.name);
        };

        this.removeData = function(tileid) {
            this.seriesData().forEach(function(series) {
                if (series.tileid === tileid) {
                    this.seriesData.remove(series);
                }
            }, this);
        };

        this.isFiltered = function(t){
            return self.fileViewer.getUrl(t).name.toLowerCase().includes(self.filter().toLowerCase());
        };
            
        this.chartOptions = {
            axis: {
                x: {
                    tick: {
                        count: 4
                    }
                }
            },
            zoom: {
                enabled: true
            }
        };

    };

    return AfsInstrumentViewModel;
});
