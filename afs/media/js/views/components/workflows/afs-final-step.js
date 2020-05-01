define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'views/components/workflows/final-step',
    'models/graph',
    'viewmodels/card',
    'viewmodels/provisional-tile',
    'viewmodels/alert'
], function(_, $, arches, ko, koMapping, FinalStep, GraphModel, CardViewModel, ProvisionalTileViewModel, AlertViewModel) {

    function viewModel(params) {
        var self = this;
        FinalStep.apply(this, [params]);
        self.loading(true);
        var url = arches.urls.api_card + (ko.unwrap(params.resourceid) || ko.unwrap(params.graphid));
        this.topCards = [];
        this.tile = ko.observable();
        this.card = ko.observable();
        params.tile = self.tile;
        this.resourceId = params.resourceid;
        this.workflowJSON = ko.observable();
        this.workflows = ko.observableArray();
        var flattenTree = function(parents, flatList) {
            _.each(ko.unwrap(parents), function(parent) {
                flatList.push(parent);
                var childrenKey = parent.tiles ? 'tiles' : 'cards';
                flattenTree(
                    ko.unwrap(parent[childrenKey]),
                    flatList
                );
            });
            return flatList;
        };
        this.getJSON = function() {
            $.ajax({
                type: "GET",
                url: arches.urls.plugin('init-workflow'),
                data: {
                    "json":true
                },
                context: self,
                success: function(data){
                    self.workflowJSON(data);
                },
                error: function(response) {
                    if(response.statusText !== 'abort'){
                        this.viewModel.alert(new AlertViewModel('ep-alert-red', arches.requestFailed.title, response.responseText));
                    }
                }
            });
        };

        this.getCardJSON = function() {
            $.getJSON(url, function(data) {
                var handlers = {
                    'after-update': [],
                    'tile-reset': []
                };
                var displayname = ko.observable(data.displayname);
                self.provisionalTileViewModel = new ProvisionalTileViewModel({
                    tile: self.tile,
                    reviewer: data.userisreviewer
                });
                var graphModel = new GraphModel({
                    data: {
                        nodes: data.nodes,
                        nodegroups: data.nodegroups,
                        edges: []
                    },
                    datatypes: data.datatypes
                });
                
                self.topCards = _.filter(data.cards, function(card) {
                    var nodegroup = _.find(data.nodegroups, function(group) {
                        return group.nodegroupid === card.nodegroup_id;
                    });
                    return !nodegroup || !nodegroup.parentnodegroup_id;
                }).map(function(card) {
                    params.nodegroupid = params.nodegroupid || card.nodegroup_id;
                    return new CardViewModel({
                        card: card,
                        graphModel: graphModel,
                        tile: null,
                        resourceId: self.resourceId,
                        displayname: displayname,
                        handlers: handlers,
                        cards: data.cards,
                        tiles: data.tiles,
                        provisionalTileViewModel: self.provisionalTileViewModel,
                        cardwidgets: data.cardwidgets,
                        userisreviewer: data.userisreviewer,
                        loading: self.loading
                    });
                });

                self.topCards.forEach(function(topCard) {
                    topCard.topCards = self.topCards;
                });

                flattenTree(self.topCards, []).forEach(function(item) {
                    if (item.constructor.name === 'CardViewModel' && item.nodegroupid === ko.unwrap(params.nodegroupid)) {
                        if (ko.unwrap(params.parenttileid) && item.parent && ko.unwrap(params.parenttileid) !== item.parent.tileid) {
                            return;
                        }
                        self.card(item);
                        self.tile(item.getNewTile());
                    }
                });

                self.loading(false);
            });
        };
        this.getJSON();
        this.getCardJSON();

        this.workflowJSON.subscribe(function(val){
            if(val) {
                self.workflows(val['config']['workflows'].map(function(wf){
                    wf.url = arches.urls.plugin(wf.slug);
                    return wf;
                }, this));
            }
        });

        params.getStateProperties = function(){
            return {
                resourceid: ko.unwrap(params.resourceid),
                tile: !!(params.tile) ? koMapping.toJS(params.tile().data) : undefined,
                tileid: !!(params.tile) ? ko.unwrap(params.tile().tileid): undefined
            };
        };
    }

    ko.components.register('afs-final-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/afs-final-step.htm' }
    });
    return viewModel;
});
