import arches from 'arches';
import ko from 'knockout';
import xrfReaderTemplate from 'templates/views/components/cards/file-renderers/afs-reader.htm';
import AfsInstrumentViewModel from 'viewmodels/afs-instrument';
import 'bindings/plotly';
import 'bindings/select2-query';

export default ko.components.register('xrf-reader', {
    viewModel: function(params) {
        AfsInstrumentViewModel.apply(this, [params]);
        this.parse = function(data, series){
            let vals;
            try {
                vals = data.split('Energy Counts')[1].trim().split('\n');
            } catch(e) {
                vals = data.split('\n');
            }
            vals.forEach(function(val){
                var rec = val.trim().split(/[ ,]+/);
                if (Number(rec[1]) > 30 && rec[0] > 0.5) {
                    series.count.push(Number(rec[1]));
                    series.value.push(Number(rec[0]));
                }
            });
        };
        this.chartTitle(arches.translations.xrfSpectrum);
        this.xAxisLabel(arches.translations.xrfUnits);
        this.yAxisLabel(arches.translations.count);
    },
    template: xrfReaderTemplate
});