define(['underscore',
    'knockout',
    'templates/views/components/reports/scenes/description.htm',
    'arches',
    'utils/report','bindings/datatable'
], function(_, ko, descriptionSceneTemplate, arches, reportUtils) {
    return ko.components.register('views/components/reports/scenes/description', {
        viewModel: function(params) {
            var self = this;
            Object.assign(self, reportUtils);

            self.statementTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(4).fill(null)
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

            self.requestedTypes = params.requestedTypes;
            self.excludedTypes = params.excludedTypes;

            // if params.compiled is set and true, the user has compiled their own data.  Use as is.
            if(params?.compiled){
                self.statements(params.data.statements);
            } else {
                let statementData = params.data()[self.dataConfig.statement];

                if(statementData) {
                    if(statementData.length === undefined){
                        statementData = [statementData];
                    }

                    self.statements(statementData.reduce((result, x) => {
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


                        const tileid = self.getTileId(x);

                        const types = type.split(",");

                        if (!!self.requestedTypes && !Array.isArray(self.requestedTypes)) {
                            self.requestedTypes = [self.requestedTypes];
                        }
                        if (
                            (!self.requestedTypes && !self.excludedTypes) ||
                            (self.requestedTypes && _.intersection(types, self.requestedTypes).length > 0) ||
                            (self.excludedTypes && _.intersection(types, self.excludedTypes).length == 0)
                        ) {
                            result.push({
                                type: type, 
                                content: content,
                                language: language,
                                tileid: tileid
                            })
                        }
                        return result;
                    }, []));
                }
            } 

        },
        template: descriptionSceneTemplate
    });
});