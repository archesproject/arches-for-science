define(['underscore', 'knockout', 'arches', 'utils/report','bindings/datatable'], function(_, ko, arches, reportUtils) {
    return ko.components.register('views/components/reports/scenes/substance', {
        viewModel: function(params) {
            var self = this;
            Object.assign(self, reportUtils);

            self.dimensionTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(6).fill(null)
            };

            self.dataConfig = {
                dimension: 'dimension',
            }

            self.cards = Object.assign({}, params.cards);
            self.edit = params.editTile || self.editTile;
            self.delete = params.deleteTile || self.deleteTile;
            self.add = params.addTile || self.addNewTile;
            self.dimensions = ko.observableArray();
            self.material = ko.observable();
            self.visible = {
                dimensions: ko.observable(true),
                additionalData: ko.observable(true)
            }
            self.additionalData = params.additionalData || undefined;
            Object.assign(self.dataConfig, params.dataConfig || {});

            // if params.compiled is set and true, the user has compiled their own data.  Use as is.
            if(self.dataConfig.dimension){
                if(params?.compiled){
                    self.dimensions(params.data.dimensions);
                } else {
                    let dimensionData = self.getRawNodeValue(params.data(), self.dataConfig.dimension);
                    
                    if(dimensionData) {
                        if(dimensionData.length === undefined){
                            dimensionData = [dimensionData];
                        } 

                        self.dimensions(dimensionData.map(x => {
                            const type = self.getNodeValue(x, `${self.dataConfig.dimension}_type`);
                            const name = self.getNodeValue(x, {
                                testPaths: [
                                    [`${self.dataConfig.dimension}_name`, 0, `${self.dataConfig.dimension}_name_content`], 
                                    [`${self.dataConfig.dimension}_name`, `${self.dataConfig.dimension}_name_content`]
                                ]
                            });

                            const dimensionValue = self.getNodeValue(x, {
                                testPaths: [
                                    [`${self.dataConfig.dimension}_value`]
                                ]
                            });
                            const lowestValue = self.getNodeValue(x, `${self.dataConfig.dimension}_lowest possible value`);
                            const highestValue = self.getNodeValue(x, `${self.dataConfig.dimension}_highest possible value`);
                            const source = self.getNodeValue(x, `${self.dataConfig.dimension}_source`);
                            const unit = self.getNodeValue(x, `${self.dataConfig.dimension}_unit`);
                            const label = self.getNodeValue(x, `${self.dataConfig.dimension}_label`);
                            const tileid = self.getTileId(x);
                            return { type, unit, name, highestValue, label, lowestValue, dimensionValue, source, tileid };
                        }));
                    }
                }
            }

            self.timeSpanValue = ko.observableArray();
            self.timeSpanData = ko.observableArray();

            if(self.dataConfig.timespan){
                if(params?.compiled){
                    self.timeSpanValue(params.data.timespan);
                } else {
                    const timeSpanData = self.getRawNodeValue(params.data(), self.dataConfig.timespan.nodegroup);
                    self.timeSpanData = ko.observable();
                    if(timeSpanData) {
                        const beginningStart = self.getNodeValue(timeSpanData, `timespan_begin of the begin`);
                        const beginningComplete = self.getNodeValue(timeSpanData, `timespan_begin of the end`);
                        const endingStart = self.getNodeValue(timeSpanData, `timespan_end of the begin`);
                        const endingComplete = self.getNodeValue(timeSpanData, `timespan_end of the end`);
        
                        const name = self.getNodeValue(timeSpanData, {
                            testPaths: [
                                [
                                    `timespan_name`, 
                                    `timespan_name_content`
                                ],
                                [
                                    `timespan_name`, 
                                    0,
                                    `timespan_name_content`
                                ]
                            ]});
                        const durationValue = self.getNodeValue(timeSpanData, `timespan_duration`, `timespan_duration_value`);
                        const durationUnit = self.getNodeValue(timeSpanData, `timespan_duration`, `timespan_duration_unit`);
                        const duration = `${durationValue} ${durationUnit.replace(/\([^()]*\)/g, '')}`
        
                        const durationEventName = self.getNodeValue(timeSpanData, {
                            testPaths: [
                                [`timespan_duration`, 
                                `timespan_duration_name`, 
                                `timespan_duration_name_content`],
                                [`timespan_duration`,
                                `timespan_duration_name`, 
                                0,
                                `timespan_duration_name_content`]
                            ]});
                        self.timeSpanValue({
                            beginningComplete, 
                            beginningStart, 
                            duration, 
                            durationEventName,
                            endingComplete, 
                            endingStart, 
                            name,
                        })
                    }
                    self.timeSpanData({
                        sections: [{
                            title: 'TimeSpan', 
                            data: [{
                                key: self.dataConfig.timespan.key,
                                value: self.timeSpanValue(),
                                card: self.cards.timespan,
                                type: 'timespan'
                            }]
                        }]
                    });
                }
            }
        },
        template: { require: 'text!templates/views/components/reports/scenes/substance.htm' }
    });
});