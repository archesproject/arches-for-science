define(['jquery',
    'knockout',
    'bindings/plotly',
    'bindings/select2-query'
], function($, ko) {
    return ko.components.register('textreader', {
        viewModel: function(params) {
            this.params = params;
            this.fileType = 'text/plain';
            this.url = "";
            this.type = "";
            this.loading = ko.observable(true);
            this.commonData = params.state;
            this.fileViewer = params.fileViewer;
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

            this.getChartingData = function(tileid, url) {
                var notYetLoaded;
                var res = {
                    'value': [],
                    'count': []
                };
                notYetLoaded = self.seriesData().filter(function(t){return t.tileid === tileid}).length === 0;
                if (notYetLoaded) {
                    $.ajax({
                        url : url,
                        dataType: "text"})
                        .done(function(data) {
                            var vals = data.split('Energy Counts')[1].trim().split('\n');
                            vals.forEach(function(val){
                                var rec = val.trim().split(/[ ,]+/);
                                if (Number(rec[1]) > 30 && rec[0] > 0.5) {
                                    res.count.push(Number(rec[1]));
                                    res.value.push(Number(rec[0]));
                                }
                            });
                            self.seriesData.push({tileid: tileid, data: res, name: url});
                        }, this);
                }
            };

            this.addData = function(tile) {
                var fileInfo = self.fileViewer.getUrl(tile);
                self.getChartingData(tile.tileid, fileInfo.url);
            };

            this.removeData = function(tileid) {
                self.seriesData().forEach(function(series) {
                    if (series.tileid === tileid) {
                        self.seriesData.remove(series);
                    }
                });
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

            this.render  = function() {
                var series = {
                    'value': [],
                    'count': [],
                    'name': this.displayContent.name
                };
                $.ajax({
                    url : this.displayContent.url,
                    dataType: "text"})
                    .done(function(data) {
                        var vals = data.split('Energy Counts')[1].trim().split('\n');
                        vals.forEach(function(val){
                            var rec = val.trim().split(/[ ,]+/);
                            if (Number(rec[1]) > 30 && rec[0] > 0.5) {
                                series.count.push(Number(rec[1]));
                                series.value.push(Number(rec[0]));
                            }
                        });
                        self.chartData(series);
                        self.loading(false);
                    }, this);
            };

            if (this.displayContent) {
                this.url = this.displayContent.url;
                this.type = this.displayContent.type;
                var self = this;
                if (self.params.context === 'render') {
                    self.render();
                }
            }
        },
        template: { require: 'text!templates/views/components/cards/file-renderers/textreader.htm' }
    });
});
