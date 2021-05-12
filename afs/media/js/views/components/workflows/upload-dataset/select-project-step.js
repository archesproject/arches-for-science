define([
    'knockout',
    'utils/resource',
    'views/components/workflows/component-based-step',
    'viewmodels/card',
], function(ko, resourceUtils, ComponentBasedStep) {
   
    function viewModel(params) {
        this.hasSamples = ko.observable();
        ComponentBasedStep.apply(this, [params]);
        var self = this;
        var sampleActivityGraphId = '03357848-1d9d-11eb-a29f-024e0d439fdb';

        var checkForRelatedSamples = function(val){
            if (val) {
                var physicalThing = val.pageLayout.sections[1].componentConfigs[0].value;
                if (physicalThing) {
                    resourceUtils.getRelatedInstances(physicalThing, sampleActivityGraphId)
                        .then(
                            function(samples){
                                self.hasSamples(!!samples.related_resources.length);
                            }
                        );
                }
            }
        };   
        checkForRelatedSamples(this.value());
        this.value.subscribe(checkForRelatedSamples);
    }

    ko.components.register('select-project-step', {
        viewModel: viewModel,
        template: {
            require: 'text!templates/views/components/workflows/upload-dataset/select-project-step.htm'
        }
    });

    return viewModel;
});
