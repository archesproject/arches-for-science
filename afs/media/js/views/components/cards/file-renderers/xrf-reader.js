define(['jquery',
    'knockout',
    'viewmodels/afs-instrument',
    'bindings/plotly',
    'bindings/select2-query',
], function($, ko, AfsInstrumentViewModel) {
    return ko.components.register('xrf-reader', {
        viewModel: function(params) {
            AfsInstrumentViewModel.apply(this, [params]);
            var self = this;

            this.getChartingData = function(tileid, url, name) {
                var notYetLoaded, lineColor = "";
                var res = {
                    'value': [],
                    'count': []
                };
                notYetLoaded = this.seriesData().filter(function(t){return t.tileid === tileid;}).length === 0;
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
                            if (self.seriesStyles()[tileid]) {
                                lineColor = ko.unwrap(self.seriesStyles()[tileid]["color"]);
                            } else {
                                self.seriesStyles()[tileid] = {};
                                self.seriesStyles()[tileid]["color"] = ko.observable(Math.floor(Math.random()*16777215).toString(16));
                                lineColor = ko.unwrap(self.seriesStyles()[tileid]["color"]);
                            }
                            self.seriesData.push({tileid: tileid, data: res, name: name, color: lineColor});
                        }, this);
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
        template: { require: 'text!templates/views/components/cards/file-renderers/afs-reader.htm' }
    });
});
