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
            }
            if ('parsedData' in params.state === false) {
                this.commonData.parsedData = ko.observable();
            }
            if ('chartTitle' in params.state === false) {
                this.commonData.chartTitle = ko.observable("Title");
                this.commonData.titleSize = ko.observable(24);
                this.commonData.xAxisLabel = ko.observable("x axis");
                this.commonData.xAxisLabelSize = ko.observable(18);
                this.commonData.yAxisLabel = ko.observable("y axis");
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

            this.data2 = {
                'value': [750, 340, 200, 140],
                'count': [25000, 34000, 2000, 10040]
            };

            this.dataOptions = [{
                text: 'Data 1',
                id: 'data1'
            }, {
                text: 'Data 2',
                id: 'data2'
            }];

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
                var data1 = {
                    'value': [],
                    'count': []
                };
                $.ajax({
                    url : this.displayContent.url,
                    dataType: "text"})
                    .done(function(data) {
                        var vals = data.split('Energy Counts')[1].trim().split('\n');
                        vals.forEach(function(val){
                            var rec = val.trim().split(/[ ,]+/);
                            if (Number(rec[1]) > 30 && rec[0] > 0.5) {
                                data1.count.push(Number(rec[1]));
                                data1.value.push(Number(rec[0]));
                            }
                        });
                        self.chartData(data1);
                        self.parsedData(data1);
                        self.loading(false);
                    }, this);
            };

            if (this.displayContent) {
                this.url = this.displayContent.url;
                this.type = this.displayContent.type;
                var self = this;
                if (self.params.context === 'render') {
                    self.render();
                    this.selectedData.subscribe(function(val){
                        if (val === 'data1') {
                            this.chartData(this.parsedData());
                        } else if (val === 'data2') {
                            this.chartData(this.data2);
                        }
                    }, this);
                }

            }
        },
        template: { require: 'text!templates/views/components/cards/file-renderers/textreader.htm' }
    });
});
