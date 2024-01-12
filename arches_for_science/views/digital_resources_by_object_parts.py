from django.views.generic import View
from arches.app.utils.response import JSONResponse
from arches.app.models.models import TileModel
from arches.app.models.resource import Resource
from django.core.exceptions import ObjectDoesNotExist

class DigitalResourcesByObjectParts(View):
    def get(self, request, resourceid):
        parts_nodegroup_id = "fec59582-8593-11ea-97eb-acde48001122"
        physical_thing_node_id = "b240c366-8594-11ea-97eb-acde48001122"
        digital_resource_nodegroup_id = "8a4ad932-8d59-11eb-a9c4-faffc265b501"
        digital_resource_node_id = "a298ee52-8d59-11eb-a9c4-faffc265b501"
        digital_resource_type_nodegroup_id = "09c1778a-ca7b-11e9-860b-a4d18cec433a"
        manifest_concept_value_id = "305c62f0-7e3d-4d52-a210-b451491e6100"
        part_tiles = TileModel.objects.filter(resourceinstance_id=resourceid).filter(nodegroup_id=parts_nodegroup_id)
        physical_things = [tile.data[physical_thing_node_id][0]["resourceId"] for tile in part_tiles]
        physical_things.append(resourceid)
        digital_resource_tiles = TileModel.objects.filter(resourceinstance_id__in=physical_things).filter(
            nodegroup_id=digital_resource_nodegroup_id
        )
        related_datasets = {tile.data[digital_resource_node_id][0]["resourceId"] for tile in digital_resource_tiles}
        part_lookup = {
            tile.data[digital_resource_node_id][0]["resourceId"]: str(tile.resourceinstance_id) for tile in digital_resource_tiles
        }
        digital_resource_type_tiles = TileModel.objects.filter(resourceinstance_id__in=related_datasets).filter(
            nodegroup_id=digital_resource_type_nodegroup_id
        )
        manifest_datasets = {
            str(tile.resourceinstance_id)
            for tile in digital_resource_type_tiles
            if manifest_concept_value_id in tile.data[digital_resource_type_nodegroup_id]
        }
        digital_resources = Resource.objects.filter(pk__in=related_datasets - manifest_datasets)
        object_type = self.get_type(resourceid)
        results = {
            "resources": [{"resourceid": str(resource.pk), "displayname": resource.displayname()} for resource in digital_resources],
            "selected_resource": resourceid,
            "type": object_type,
        }
        for resource in results["resources"]:
            resource["partresourceid"] = part_lookup[resource["resourceid"]]
            resource["isdirect"] = part_lookup[resource["resourceid"]] == resourceid
        return JSONResponse(results)

    def get_type(self, resourceid):
        type_nodegroup_id = "8ddfe3ab-b31d-11e9-aff0-a4d18cec433a"
        sample_area_value_id = "7375a6fb-0bfb-4bcf-81a3-6180cdd26123"
        sample_value_id = "77d8cf19-ce9c-4e0a-bde1-9148d870e11c"
        analysis_area_value_id = "31d97bdd-f10f-4a26-958c-69cb5ab69af1"

        try:
            object_type_tile = TileModel.objects.filter(resourceinstance_id=resourceid).get(nodegroup_id=type_nodegroup_id)
            object_types = object_type_tile.data[type_nodegroup_id]
            if sample_area_value_id in object_types:
                return "sample area"
            elif sample_value_id in object_types:
                return "sample"
            elif analysis_area_value_id in object_types:
                return "analysis area"
            else:
                return ""
        except (ObjectDoesNotExist, KeyError) as e:
            return ""
