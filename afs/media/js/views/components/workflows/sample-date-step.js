define([
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'views/components/workflows/new-tile-step',
    'views/components/workflows/component-based-step',
], function($, arches, ko, koMapping, NewTileStep, ComponentBasedStep) {
    function viewModel(params) {
        NewTileStep.apply(this, [params]);
        //ComponentBasedStep.apply(this, [params]);
        
        var self = this;

        this.timeSpanNodegroup = '0b925e3a-ca85-11e9-a308-a4d18cec433a'
        this.earliestStartDateNode = '0b92c0de-ca85-11e9-8d50-a4d18cec433a'; //begin of the begin
        this.latestStartDateNode = '0b931623-ca85-11e9-b235-a4d18cec433a'; //end of the begin
        this.earliestEndDateNode = '0b930905-ca85-11e9-8aca-a4d18cec433a'; //begin of the end
        this.latestEndDateNode = '0b92f57d-ca85-11e9-a353-a4d18cec433a'; //end of the end

        this.tile.subscribe(function(val) {
            if (val){
                self.tile().data[self.earliestStartDateNode].subscribe(function(val) {
                    if (val) {
                        self.tile().data[self.latestStartDateNode](val);
                        self.tile().data[self.earliestEndDateNode](val);
                        self.tile().data[self.latestEndDateNode](val);
                    }
                });    
            }
        });
    };

    return ko.components.register('sample-date-step', {
        viewModel: viewModel,
        template: {
            require: 'text!templates/views/components/workflows/new-tile-step.htm'
            //require: 'text!templates/views/components/workflows/component-based-step.htm'
        }
    });
});
