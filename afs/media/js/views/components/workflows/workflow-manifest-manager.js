define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'utils/resource',
    'views/components/plugins/manifest-manager',
], function(_, $, arches, ko, koMapping, resourceUtils) {
    function viewModel(params) {
        var self = this;

        console.log("!", self, params, arches.urls)



        var objectStepData = params.form.externalStepData['objectstep'];


        console.log("@@@", objectStepData)


        // var physicalThing = objectStepData['sample-object-resource-instance'][0];
        // var physicalThingResourceId = foo[1].resourceId();

        // var visualWorkGraphId = 'ba892214-b25b-11e9-bf3e-a4d18cec433a';
        // this.graphUrl = arches.urls.graphs_api + visualWorkGraphId;

        this.isManifestManagerHidden = ko.observable(true);

        this.manifestData = ko.observable();
        this.manifestData.subscribe(function(foo) {
            // console.log("AAAAAA", foo, params, physicalThingResourceId)

            // var bar = resourceUtils.getNodeValues({
            //     nodeId: statementTextId,
            //     where: {
            //         nodeId: statementTypeId,
            //         contains: descriptionConceptValueId
            //     },
            //     returnTiles: false
            // }, this.report.get('tiles'), this.report.graph);
        })

        this.initialize = function() {

            // $.ajax({
            //     url: self.graphUrl,
            //     success: function(response) {
            //         // console.log(response)
            //     }
            // })

        };

        this.toggleManifestManagerHidden = function() {
            self.isManifestManagerHidden(!self.isManifestManagerHidden());
        };

        this.initialize();
    }

    ko.components.register('workflow-manifest-manager', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/workflow-manifest-manager.htm' }
    });
    return viewModel;
});
