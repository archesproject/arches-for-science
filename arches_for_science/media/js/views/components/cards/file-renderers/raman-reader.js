define(['jquery',
    'arches',
    'knockout',
    'templates/views/components/cards/file-renderers/afs-reader.htm',
    'viewmodels/afs-instrument',
    'bindings/plotly',
    'bindings/select2-query',
], function($, arches, ko, ramanReaderTemplate, AfsInstrumentViewModel) {
    return ko.components.register('raman-reader', {
        viewModel: function(params) {
            AfsInstrumentViewModel.apply(this, [params]);
            this.parse = function(data, series){
                var vals = data.split('\n');
                vals.forEach(function(val){
                    var rec = val.trim().split('\t');
                    if (Number(rec[1]) > 30 && rec[0] > 0.5) {
                        series.count.push(Number(rec[1]));
                        series.value.push(Number(rec[0]));
                    }
                });
                this.chartTitle(arches.translations.ramanSpectrum);
                this.xAxisLabel(arches.translations.ramanShift);
                this.yAxisLabel(arches.translations.ramanIntensity);
            };
        },
        template: ramanReaderTemplate
    });
});
