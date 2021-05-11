define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'viewmodels/card-component'
], function(_, $, arches, ko, koMapping, CardComponentViewModel) {
    function viewModel(params) {
        var self = this;

        CardComponentViewModel.apply(self, [params]);

        this.earliestStartDateNode = '03357892-1d9d-11eb-a29f-024e0d439fdb'; //begin of the begin
        this.latestStartDateNode = '033578a1-1d9d-11eb-a29f-024e0d439fdb'; //end of the begin
        this.earliestEndDateNode = '0335789d-1d9d-11eb-a29f-024e0d439fdb'; //begin of the end
        this.latestEndDateNode = '033578c2-1d9d-11eb-a29f-024e0d439fdb'; //end of the end

        console.log(this.tile);

        this.tile.data[self.earliestStartDateNode].subscribe(function(val) {
            self.tile.data[self.latestStartDateNode](val);
            self.tile.data[self.earliestEndDateNode](val);
            self.tile.data[self.latestEndDateNode](val);
        });    
    }

    ko.components.register('sampling-date-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/cards/default.htm' }
    });
    return viewModel;
});
