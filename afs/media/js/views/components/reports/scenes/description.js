define(['underscore', 'knockout', 'arches', 'utils/report','bindings/datatable'], function(_, ko, arches, reportUtils) {
    return ko.components.register('views/components/reports/scenes/description', {
        viewModel: function(params) {
            var self = this;
            Object.assign(self, reportUtils);

            self.statementTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(7).fill(null)
            };

            self.dataConfig = {
                statement: 'Statement',
            }

            self.cards = Object.assign({}, params.cards);
            self.edit = params.editTile || self.editTile;
            self.delete = params.deleteTile || self.deleteTile;
            self.add = params.addTile || self.addNewTile;
            self.statements = ko.observableArray();
            self.visible = {
                statements: ko.observable(true),
            }
            Object.assign(self.dataConfig, params.dataConfig || {});

            // if params.compiled is set and true, the user has compiled their own data.  Use as is.
            if(params?.compiled){
                self.statements(params.data.statements);
            } else {
                let statementData = params.data()[self.dataConfig.statement];
                
                if(statementData) {
                    if(statementData.length === undefined){
                        statementData = [statementData];
                    }

                    self.statements(statementData.map(x => {
                        const type = self.getNodeValue(x, {
                            testPaths: [
                                [`${self.dataConfig.statement.toLowerCase()}_type`], 
                                ['type']
                            ]});
                        const content = self.getNodeValue(x, {
                            testPaths: [
                                [`${self.dataConfig.statement.toLowerCase()}_content`], 
                                ['content']
                            ]});
                        const language = self.getNodeValue(x, {
                            testPaths: [
                                [`${self.dataConfig.statement.toLowerCase()}_language`], 
                                ['language']
                            ]});
                        const label = self.getNodeValue(x, {
                            testPaths: [
                                [`${self.dataConfig.statement.toLowerCase()}_label`], 
                                ['label']
                            ]});
                        const source = self.getNodeValue(x, {
                            testPaths: [
                                [`${self.dataConfig.statement.toLowerCase()}_source`], 
                                ['source']
                            ]});
                        const name = self.getNodeValue(x, {
                            testPaths: [
                                [`${self.dataConfig.statement.toLowerCase()}_name`, 0, `${self.dataConfig.statement.toLowerCase()}_name_content`], 
                                [`${self.dataConfig.statement.toLowerCase()}_name`, `${self.dataConfig.statement.toLowerCase()}_name_content`],
                                ["name", 0, 'content'], 
                                ["name", 'content']
                            ]});
                        const tileid = x?.['@tile_id'];
                        return { type, content, name, language, label, source, tileid };
                    }));
                }

            } 

        },
        template: { require: 'text!templates/views/components/reports/scenes/description.htm' }
    });
});