define(['jquery',
    'knockout',
    'viewmodels/afs-instrument',
    'bindings/plotly',
    'bindings/select2-query',
], function($, ko, AfsInstrumentViewModel) {
    return ko.components.register('fors-reader', {
        viewModel: function(params) {
            AfsInstrumentViewModel.apply(this, [params]);

            this.parse = function(data, series){
                const vals = data.split('\n');
                let yfactor;
                vals.forEach(function(val) {
                    if (val.startsWith('##YFACTOR')) {
                        yfactor = Number(val.split('=')[1]);
                    }
                    let rec;
                    if (val.includes('\t')) {
                        rec = val.trim().split('\t');
                        if (Number(rec[0] >= 350 && rec[0] <= 2500)) {
                            series.value.push(Number(rec[0]));
                            series.count.push(Number(rec[1]));
                        }
                    } else {
                        rec = val.trim().split(/(?=[+-])/g);
                        if (Number(rec[0] >= 350 && rec[0] <= 2500)) {
                            series.value.push(Number(rec[0]));
                            rec.splice(0, 1);
                            const average = rec.reduce((a,b) => Number(a) + Number(b), 0) / rec.length;
                            series.count.push(average*yfactor);
                        }
                    }
                });
            };
        },
        template: { require: 'text!templates/views/components/cards/file-renderers/afs-reader.htm' }
    });
});
