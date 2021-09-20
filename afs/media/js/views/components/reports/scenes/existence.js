define(['underscore', 'knockout', 'arches', 'utils/report','bindings/datatable'], function(_, ko, arches, reportUtils) {
    return ko.components.register('views/components/reports/scenes/existence', {
        viewModel: function(params) {
            var self = this;
            Object.assign(self, reportUtils);

            self.nameTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(4).fill(null)
            };

            self.identifierTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(3).fill(null)
            };            
            
            self.statementsTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(5).fill(null)
            };

            self.productionTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(7).fill(null)
            };

            self.dataConfig = {
                production: 'production',
            }

            self.cards = Object.assign({}, params.cards);
            self.edit = params.editTile || self.editTile;
            self.delete = params.deleteTile || self.deleteTile;
            self.add = params.addTile || self.addNewTile;
            self.events = params.events || ['production']
            self.eventData = {};
            self.productionParts = ko.observableArray();
            self.visible = {
                production: ko.observable(true),
                event: ko.observable(true)
            }
            Object.assign(self.dataConfig, params.dataConfig || {});

            const extractEventData = (existenceEvent) => {
                const existenceEventConfig = self.dataConfig[existenceEvent];
                let eventData = self.getRawNodeValue(params.data(), existenceEventConfig);
                self.eventData[existenceEvent] = eventObservables = {
                    names: ko.observableArray(),
                    identifiers: ko.observableArray(),
                    statements: ko.observableArray(),
                    timespan: ko.observable()
                };
                const rootCardConfig = self.cards[existenceEvent];
                const rootCard = rootCardConfig.card;
                const subCards = rootCardConfig.subCards;
                
                if(eventData) {
                    const eventNames = self.getRawNodeValue(eventData, `${existenceEventConfig}_name`);
                    if(eventNames.length){
                        eventObservables.names(eventNames.map(x => {
                            const name = self.getNodeValue(x, `${existenceEventConfig}_name_content`);
                            const type = self.getNodeValue(x, `${existenceEventConfig}_name_type`);
                            const language = self.getNodeValue(x, `${existenceEventConfig}_name_language`);
                            const tileid = x?.['@tile_id'];
                            return {language, name, tileid, type}
                        }));
                    }

                    const eventIdentifiers = self.getRawNodeValue(eventData, `${existenceEventConfig}_identifier`);
                    if(eventIdentifiers.length){
                        eventObservables.identifiers(eventIdentifiers.map(x => {
                            const name = self.getNodeValue(x, `${existenceEventConfig}_identifier_content`);
                            const type = self.getNodeValue(x, `${existenceEventConfig}_identifier_type`);
                            const tileid = x?.['@tile_id'];
                            return {name, tileid, type}
                        }));
                    }

                    const eventTime = self.getRawNodeValue(eventData, `${existenceEventConfig}_time`)
                    if(eventTime) {
                        const beginningStart = self.getNodeValue(eventTime, `${existenceEventConfig}_time_begin of the begin`);
                        const beginningComplete = self.getNodeValue(eventTime, `${existenceEventConfig}_time_begin of the end`);
                        const endingStart = self.getNodeValue(eventTime, `${existenceEventConfig}_time_end of the begin`);
                        const endingComplete = self.getNodeValue(eventTime, `${existenceEventConfig}_time_end of the end`);

                        const name = self.getNodeValue(eventTime, {
                            testPaths: [
                                [
                                    `${existenceEventConfig}_time_name`, 
                                    `${existenceEventConfig}_time_name_content`
                                ],
                                [
                                    `${existenceEventConfig}_time_name`, 
                                    0,
                                    `${existenceEventConfig}_time_name_content`
                                ]
                            ]});
                        const duration = self.getNodeValue(eventTime, `${existenceEventConfig}_time_duration`, `${existenceEventConfig}_time_duration_highest possible value`);
                        const durationEventName = self.getNodeValue(eventTime, {
                            testPaths: [
                                [`${existenceEventConfig}_time_duration`, 
                                `${existenceEventConfig}_time_duration_name`, 
                                `${existenceEventConfig}_time_duration_name_content`],
                                [`${existenceEventConfig}_time_duration`,
                                `${existenceEventConfig}_time_duration_name`, 
                                0,
                                `${existenceEventConfig}_time_duration_name_content`]
                            ]});
                        eventObservables.timespan({beginningComplete, beginningStart, duration, durationEventName, endingComplete, endingStart, name})
                    }

                    const eventStatement = self.getRawNodeValue(eventData, `${existenceEventConfig}_statement`);
                    if(eventStatement.length){
                        eventObservables.statements(eventStatement.map(x => {
                            const content = self.getNodeValue(x, `${existenceEventConfig}_statement_content`);
                            const name = self.getNodeValue(x, `${existenceEventConfig}_statement_name`, `${existenceEventConfig}_statement_name_content`);
                            const type = self.getNodeValue(x, `${existenceEventConfig}_statement_type`);
                            const language = self.getNodeValue(x, `${existenceEventConfig}_statement_language`);
                            const tileid = x?.['@tile_id'];
                            return {content, language, name, tileid, type}
                        }));
                    }
                    
                    eventObservables.creator = ko.observable(self.getNodeValue(eventData, `${existenceEventConfig}_carried out by`))
                    eventObservables.objectsUsed = ko.observable(self.getNodeValue(eventData, `${existenceEventConfig}_used object`));
                    eventObservables.techniques = ko.observable(self.getNodeValue(eventData, `${existenceEventConfig}_technique`));
                    eventObservables.location = ko.observable(self.getNodeValue(eventData, `${existenceEventConfig}_location`));
                    eventObservables.influence = ko.observable(self.getNodeValue(eventData, `${existenceEventConfig}_influence`));
                    eventObservables.name = ko.observable(self.getNodeValue(eventData, `${existenceEventConfig}_influence`));
                    eventObservables.tileid = eventData?.['@tile_id'];
                    const tileCards = self.createCardDictionary(rootCard.tiles().find(x => x.tileid == eventObservables.tileid).cards);
                    tileCards.name = tileCards?.[subCards.name];
                    tileCards.statement = tileCards?.[subCards.name];
                    tileCards.timespan = tileCards?.[subCards.name];
                    tileCards.identifier = tileCards?.[subCards.name];
                    eventObservables.cards = tileCards;
                    
                }
            }
            // if params.compiled is set and true, the user has compiled their own data.  Use as is.
            if(params?.compiled){
                self.eventData = params.data.eventData;
            } else {
                for(existenceEvent of self.events){
                    extractEventData(existenceEvent);
                }
            }
            
        },
        template: { require: 'text!templates/views/components/reports/scenes/existence.htm' }
    });
});