define(['underscore', 'knockout', 'arches', 'utils/resource', 'utils/physical-thing', 'utils/report','bindings/datatable', 'views/components/reports/scenes/name', 'views/components/reports/scenes/description', 'views/components/reports/scenes/documentation', 'views/components/reports/scenes/existence'], function(_, ko, arches, resourceUtils, physicalThingUtils, reportUtils) {
    return ko.components.register('physical-thing-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);
            self.sections = [
                {'id': 'name', 'title': 'Names and Classifications'}, 
                {'id': 'existence', 'title': 'Existence'},
                {'id': 'description', 'title': 'Description'},
                {'id': 'documentation', 'title': 'Documentation'},
            ];
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('existence');
            self.nameCards = {};
            self.descriptionCards = {};
            self.documentationCards = {};
            self.existenceEvents = ['production', 'destruction', 'removal from object'];
            self.existenceDataConfig = {'destruction': 'destruction', 'removal from object': 'removal from object'};
            self.existenceCards = {};

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards);

                if(self.cards?.["Production (partitioned)"]) {
                    const productionEventChildren = self.cards["Production (partitioned)"].tiles()?.[0]?.cards ? self.cards["Production (partitioned)"].tiles()[0].cards : self.cards["Production (partitioned)"].cards();
                    self.cards["Production (partitioned)"].children = self.createCardDictionary(productionEventChildren);
                }

                self.nameCards = {
                    name: self.cards.Name,
                    identifier: self.cards.Identifier,
                    exactMatch: self.cards.ExactMatch,
                    type: self.cards.Classification
                };

                self.descriptionCards = {
                    statement: self.cards.Statement
                };

                self.documentationCards = {
                    digitalReference: self.cards?.["Digital Reference"],
                    subjectOf: self.cards?.["Subject Of"]
                };
                self.existenceCards = {
                    production: {
                        card: self.cards?.["production (partitioned)"],
                        subCards: {
                            name: 'name for production event',
                            identifier: 'identifier for production event',
                            timespan: 'timespan of production event',
                            statement: 'statement about production event',
                            part: 'production event part'
                        }
                    },
                    destruction: {
                        card:  self.cards?.["destruction"],
                        subCards: {
                            name: 'name for destruction event',
                            identifier: 'identifier for destruction event',
                            timespan: 'timespan of destruction event',
                            statement: 'statement about destruction event'
                        }
                    },
                    'removal from object': { 
                        card: self.cards?.["removal from object"],
                        subCards: {
                            name: 'name for part removal event',
                            identifier: 'identifier for part removal event',
                            timespan: 'timespan of removal from object',
                            statement: 'statement about part removal event'
                        }
                    },
                }
            }

            self.blockVisible = {
                production: {
                    event: ko.observable(true)
                }
            };
            self.resourceData = {
                production: {
                    name: ko.observable(),
                    location: ko.observable(),
                    creator: ko.observable(),
                    techniques: ko.observable(),
                    objectsUsed: ko.observable(),
                    influence: ko.observable(),
                    names: ko.observableArray(),
                    parts: ko.observableArray(),
                    statements: ko.observableArray(),
                    identifiers: ko.observableArray(),
                    timespan: ko.observable()
                }
            }

                //Statements Table
            self.statementsTableConfig = {
                "responsive": true,
                "paging": false,
                "searching": false,
                "scrollCollapse": true,
                "info": false,
                "columnDefs": [ {
                    "orderable": false,
                    "targets":   -1
                } ],
                "columns": Array(5).fill(null)
            };

            const loadData = (resource) => {
                const productionData = resource?.["Production "];
                if(productionData) {
                    const productionNames = productionData?.['Production_name']
                    if(productionNames.length){
                        self.resourceData.production.names(productionNames.map(x => {
                            const name = self.getNodeValue(x, 'Production_name_content');
                            const type = self.getNodeValue(x, 'Production_name_type');
                            const language = self.getNodeValue(x, 'Production_name_language');
                            const tileid = x?.['@tile_id'];
                            return {language, name, tileid, type}
                        }));
                    }

                    const productionIdentifiers = productionData?.['Production_identifier']
                    if(productionIdentifiers.length){
                        self.resourceData.production.identifiers(productionIdentifiers.map(x => {
                            const name = self.getNodeValue(x, 'Production_identifier_content');
                            const type = self.getNodeValue(x, 'Production_identifier_type');
                            const tileid = x?.['@tile_id'];
                            return {name, tileid, type}
                        }));
                    }
                    self.resourceData.production.creator(self.getNodeValue(productionData, 'Production_carried out by'))
                    self.resourceData.production.objectsUsed(self.getNodeValue(productionData, 'Production_used object'));
                    self.resourceData.production.techniques(self.getNodeValue(productionData, 'Production_technique'));
                    self.resourceData.production.location(self.getNodeValue(productionData, 'Production_location'));
                    self.resourceData.production.influence(self.getNodeValue(productionData, 'Production_influence'));
                    self.resourceData.production.name(self.getNodeValue(productionData, 'Production_influence'));
                    self.resourceData.production.tileid = productionData?.['@tile_id'];

                    const productionTime = productionData?.['Production_time'];
                    if(productionTime) {
                        const beginningStart = self.getNodeValue(productionTime, 'Production_time_begin of the begin');
                        const beginningComplete = self.getNodeValue(productionTime, 'Production_time_begin of the end');
                        const endingStart = self.getNodeValue(productionTime, 'Production_time_end of the begin');
                        const endingComplete = self.getNodeValue(productionTime, 'Production_time_end of the end');

                        // TODO: check with cyrus/Dennis on name/Duration and why it isn't populated
                        const name = self.getNodeValue(productionTime, 'Production_time_name', 'Production_time_name_content');
                        const duration = self.getNodeValue(productionTime, 'Production_time_duration', 'Production_time_duration_highest possible value');
                        const durationEventName = self.getNodeValue(productionTime, 'Production_time_duration', 'Production_time_duration_Name', 'Production_time_duration_Name_content');
                        self.resourceData.production.timespan({beginningComplete, beginningStart, duration, durationEventName, endingComplete, endingStart, name})
                    }

                    const productionStatement = productionData?.['Production_Statement'];
                    if(productionStatement.length){
                        self.resourceData.production.statements(productionStatement.map(x => {
                            const content = self.getNodeValue(x, 'Production_Statement_content');
                            const name = self.getNodeValue(x, 'Production_Statement_name', 'Production_Statement_name_content');
                            const type = self.getNodeValue(x, 'Production_Statement_type');
                            const language = self.getNodeValue(x, 'Production_Statement_language');
                            const tileid = x?.['@tile_id'];
                            return {content, language, name, tileid, type}
                        }));
                    }                    

                    const parts = productionData?.['Production_part']
                    if(parts.length){
                        self.resourceData.production.parts(parts.map(x => {
                            const creator = self.getNodeValue(x, 'Production_part_carried out by');
                            const objectsUsed = self.getNodeValue(x, 'Production_part_used');
                            const technique = self.getNodeValue(x, 'Production_part_technique');
                            const location = self.getNodeValue(x, 'Production_part_location');
                            const influence = self.getNodeValue(x, 'Production_part_influence');
                            const name = self.getNodeValue(x, 'Production_part_name', 'Production_part_name_content');
                            const nameLanguage = self.getNodeValue(x, 'Production_part_name', 'Production_part_name_language');
                            const nameType = self.getNodeValue(x, 'Production_part_name', 'Production_part_name_type');
                            const statementContent = self.getNodeValue(x, 'Production_part_Statement', 'Production_part_Statement_content');
                            const statementLanguage = self.getNodeValue(x, 'Production_part_Statement', 'Production_part_Statement_language');
                            const statementName = self.getNodeValue(x, 'Production_part_Statement', 'Production_part_Statement_name', 'Production_part_Statement_name_content');
                            const statementType = self.getNodeValue(x, 'Production_part_Statement', 'Production_part_Statement_type');
                            const identifier = self.getNodeValue(x, 'Production_part_identifier', 'Production_part_identifier_content');
                            const identifierType = self.getNodeValue(x,'Production_part_identifier','Production_part_identifier_type');
                            const tileid = x?.['@tile_id'];
                            const time = x?.['Production_part_time'];
                            const names = [{name, nameType, nameLanguage}];
                            const statements = [{statementContent, statementLanguage, statementName, statementType}];
                            const identifiers = [{identifier, identifierType}]
                            
                            const tile = self?.cards?.["Production (partitioned)"]?.children?.["Production Event Part "]?.tiles().find(x => x.tileid == tileid)
                            const eventCards = {};
                            let selectedObservable = undefined;
                            if(tile){
                                eventCards.timespan = tile.cards.find(x => x.nodegroupid == 'cc157e05-b497-11e9-8f5a-a4d18cec433a');
                                eventCards.name = tile.cards.find(x => x.nodegroupid == 'cc157e05-b497-11e9-8f5a-a4d18cec433a');
                                eventCards.identifier = tile.cards.find(x => x.nodegroupid == 'cc155257-b497-11e9-9ed7-a4d18cec433a');
                                eventCards.statements = tile.cards.find(x => x.nodegroupid == '7ae6204a-bee9-11e9-bd2a-a4d18cec433a');
                                selectedObservable = tile.selected;
                            }
                            const expanded = ko.observable(true);

                            let timespan = {};
                            if(time){
                                const beginningStart = self.getNodeValue(time, 'Production_part_time_begin of the begin');
                                const beginningComplete = self.getNodeValue(time, 'Production_part_time_begin of the end');
                                const endingStart = self.getNodeValue(time, 'Production_part_time_end of the begin');
                                const endingComplete = self.getNodeValue(time, 'Production_part_time_end of the end');

                                // TODO: check with cyrus/Dennis on name/Duration and why it isn't populated
                                const name = self.getNodeValue(time, 'Production_part_time_name', 'Production_part_time_name_content');
                                const duration = self.getNodeValue(time, 'Production_part_time_duration', 'Production_part_time_duration_highest possible value');
                                const durationEventName = self.getNodeValue(time, 'Production_part_name_time_duration', 'Production_part_name_time_duration_Name', 'Production_time_duration_Name_content');
                                timespan = {beginningComplete, beginningStart, duration, durationEventName, eventCards, endingComplete, endingStart, name};
                            }
                            return {creator, eventCards, expanded, identifiers, objectsUsed, technique, location, name, influence, selectedObservable, tileid, timespan, names, statements}
                        }));
                    }
                }
            }

            loadData(self.resource());

            if (params.summary) {
                const IdentifierContentnodeid = '22c169b5-b498-11e9-bdad-a4d18cec433a';
                const IdentifierType = '22c15cfa-b498-11e9-b5e3-a4d18cec433a';
                const GallerySystemsTMSid = '26094e9c-2702-4963-adee-19ad118f0f5a';
                const CreatorProductionEvent = 'cc16893d-b497-11e9-94b0-a4d18cec433a';
                const Statement = '1953016e-b498-11e9-9445-a4d18cec433a';
                const PartOfSet = '63e49254-c444-11e9-afbe-a4d18cec433a';
                const StatementType = '1952e470-b498-11e9-b261-a4d18cec433a';
                this.gallerySystemsTMSid = resourceUtils.getNodeValues({
                    nodeId: IdentifierContentnodeid,
                    where: {
                        nodeId: IdentifierType,
                        contains: GallerySystemsTMSid
                    },
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);

                this.artists = ko.observableArray([]);
                this.artistObjects = resourceUtils.getNodeValues({
                    nodeId: CreatorProductionEvent,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);
                this.artistObjects.forEach(function(artistObject) {
                    resourceUtils.lookupResourceInstanceData(artistObject['resourceId'])
                        .then(function(data) {
                            self.artists.push({ name: data._source.displayname, link: arches.urls.resource + '/' + artistObject['resourceId'] });
                        });
                });

                var DescriptionConceptvalueid = 'df8e4cf6-9b0b-472f-8986-83d5b2ca28a0';
                this.description = resourceUtils.getNodeValues({
                    nodeId: Statement,
                    where: {
                        nodeid: StatementType,
                        contains: DescriptionConceptvalueid
                    },
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);


                this.activities = ko.observableArray();
                var collectionSet = resourceUtils.getNodeValues({
                    nodeId: PartOfSet,
                    returnTiles: false
                }, this.report.get('tiles'), this.report.graph);
                collectionSet.forEach(function(relatedResourceItem) {
                    resourceUtils.lookupResourceInstanceData(relatedResourceItem.resourceId)
                        .then(function(data) {
                            self.activities.push({ name: data._source.displayname, link: arches.urls.resource + '/' + relatedResourceItem.resourceId });
                        });
                });


                var getLabel = function(object) {
                    var label = object.label;
                    if (Array.isArray(label)) {
                        label = object.label[0]["@value"];
                    }
                    return label;
                };

                this.manifests = ko.observableArray();
                var parseManifestJson = function(manifestData) {
                    var sequences = manifestData ? manifestData.sequences : [];
                    var canvases = [];
                    sequences.forEach(function(sequence) {
                        if (sequence.canvases) {
                            sequence.label = getLabel(sequence);
                            sequence.canvases.forEach(function(canvas) {
                                canvas.label = getLabel(canvas);
                                if (typeof canvas.thumbnail === 'object')
                                    canvas.thumbnail = canvas.thumbnail["@id"];
                                else if (canvas.images && canvas.images[0] && canvas.images[0].resource)
                                    canvas.thumbnail = canvas.images[0].resource["@id"];
                                canvases.push(canvas);
                            });
                        }
                    });
                    self.manifests.push(manifestData);
                    return canvases;
                };

                var getManifestData = function(manifestURLs) {
                    manifestURLs.forEach(function(manifestURL) {
                        window.fetch(manifestURL)
                            .then(function(response) {
                                return response.json();
                            })
                            .then(function(manifestData) {
                                parseManifestJson(manifestData);
                            });
                    });
                };

                physicalThingUtils.getManifests(this.report.get('tiles')).then(function(manifests) {
                    getManifestData(manifests);
                });
            }
        },
        template: { require: 'text!templates/views/components/reports/physical-thing.htm' }
    });
});