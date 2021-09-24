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

        },
        template: { require: 'text!templates/views/components/reports/scenes/substance.htm' }
    });
});