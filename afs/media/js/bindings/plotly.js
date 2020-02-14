define([
    'jquery',
    'knockout',
    'Plotly'
], function($, ko, Plotly) {
    ko.bindingHandlers.plotly = {
        init: function(element, valueAccessor) {
            var config = ko.unwrap(valueAccessor());
            var chartData = {
                x: config.data().value,
                y: config.data().count,
                type: 'scatter'
            };
            Plotly.newPlot(element, [chartData]);
            config.data.subscribe(function(val){

                Plotly.addTraces(element, {
                    x: val.value,
                    y: val.count
                }, 0);
                // Plotly.animate(element, {
                //     data: [{
                //         x: val[0].slice(1),
                //         y: val[1].slice(1)
                //     }],
                //     traces: [0],
                //     layout: {}
                // }, {
                //     transition: {
                //         duration: 500,
                //         easing: 'cubic-in-out'
                //     },
                //     frame: {
                //         duration: 500
                //     }
                // });
            }, this);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            }, this); 
        },
    };
    return ko.bindingHandlers.plotly;
});
