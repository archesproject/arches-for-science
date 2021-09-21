define([
    'underscore', 
    'knockout', 
    'arches', 
    'utils/resource', 
    'utils/physical-thing', 
    'utils/report',
    'bindings/datatable', 
    'views/components/reports/scenes/name', 
    'views/components/reports/scenes/description', 
    'views/components/reports/scenes/documentation', 
    'views/components/reports/scenes/existence', 
    'views/components/reports/scenes/substance', 
    'views/components/reports/scenes/actor-relations'], function(_, ko, arches, resourceUtils, physicalThingUtils, reportUtils) {
    return ko.components.register('physical-thing-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);
            self.sections = [
                {'id': 'name', 'title': 'Names and Classifications'}, 
                {'id': 'existence', 'title': 'Existence'},
                {'id': 'substance', 'title': 'Substance'},
                {'id': 'actor-relations', 'title': 'Actor Relations'},
                {'id': 'description', 'title': 'Description'},
                {'id': 'documentation', 'title': 'Documentation'},
            ];
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('substance');
            self.nameCards = {};
            self.descriptionCards = {};
            self.documentationCards = {};
            self.existenceEvents = ['production', 'destruction', 'removal from object'];
            self.existenceDataConfig = {'destruction': 'destruction', 'removal from object': 'removal from object'};
            self.existenceCards = {};
            self.substanceCards = {};
            self.actorCards = {};

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards);

                if(self.cards?.["production (partitioned)"]) {
                    const productionEventChildren = self.cards["production (partitioned)"].tiles()?.[0]?.cards ? self.cards["production (partitioned)"].tiles()[0].cards : self.cards["production (partitioned)"].cards();
                    self.cards["production (partitioned)"].children = self.createCardDictionary(productionEventChildren);
                }

                self.nameCards = {
                    name: self.cards.name,
                    identifier: self.cards.identifier,
                    exactMatch: self.cards.exactmatch,
                    type: self.cards.classification
                };

                self.descriptionCards = {
                    statement: self.cards.statement
                };

                self.documentationCards = {
                    digitalReference: self.cards?.["digital reference"],
                    subjectOf: self.cards?.["subject of"]
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
                },

                self.substanceCards = {
                    dimension: self.cards.dimension
                }

                self.actorCards = {
                    owner: self.cards["current owner"]
                }
            }

            self.additionalData = ko.observableArray([{
                key: 'material', 
                value: self.getNodeValue(self.resource(), 'material'), 
                card: self.cards?.["material(s)"],
                type: 'kv'
            }]);

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