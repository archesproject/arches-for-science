define(['jquery',
    'knockout',
    'bindings/c3',
    'bindings/select2-query'
], function($, ko) {
    return ko.components.register('textreader', {
        viewModel: function(params) {
            this.params = params;
            this.fileType = 'text/plain';
            this.url = "";
            this.type = "";
            this.commonData = params.state;
            if ('chartData' in params.state === false) {
                this.commonData.chartData = ko.observable();
            }
            if ('parsedData' in params.state === false) {
                this.commonData.parsedData = ko.observable();
            }
            if ('selectedData' in params.state === false) {
                this.commonData.selectedData = ko.observable('data1');
            }
            this.parsedData = this.commonData.parsedData;
            this.chartData = this.commonData.chartData;
            this.selectedData = this.commonData.selectedData;

            this.data2 = [
                ['value', 750, 340, 200, 140],
                ['count', 25000, 34000, 2000, 10040]
            ];

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
                var data1 = [
                    ['value'],
                    ['count']
                ];
                $.ajax({
                    url : this.params.displayContent.url,
                    dataType: "text"})
                    .done(function(data) {
                        var vals = data.split('Energy Counts')[1].trim().split('\n');
                        vals.forEach(function(val){
                            var rec = val.trim().split(/[ ,]+/);
                            if (Number(rec[1]) > 30 && rec[0] > 0.5) {
                                data1[0].push(Number(rec[0]))
                                data1[1].push(Number(rec[1]))
                            }
                        });
                        self.chartData(data1);
                        self.parsedData(data1);
                    }, this);
            };

            if (this.params.displayContent) {
                this.url = this.params.displayContent.url;
                this.type = this.params.displayContent.type;
                var self = this;
                if (self.params.context === 'render') {
                    self.render();
                }
                this.selectedData.subscribe(function(val){
                    if (val === 'data1') {
                        this.chartData(this.parsedData());
                    } else if (val === 'data2') {
                        this.chartData(this.data2);
                    }
                }, this);
            }
        },
        template: { require: 'text!templates/views/components/cards/file-renderers/textreader.htm' }
    });
});
