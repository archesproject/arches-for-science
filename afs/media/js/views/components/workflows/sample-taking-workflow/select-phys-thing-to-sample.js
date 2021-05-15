define([
    'knockout',
    'arches',
    'views/components/workflows/upload-dataset/select-phys-thing-step'
], function(ko, arches, SelectPhysThingStep) {

    function viewModel(params) {
        var self = this;
        SelectPhysThingStep.apply(self, [params])

        this.samplingActivityValue = ko.observable();
        this.projectTile = ko.observable();
        this.physicalThingTile = ko.observable();

        if (params.value()) {
            console.log(params.value())
            this.physicalThingValue(params.value().physicalThing);
            this.physicalThingSetValue(params.value().physicalThingSet);
            this.projectValue(params.value().project);
            this.samplingActivityValue(params.value().samplingActivity);
            this.projectTile(params.value().projectTile);
            this.physicalThingTile(params.value().physicalThingTile);
        }

        this.physicalThingValue.subscribe(function(val){
            params.value({
                physicalThing: self.physicalThingValue(),
                physicalThingSet: self.physicalThingSetValue(),
                project: self.projectValue(),
                samplingActivity: self.samplingActivityValue(),
                projectTile: self.projectTile(),
                physicalThingTile: self.physicalThingTile()
            });
            self.save();
        });
    }

    ko.components.register('select-phys-thing-to-sample', {
        viewModel: viewModel,
        template: {
            require: 'text!templates/views/components/workflows/upload-dataset/select-phys-thing-step.htm'
        }
    });

    return viewModel;
});
