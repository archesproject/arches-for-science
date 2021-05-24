define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'views/components/plugins/manifest-manager',
], function(_, $, arches, ko, koMapping) {
    function viewModel(params) {
        var self = this;

        var digitalResourcesNameNodegroupId = 'd2fdae3d-ca7a-11e9-ad84-a4d18cec433a';
        var digitalResourceNameCard = params.form.topCards.find(function(topCard) {
            return topCard.nodegroupid === digitalResourcesNameNodegroupId;
        });
        this.digitalResourceNameTile = digitalResourceNameCard.getNewTile();

        
        var digitalResourcesStatementNodegroupId = 'da1fac57-ca7a-11e9-86a3-a4d18cec433a';
        var digitalResourceStatementCard = params.form.topCards.find(function(topCard) {
            return topCard.nodegroupid === digitalResourcesStatementNodegroupId;
        });
        this.digitalResourceStatementTile = digitalResourceStatementCard.getNewTile();

        var digitalResourcesNameContentNodeId = 'd2fdc2fa-ca7a-11e9-8ffb-a4d18cec433a';
        var digitalResourcesStatementContentNodeId = 'da1fbca1-ca7a-11e9-8256-a4d18cec433a';
        
        var objectStepData = params.form.externalStepData['objectstep']['data'];
        this.physicalThingData = koMapping.toJS(objectStepData['sample-object-resource-instance'][0][1][0]);

        this.isManifestManagerHidden = ko.observable(true);

        this.manifestData = ko.observable();
        this.manifestData.subscribe(function(manifestData) {
            console.log(manifestData)
            params.dirty(true)
            self.digitalResourceNameTile.data[digitalResourcesNameContentNodeId](manifestData.label);
            self.digitalResourceStatementTile.data[digitalResourcesStatementContentNodeId](manifestData.description);
        });

        console.log("AAA", self)

        params.saveFunction(function() {
            /* saving a tile without a resourceinstance_id creates a new resources */ 
            self.digitalResourceNameTile.save().then(function(data) {


                console.log('digitalResourceNameData', data)

                self.digitalResourceStatementTile.resourceinstance_id = data.resourceinstance_id;

                self.digitalResourceStatementTile.save().then(function(data) {
                    console.log("digitalResourceStatementData", data, self.digitalResourceStatementTile, params)

                    self.updatePhysicalThingWithDigitalResource(data).then(function(data) {
                        console.log("updatePhysicalThingData", data)
                    });
                });
            });
        });

        this.initialize = function() {
        };

        this.toggleManifestManagerHidden = function() {
            self.isManifestManagerHidden(!self.isManifestManagerHidden());
        };

        this.updatePhysicalThingWithDigitalResource = function(digitalResourceData) {
            return $.ajax({
                url: arches.urls.api_node_value,
                type: 'POST',
                data: {
                    'resourceinstanceid': self.physicalThingData.resourceId,
                    'nodeid': 'a298ee52-8d59-11eb-a9c4-faffc265b501', // Digital Source (E73) (physical thing)
                    'data': digitalResourceData,
                    'tileid': null,
                }
            })
        };

        this.initialize();
    }

    ko.components.register('workflow-manifest-manager', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/workflow-manifest-manager.htm' }
    });
    return viewModel;
});
