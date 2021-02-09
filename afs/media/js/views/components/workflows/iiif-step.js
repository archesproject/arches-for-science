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
        var self = this;

        this.physicalThingIdStepData = params.externalStepData['physicalthingidstep']['data'];
        this.visualWorkIdStepData = params.externalStepData['visualworkidstep']['data'];

        params.resourceid(self.physicalThingIdStepData.physicalthingid);

        NewTileStep.apply(this, [params]);
        
        this.tile.subscribe(function(t){
            if (t) {
                var physicalthingInstanceRef = [{
                    'resourceId': self.physicalThingIdStepData.physicalthingid,  // resourceid of the visual work
                    'ontologyProperty': '',
                    'inverseOntologyProperty':'',
                    'resourceXresourceId':''
                }];
                t.data["b240c366-8594-11ea-97eb-acde48001122"](physicalthingInstanceRef); // set resourceid from physical thing
                if(self.visualWorkIdStepData && self.visualWorkIdStepData.visualworkInstanceRef) {
                    t.data["5d440fea-8651-11ea-97eb-acde48001122"](self.visualWorkIdStepData.visualworkInstanceRef); // set resourceid from related visual work
                }
            }
        });

        params.defineStateProperties = function(){
            var wastebin = !!(ko.unwrap(params.wastebin)) ? koMapping.toJS(params.wastebin) : undefined;
            if (wastebin && ko.unwrap(wastebin.hasOwnProperty('resourceid'))) {
                wastebin.resourceid = ko.unwrap(params.resourceid);
            }
            if (wastebin && ko.unwrap(wastebin.hasOwnProperty('tile'))) {
                if (!!ko.unwrap(params.tile)) {
                    wastebin.tile = koMapping.toJS(params.tile().data);
                    wastebin.tile.tileid = (ko.unwrap(params.tile)).tileid;
                    // eslint-disable-next-line camelcase
                    wastebin.tile.resourceinstance_id = (ko.unwrap(params.tile)).resourceinstance_id;
                }
            }
            ko.mapping.fromJS(wastebin, {}, params.wastebin);
            return {
                resourceid: params.resourceid(),
                tile: !!(ko.unwrap(params.tile)) ? koMapping.toJS(params.tile().data) : undefined,
                tileid: !!(ko.unwrap(params.tile)) ? ko.unwrap(params.tile().tileid): undefined,
                wastebin: wastebin
            };
        };
    }

    ko.components.register('iiif-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/new-tile-step.htm' }
    });
    return viewModel;
});
