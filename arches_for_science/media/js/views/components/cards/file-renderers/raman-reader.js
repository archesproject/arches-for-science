import arches from 'arches';
import ko from 'knockout';
import ramanReaderTemplate from 'templates/views/components/cards/file-renderers/afs-reader.htm';
import AfsInstrumentViewModel from 'viewmodels/afs-instrument';
import 'bindings/plotly';
import 'bindings/select2-query';

export default ko.components.register('raman-reader', {
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