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
            console.log("setting params.resourceid");
            params.resourceid(params.workflow.state.steps[params._index - 1].resourceid);
        }
        if (params.workflow.state.steps[params._index - 1]) {
            console.log("setting params.tileid");
            console.log(params.workflow.state.steps[params._index - 1].tileid);
            params.tileid(params.workflow.state.steps[params._index - 1].tileid);
        }
        NewTileStep.apply(this, [params]);

        var self = this;
        // this.paginator = ko.observable();
        this.targetResource = ko.observable();
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


        // this.updateSearchResults();

        // this.selectedTerm.subscribe(function(val){
        //     var termFilter = self.termOptions[val];
        //     self.updateSearchResults(termFilter);
        // }); 

        params.getStateProperties = function(){
            return {
                resourceid: ko.unwrap(params.resourceid),
                tile: !!(ko.unwrap(params.tile)) ? koMapping.toJS(params.tile().data) : undefined,
                tileid: !!(ko.unwrap(params.tile)) ? ko.unwrap(params.tile().tileid): undefined,
            };
        };
    }

    ko.components.register('iiif-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/new-tile-step.htm' }
    });
    return viewModel;
});
