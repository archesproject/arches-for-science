define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'views/components/workflows/new-tile-step',
    'bindings/select2-query',
], function(_, $, arches, ko, koMapping, NewTileStep) {

    function viewModel(params) {
        if (!params.resourceid()) {
            params.resourceid(params.workflow.state.resourceid);
        }
        if (params.workflow.state.steps[params._index - 1]) {
            console.log("resourceid from prev step");
            console.log(params.workflow.state.steps[params._index - 1].resourceid);
            params.resourceid(params.workflow.state.steps[params._index - 1].resourceid);
            params.tileid(params.workflow.state.steps[params._index - 1].tileid);
        }
        NewTileStep.apply(this, [params]);

        var self = this;
        // this.paginator = ko.observable();
        // this.targetResource = ko.observable();
        // this.selectedTerm = ko.observable();
        // this.totalResults = ko.observable();
        // var limit = 10;
        // this.termOptions = [];
        // this.value = ko.observableArray([]);
        // this.startValue = null;
        // this.tile.subscribe(function(tile){
        //     this.startValue = tile.data[params.nodeid()]();
        //     if (this.startValue) {
        //         this.startValue.forEach(function(item){
        //             self.value.push(item);
        //         });
        //     }
        // });
        this.items = ko.observableArray([]);
        this.setresourceid = params.resourceid() || '';

        // this.updateTileData = function(val){
        //     var resourceid = val['_source']['resourceinstanceid'];
        //     var tilevalue = self.tile().data[params.nodeid()];
        //     var index = self.value().indexOf(resourceid);
        //     if (index > -1) {
        //         self.value.remove(resourceid);
        //     } else {
        //         self.value.push(resourceid);
        //     }
        //     if (self.value().length === 0 && self.startValue === null) {
        //         tilevalue(null);
        //     } else {
        //         tilevalue(self.value());
        //     }
        // };

        // this.dirty = ko.pureComputed(function(){
        //     return ko.unwrap(self.tile) ? self.tile().dirty() : false;
        // });

        this.selectIIIFTile = function(item, annotation) {
            params.tileid(annotation.tileid);
            params.resourceid(item.resourceid);
            console.log(item);
            console.log(annotation);
            params.getStateProperties();
            self.complete(true);
        };

        this.getData = function(){
            console.log(self.setresourceid);
            console.log(params.resourceid());
            $.ajax({
                url: arches.urls.physical_things_set,
                type: 'GET',
                data: { 
                    'resourceid': self.setresourceid,
                }
            }).done(function(data){
                self.items(data.items);
            });
        };

        this.getData();

        // this.targetResourceSelectConfig = {
        //     value: self.selectedTerm,
        //     placeholder: 'find a physical thing: enter an artist, object name, artwork title or object number',
        //     clickBubble: true,
        //     multiple: false,
        //     closeOnSlect: false,
        //     allowClear: true,
        //     ajax: {
        //         url: arches.urls.search_terms,
        //         dataType: 'json',
        //         quietMillis: 250,
        //         data: function(term, page) {
        //             var data = {
        //                 start: (page-1)*limit,
        //                 // eslint-disable-next-line camelcase
        //                 page_limit: limit,
        //                 q: term
        //             };
        //             return data;
        //         },
        //         results: function(data, page) {
        //             var results = data.terms;
        //             self.termOptions = results;
        //             return {
        //                 results: results,
        //                 more: data.count >= (page*limit)
        //             };
        //         }
        //     },
        //     id: function(item) {
        //         return item.id;
        //     },
        //     formatResult: function(item) {
        //         return item.text + ' (' + item.context_label + ')';
        //     },
        //     formatSelection: function(item) {
        //         return item.text + ' (' + item.context_label + ')';
        //     },
        //     clear: function() {
        //         self.selectedTerm();
        //     },
        //     isEmpty: ko.computed(function() {
        //         return self.selectedTerm() === '' || !self.selectedTerm();
        //     }, this),
        //     initSelection: function() {
        //         return;
        //     }
        // };

        // this.updateSearchResults = function(termFilter){
        //     var filters ={
        //         "paging-filter": 1
        //     };
        //     if (termFilter) {
        //         termFilter['inverted'] = false;
        //         filters["term-filter"] = JSON.stringify([termFilter]);
        //     }

        //     $.ajax({
        //         url: arches.urls.physical_thing_search_results,
        //         data: filters,
        //     }).done(function(data){
        //         self.paginator(data['paging_filter']);
        //         self.totalResults(data['total_results']);
        //         self.targetResources(data['results']['hits']['hits']);
        //     });
        // };

        // this.updateSearchResults();

        // this.selectedTerm.subscribe(function(val){
        //     var termFilter = self.termOptions[val];
        //     self.updateSearchResults(termFilter);
        // }); 

        params.getStateProperties = function(){
            var tileid = undefined;
            if (!!(ko.unwrap(params.tile))) {
                tileid = ko.unwrap(params.tile().tileid);
            } else if (!!(ko.unwrap(params.tileid))) {
                tileid = ko.unwrap(params.tileid);
            }
            return {
                resourceid: ko.unwrap(params.resourceid),
                tile: !!(ko.unwrap(params.tile)) ? koMapping.toJS(params.tile().data) : undefined,
                tileid: tileid,
            };
        };
    }

    ko.components.register('list', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/list.htm' }
    });
    return viewModel;
});
