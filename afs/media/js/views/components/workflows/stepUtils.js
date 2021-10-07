define(['arches', 'uuid', 'utils/resource'], function(arches, uuid, ResourceUtils) {
    return {
        saveThingToProject: async function(physicalThingInstanceId, projectSetInstanceId, workflowId, resourceLookup){
            const memberOfSetNodeid = '63e49254-c444-11e9-afbe-a4d18cec433a';
            const tileId = uuid.generate();
            const data = {};
            data[memberOfSetNodeid] = [{
                "resourceId": projectSetInstanceId,
                "ontologyProperty": "",
                "resourceXresourceId": "",
                "inverseOntologyProperty": ""
            }];
            const tileObj = {
                "tileid": "",
                "data": data,
                "nodegroup_id": memberOfSetNodeid,
                "parenttile_id": null,
                "resourceinstance_id": physicalThingInstanceId,
                "sortorder": 0,
                "tiles": {},
                "transaction_id": workflowId
            };

            let thing;
            if (resourceLookup[physicalThingInstanceId]) {
                thing = resourceLookup[physicalThingInstanceId];
            } else {
                thing = await ResourceUtils.lookupResourceInstanceData(physicalThingInstanceId);
            }

            const res = thing._source.tiles.find((tile) => {
                return tile.nodegroup_id === memberOfSetNodeid &&
                    tile.data[memberOfSetNodeid].find(val => val.resourceId === projectSetInstanceId);
            });

            if (!res) {
                return window.fetch(arches.urls.api_tiles(tileId), {
                    method: 'POST',
                    credentials: 'include',
                    body: JSON.stringify(tileObj),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                });
            } else {
                return Promise.resolve();
            }
        },
    };
});