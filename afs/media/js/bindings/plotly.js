define([
    'jquery',
    'knockout',
    'Plotly'
], function($, ko, Plotly) {
    ko.bindingHandlers.plotly = {
        init: function(element, valueAccessor) {
            var config = ko.unwrap(valueAccessor());
            var self = this;
            var chartData = {
                x: config.data().value,
                y: config.data().count,
                type: 'scatter',
                name: config.data().name,
            };
            var layout = {
                title: {
                    text: config.title(),
                    font: {
                        family: 'Arial, monospace',
                        size: config.titleSize()
                    },
                    xref: 'paper',
                    x: 0.05,
                },
                xaxis: {
                    title: {
                        text: config.xAxisLabel(),
                        font: {
                            family: 'Arial, monospace',
                            size: config.xAxisLabelSize(),
                            color: '#7f7f7f'
                        }
                    },
                },
                yaxis: {
                    title: {
                        text: config.yAxisLabel(),
                        font: {
                            family: 'Arial, monospace',
                            size: config.yAxisLabelSize(),
                            color: '#7f7f7f'
                        }
                    }
                }
            };

            var chartConfig = {responsive: true};

            this.chart = Plotly.newPlot(element, [chartData], layout, chartConfig);
            // var layoutOptions = [
            //     {option: config.title, layout: {title: {text: 'Title'}}},
            //     {option: config.titleSize, layout: {title: {font: {size: 24}}}},
            //     {option: config.xAxisLabel, layout: {xaxis: {title: {text: 'xaxis label'}}}},
            //     {option: config.xAxisLabelSize, layout: {xaxis: {title: {font: {size: 18}}}}},
            //     {option: config.yAxisLabel, layout: {yaxis: {title: {text: 'yaxis label'}}}},
            //     {option: config.yAxisLabelSizelayout, layout: {yaxis: {title: {font: {size: 18}}}}},
            // ];

            // layoutOptions.forEach(function(layoutOption) {
            //     layoutOption.option.subscribe(function(val){

            //     })
            // });
            config.title.subscribe(function(val){
                layout.title.text = val;
                Plotly.relayout(element, layout);
            });

            config.titleSize.subscribe(function(val){
                layout.title.font.size = val;
                Plotly.relayout(element, layout);
            });

            config.xAxisLabel.subscribe(function(val){
                layout.xaxis.title.text = val;
                Plotly.relayout(element, layout);
            });

            config.xAxisLabelSize.subscribe(function(val){
                layout.xaxis.title.font.size = val;
                Plotly.relayout(element, layout);
            });

            config.yAxisLabel.subscribe(function(val){
                layout.yaxis.title.text = val;
                Plotly.relayout(element, layout);
            });

            config.yAxisLabelSize.subscribe(function(val){
                layout.yaxis.title.font.size = val;
                Plotly.relayout(element, layout);
            });

            config.seriesData.subscribe(function(val){
                val.forEach(function(series){
                    if (series.status === 'added') {
                        Plotly.addTraces(element, {
                            x: series.value.data.value,
                            y: series.value.data.count,
                            name: series.value.name
                        }, element.data.length);
                    } else {
                        element.data.forEach(function(trace, i){
                            if (trace.name === series.value.name) {
                                Plotly.deleteTraces(element, i);
                            }
                        });
                    }
                });
            }, this, "arrayChange");

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            }, this); 
        },
    };
    return ko.bindingHandlers.plotly;
});
