define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'bindings/select2-query',
], function(_, $, arches, ko, koMapping) {

    function viewModel(params) {
        if (!params.resourceid()) {
            params.resourceid(params.workflow.state.resourceid);
        }
        if (params.workflow.state.steps[params._index]) {
            params.tileid(params.workflow.state.steps[params._index].tileid);
        }
        var self = this;
        this.paginator = ko.observable();
        this.physicalResource = ko.observable();
        this.selectedTerm = ko.observable();
        this.totalResults = ko.observable();
        this.physicalResources=ko.observableArray([]);
        this.physicalResourceSearchValue = ko.observable();
        var limit = 10;
        this.termOptions = [];
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

        var termFilterx = [{
            "context":"",
            "context_label":"Physical Thing - Name",
            "id":1,
            "text":"The Vexed Man",
            "type":"term",
            "value":"The Vexed Man",
            "inverted":false
        }];

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
                url: arches.urls.search_results,
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
