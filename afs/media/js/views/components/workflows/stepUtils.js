define(['arches', 'uuid'], function(arches, uuid) {
    return {
        saveThingToProject: function(physicalThingInstanceId, projectSetInstanceId, workflowId){
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

            return window.fetch(arches.urls.api_tiles(tileId), {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify(tileObj),
                headers: {
                    'Content-Type': 'application/json'
                },
            });
        },
    };
});