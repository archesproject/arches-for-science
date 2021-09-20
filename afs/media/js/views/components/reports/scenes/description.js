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
                        const type = self.getRawNodeValue(x, "statement_type") ? self.getNodeValue(x, "statement_type")
                            : self.getRawNodeValue(x, "type") ? self.getNodeValue(x, "type") 
                            : self.getNodeValue(x, `${self.dataConfig.statement.toLowerCase()}_type`);
                        const content = self.getRawNodeValue(x, "statement_content") ? self.getNodeValue(x, "statement_content") 
                            : self.getRawNodeValue(x, "content") ? self.getNodeValue(x, "content") 
                            : self.getNodeValue(x, `${self.dataConfig.statement.toLowerCase()}_content`);
                        const language = self.getRawNodeValue(x, "statement_language") ? self.getNodeValue(x, "statement_language") 
                            : self.getRawNodeValue(x, "language") ? self.getNodeValue(x, "language") 
                            : self.getNodeValue(x, `${self.dataConfig.statement.toLowerCase()}_language`);
                        const label = self.getRawNodeValue(x, "statement_label") ? self.getNodeValue(x, "statement_label") 
                            : self.getRawNodeValue(x, "label") ? self.getNodeValue(x, "label") 
                            : self.getNodeValue(x, `${self.dataConfig.statement.toLowerCase()}_label`);
                        const source = self.getRawNodeValue(x, "statement_source") ? self.getNodeValue(x, "statement_source") 
                            : self.getRawNodeValue(x, "source") ? self.getNodeValue(x, "source") 
                            : self.getNodeValue(x, `${self.dataConfig.statement.toLowerCase()}_source`);
                        const nameCardn = self.getRawNodeValue(x, "statement_name", 0, 'statement_name_content') ? self.getRawNodeValue(x, "statement_name", 0, 'statement_name_content') 
                            : self.getRawNodeValue(x, "name", 0, 'content') ? self.getRawNodeValue(x, "name", 0, 'content')
                            : self.getRawNodeValue(x, `${self.dataConfig.statement.toLowerCase()}_name`, 0, `${self.dataConfig.statement.toLowerCase()}_name_content`);
                        const nameCard1 = self.getRawNodeValue(x, "statement_name", 'statement_name_content') ? self.getRawNodeValue(x, "statement_name", 'statement_name_content') 
                            : self.getRawNodeValue(x, "name", 'content') ? self.getRawNodeValue(x, "name", 'content')
                            : self.getRawNodeValue(x, `${self.dataConfig.statement.toLowerCase()}_name`, `${self.dataConfig.statement.toLowerCase()}_name_content`);
                        const name = nameCardn ? self.processRawValue(nameCardn) : self.processRawValue(nameCard1);
                        const tileid = x?.['@tile_id'];
                        return { type, content, name, language, label, source, tileid };
                    }));
                }

            } 

        },
        template: { require: 'text!templates/views/components/reports/scenes/description.htm' }
    });
});