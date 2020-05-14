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
        NewTileStep.apply(this, [params]);
        // if (!params.resourceid()) {
        //     params.resourceid(params.workflow.state.resourceid);
        // }
        // if (params.workflow.state.steps[params._index]) {
        //     params.tileid(params.workflow.state.steps[params._index].tileid);
        // }
        params.tile.subscribe(function(val){
            console.log('I got one')
            console.log(val);
        })
        var self = this;
        this.paginator = ko.observable();
        this.physicalResource = ko.observable();
        this.selectedTerm = ko.observable();
        this.totalResults = ko.observable();
        this.physicalResources=ko.observableArray([]);
        this.physicalResourceSearchValue = ko.observable();
        var limit = 10;
        this.termOptions = [];
        this.value = ko.observableArray([]);
        this.startValue = null;
        var getStartData = this.tile.subscribe(function(tile){
            this.startValue = tile.data[params.nodeid()]();
            console.log(this.startValue);
        });

        this.addItemToTile = function(val){
            var resourceid = val['_source']['resourceinstanceid'];
            var tilevalue = self.tile().data[params.nodeid()];
            var index = self.value().indexOf(resourceid);
            if (index > -1) {
                self.value.remove(resourceid);
            } else {
                self.value.push(resourceid);
            }
            if (self.value().length === 0 && self.startValue === null) {
                tilevalue(null);
            } else {
                tilevalue(self.value());
            }
        };

        this.dirty = ko.pureComputed(function(){
            return ko.unwrap(self.tile) ? self.tile().dirty() : false;
        });

        this.dirty.subscribe(function(a){
            console.log(a);
        });

        this.submit = function(){
            $.ajax({
                url: arches.urls.api_tiles,
                type: 'POST',
                data: {
                    'nodeid': params.nodeid(),
                    'data': JSON.stringify(self.value()),
                    'resourceinstanceid': self.tile().resourceinstance_id
                }
            }).done(function(data){
                console.log(data);
            });
        }

        this.physicalResourceSelectConfig = {
            value: self.selectedTerm,
            placeholder: 'find a physical thing: enter an artist, object name, artwork title or object number',
            clickBubble: true,
            multiple: false,
            closeOnSlect: false,
            allowClear: true,
            ajax: {
                url: arches.urls.search_terms,
                dataType: 'json',
                quietMillis: 250,
                data: function(term, page) {
                    var data = {
                        start: (page-1)*limit,
                        // eslint-disable-next-line camelcase
                        page_limit: limit,
                        q: term
                    };
                    return data;
                },
                results: function(data, page) {
                    var results = data.terms;
                    self.termOptions = results;
                    return {
                        results: results,
                        more: data.count >= (page*limit)
                    };
                }
            },
            id: function(item) {
                return item.id;
            },
            formatResult: function(item) {
                return item.text + ' (' + item.context_label + ')';
            },
            formatSelection: function(item) {
                return item.text + ' (' + item.context_label + ')';
            },
            clear: function() {
                self.selectedTerm();
            },
            isEmpty: ko.computed(function() {
                return self.selectedTerm() === '' || !self.selectedTerm();
            }, this),
            initSelection: function() {
                return;
            }
        };

        var resourceTypeFilter = [{
            "graphid":"9519cb4f-b25b-11e9-8c7b-a4d18cec433a",
            "inverted":false
        }];

        this.updateSearchResults = function(termFilter){
            var filters ={
                "paging-filter": 1,
                "resource-type-filter": JSON.stringify(resourceTypeFilter),
            };
            if (termFilter) {
                termFilter['inverted'] = false;
                filters["term-filter"] = JSON.stringify([termFilter]);
            }

            $.ajax({
                url: arches.urls.physical_thing_search_results,
                data: filters,
            }).done(function(data){
                self.paginator(data['paging_filter']);
                self.totalResults(data['total_results']);
                self.physicalResources(data['results']['hits']['hits']);
            });
        };

        this.updateSearchResults();
        this.selectedTerm.subscribe(function(val){
            var termFilter = self.termOptions[val];
            self.updateSearchResults(termFilter);
        }); 

        this.workflowStepClass = ko.unwrap(params.class());
        params.getStateProperties = function(){
            return {
                resourceid: ko.unwrap(params.resourceid),
                tile: !!(ko.unwrap(params.tile)) ? koMapping.toJS(params.tile().data) : undefined,
                tileid: !!(ko.unwrap(params.tile)) ? ko.unwrap(params.tile().tileid): undefined,
            };
        };
    }

    ko.components.register('object-search-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/object-search-step.htm' }
    });
    return viewModel;
});
