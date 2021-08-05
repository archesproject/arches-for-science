define([
    'jquery',
    'underscore',
    'knockout',
    'knockout-mapping',
    'arches',
    'views/components/workflows/new-tile-step',
    'bindings/select2-query',
], function($, _, ko, koMapping, arches, NewTileStep) {
    function viewModel(params) {
        var self = this;

        this.visualworkInstanceRef;
        this.digitalresourceInstanceRef;

        NewTileStep.apply(this, [params]);

        this.onSaveSuccess = function(tile) {
            params.resourceid(tile.resourceinstance_id);
            params.tileid(tile.tileid);
            self.resourceId(tile.resourceinstance_id);
            // 'Creates a visual work that references the current physical thing',
            $.ajax({
                url: arches.urls.api_node_value,
                type: 'POST',
                dataType: 'json',
                data: {
                    'nodeid': '5513933a-c062-11e9-9e4b-a4d18cec433a', // depicts (physical thing)
                    'data': JSON.stringify([{
                        'resourceId': tile.resourceinstance_id, // resourceid of the physical thing
                        'ontologyProperty': '',
                        'inverseOntologyProperty':'',
                        'resourceXresourceId':''
                    }]), 
                    'tileid': null 
                }
            }).done(function(data) {
                self.visualworkInstanceRef = [{
                    'resourceId': data.resourceinstance_id,  // resourceid of the visual work
                    'ontologyProperty': '',
                    'inverseOntologyProperty':'',
                    'resourceXresourceId':''
                }];

                // 'Updates the shows item of a physical thing with the visual work resourceid',
                $.ajax({
                    url: arches.urls.api_node_value,
                    type: 'POST',
                    data: {
                        'resourceinstanceid': params.resourceid(), // resourceid of the physical thing
                        'nodeid': '2fe9f066-b31e-11e9-b3be-a4d18cec433a', // Shows (physical ting)
                        'data': JSON.stringify(self.visualworkInstanceRef),
                        'tileid': null
                    }
                }).done(function(data) {
                    // eslint-disable-next-line no-console
                    console.log('Updated the "shows" node of the physical thing', data);
                });

                // 'Creates a digital resource that references the visual work',
                $.ajax({
                    url: arches.urls.api_node_value,
                    type: 'POST',
                    data: {
                        'nodeid': 'c1e732b0-ca7a-11e9-b369-a4d18cec433a', // shows (visual work)
                        'data': JSON.stringify(self.visualworkInstanceRef),
                        'tileid': null
                    }
                }).done(function(data) {
                    self.digitalresourceInstanceRef = [{
                        'resourceId': data.resourceinstance_id,  // resourceid of the visual work
                        'ontologyProperty': '',
                        'inverseOntologyProperty':'',
                        'resourceXresourceId':''
                    }];

                    // 'Updates the used image node of the visual work with the digital resourceid',
                    $.ajax({
                        url: arches.urls.api_node_value,
                        type: 'POST',
                        data: {
                            'resourceinstanceid': self.visualworkInstanceRef[0]['resourceId'],
                            'nodeid': '9743a1b2-8591-11ea-97eb-acde48001122', // Used image (visual work)
                            'data': JSON.stringify(self.digitalresourceInstanceRef),
                            'tileid': null
                        }
                    }).done(function(data) {
                        // eslint-disable-next-line no-console
                        console.log('Added "used image" of the digital resource to the visual work:', data);
                        params.value(params.defineStateProperties())
                        if (self.completeOnSave === true) { self.complete(true); }
                    });
                });
            });
        };

        params.defineStateProperties = function(){
            var tileid = undefined;

            var wastebin = !!(ko.unwrap(params.wastebin)) ? koMapping.toJS(params.wastebin) : undefined;
            if (wastebin && 'resources' in wastebin) {
                wastebin.resources.push({'resourceid': ko.unwrap(params.resourceid), 'description':'a physical thing instance'});
                wastebin.resources.push({'resourceid': self.digitalresourceInstanceRef[0].resourceId, 'description':'a digital resource instance'});
                wastebin.resources.push({'resourceid': self.visualworkInstanceRef[0].resourceId, 'description':'a visual work instance'});
            }
            if (wastebin && 'resourceid' in wastebin) {
                wastebin.resourceid = ko.unwrap(params.resourceid);
            }
            if (wastebin && 'tile' in wastebin) {
                if (!!ko.unwrap(params.tile)) {
                    wastebin.tile = koMapping.toJS(params.tile().data);
                    wastebin.tile.tileid = (ko.unwrap(params.tile)).tileid;
                    wastebin.tile.resourceinstance_id = (ko.unwrap(params.tile)).resourceinstance_id;
                }
            }
            if (!!(ko.unwrap(params.tile))) {
                tileid = ko.unwrap(params.tile().tileid);
            } else if (!!(ko.unwrap(params.tileid))) {
                tileid = ko.unwrap(params.tileid);
            }
            ko.mapping.fromJS(wastebin, {}, params.wastebin);
            return {
                digitalresourceInstanceRef: self.digitalresourceInstanceRef,
                visualworkInstanceRef: self.visualworkInstanceRef,
                physicalthingid: ko.unwrap(params.resourceid),
                resourceid: ko.unwrap(params.resourceid),
                tile: !!(ko.unwrap(params.tile)) ? koMapping.toJS(params.tile().data) : undefined,
                tileid: tileid,
                wastebin: wastebin
            };
        };
    }

    ko.components.register('physical-thing-step', {
        viewModel: viewModel,
        template: { require: 'text!templates/views/components/workflows/new-tile-step.htm' }
    });
    return viewModel;
});
