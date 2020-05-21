define(['underscore', 'knockout', 'arches', 'viewmodels/tabbed-report', 'utils/resource'], function(_, ko, arches, TabbedReportViewModel, resourceUtils) {
    return ko.components.register('physical-thing-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            TabbedReportViewModel.apply(this, [params]);

            if (params.summary) {
                this.showTitleBar = params.showTitleBar || false;

                this.getValue = function(queryClause, graph, tiles) {
                    var nodeId;
                    var foundTiles = [];
                    var returnTiles = !!queryClause.returnTiles;

                    var resolveWidgetLabel = function(cardWidgetPath, cards, widgets) {
                        var cardName, cardids;
                        var widgetLabel = '';
                        var widgets = graph.widgets;
                        var parts = cardWidgetPath.split('.');
                        if (parts.length === 1) {
                            widgetLabel = parts[0];
                        } else if (parts.length === 2) {
                            cardName = parts[0];
                            widgetLabel = parts[1];
                        }

                        if (!!cardName) {
                            cardids = cards.filter(function(card) {
                                return card.name === cardName;
                            }).map(function(card) {
                                return card.cardid;
                            });

                            widgets = widgets.filter(function(widget) {
                                return cardids.includes(widget.card_id);
                            });
                        }

                        var nodeId = widgets.filter(function(widget) {
                            return widget.label === widgetLabel;
                        }).map(function(widget) {
                            return widget.node_id;
                        });

                        return nodeId;
                    }

                    if (!!queryClause.nodeId) {
                        nodeId = [queryClause.nodeId];
                    } else if (!!queryClause.nodeName) {
                        node = graph.nodes.find(function(node) {
                            return node.name === queryClause.nodeName;
                        });
                        if (!!node) {
                            nodeId = node.nodeid;
                        }
                    } else if (!!queryClause.widgetLabel) {
                        nodeId = resolveWidgetLabel(queryClause.widgetLabel, graph.cards, graph.widgets);
                    };

                    if (!!nodeId && nodeId.length === 1) {
                        nodeId = nodeId[0];
                        foundTiles = tiles.filter(function(tile) {
                            return Object.keys(tile.data).includes(nodeId);
                        });
                        if (!!queryClause.where) {
                            if (!!queryClause.where.nodeId) {
                                foundTiles = foundTiles.filter(function(tile) {
                                    if (!!queryClause.where.contains) {
                                        return tile.data[queryClause.where.nodeId].includes(queryClause.where.contains);
                                    }
                                    return false;
                                });
                            } else if (!!queryClause.where.widgetLabel) {
                                var whereNodeId = resolveWidgetLabel(queryClause.where.widgetLabel, graph.cards, graph.widgets);
                                if (!!whereNodeId && whereNodeId.length === 1) {
                                    foundTiles = foundTiles.filter(function(tile) {
                                        if (!!queryClause.where.contains) {
                                            return tile.data[whereNodeId].includes(queryClause.where.contains);
                                        }
                                        return false;
                                    });
                                }
                            }
                        }

                        if (returnTiles) {
                            return foundTiles;
                        } else {
                            return foundTiles.map(function name(tile) {
                                return tile.data[nodeId];
                            })
                        }
                    }
                    return undefined;
                };

                const Identifier_Content_nodeid = '22c169b5-b498-11e9-bdad-a4d18cec433a';
                const Identifier_Type = '22c15cfa-b498-11e9-b5e3-a4d18cec433a';
                const GallerySystemsTMSid = '26094e9c-2702-4963-adee-19ad118f0f5a';
                this.gallerySystemsTMSid = this.getValue({
                    nodeId: Identifier_Content_nodeid,
                    where: {
                        nodeId: Identifier_Type,
                        contains: GallerySystemsTMSid
                    },
                    returnTiles: false
                }, this.report.graph, this.report.get('tiles'));


                const DescriptionConceptValueId = 'df8e4cf6-9b0b-472f-8986-83d5b2ca28a0';
                this.description = this.getValue({
                    widgetLabel: 'Statement about Thing.Text of Statement',
                    where: {
                        widgetLabel: 'Statement about Thing.Type of Statement',
                        contains: DescriptionConceptValueId
                    },
                    returnTiles: false
                }, this.report.graph, this.report.get('tiles'));

                this.collectionSet = this.getValue({
                    widgetLabel: 'In Collection or Set.member of',
                    returnTiles: false
                }, this.report.graph, this.report.get('tiles'));

                console.log(this.collectionSet);

                this.activities = ko.observableArray();
                this.collectionSet.forEach(function(resourceid) {
                    resourceUtils.lookupResourceInstanceData(resourceid)
                        .then(function(data) {
                            self.activities.push({ name: data._source.displayname, link: arches.urls.resource + '/' + resourceid });
                        })
                })
            }
        },
        template: { require: 'text!templates/views/components/reports/physical-thing.htm' }
    });
});