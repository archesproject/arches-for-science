import logging
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django.utils.translation import ugettext as _
from django.views.generic import View
from arches.app.models.tile import Tile
from arches.app.models.resource import Resource
from arches.app.utils.betterJSONSerializer import JSONDeserializer
from arches.app.utils.response import JSONResponse

logger = logging.getLogger(__name__)
related_resource_template = {
    "resourceId": "",
    "ontologyProperty": "",
    "resourceXresourceId": "",
    "inverseOntologyProperty": "",
}


class SaveAnalysisAreaView(View):
    """
    Updates the Parent physical thing (9519cb4f-b25b-11e9-8c7b-a4d18cec433a)
        the annotation (Part Identifier Assignment) (fec59582-8593-11ea-97eb-acde48001122)

    Creates Analysis Area physical thing (9519cb4f-b25b-11e9-8c7b-a4d18cec433a)
        the name (b9c1d8a6-b497-11e9-876b-a4d18cec433a)
        the type (8ddfe3ab-b31d-11e9-aff0-a4d18cec433a)
        the parent object (part of) (f8d5fe4c-b31d-11e9-9625-a4d18cec433a)
        the related collection (memeber of) (63e49254-c444-11e9-afbe-a4d18cec433a)
    """

    def create_physical_thing_resource(self, transaction_id):
        physical_thing_graphid = "9519cb4f-b25b-11e9-8c7b-a4d18cec433a"
        resource = Resource()
        resource.graph_id = physical_thing_graphid
        resource.save(transaction_id=transaction_id)
        resourceid = str(resource.pk)

        return resourceid

    def save_node(self, resourceinstanceid, nodeid, transactionid, nodevalue, tileid=None):
        if tileid is not None:
            tile = Tile.objects.get(pk=tileid)
        else:
            try:
                tile = Tile.objects.get(resourceinstance=resourceinstanceid, nodegroup=nodeid)
            except ObjectDoesNotExist as e:
                tile = Tile.get_blank_tile(nodeid=nodeid, resourceid=resourceinstanceid)
        tile.data[nodeid] = nodevalue
        tile.save(transaction_id=transactionid)

        return tile

    def save_tile(self, resourceinstanceid, nodegroupid, transactionid, tiledata, tileid=None):
        if tileid is not None:
            tile = Tile.objects.get(pk=tileid)
        else:
            tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=nodegroupid, resourceid=resourceinstanceid)
        tile.data = tiledata
        tile.save(transaction_id=transactionid)

        return tile

    def save_related_resource_node(self, resourceinstanceid, nodeid, transactionid, related_resourceid, tileid=None):
        if tileid is not None:
            tile = Tile.objects.get(pk=tileid)
            tile.data[nodeid][0]["resourceId"] = related_resourceid
        else:
            try:
                tile = Tile.objects.get(resourceinstance=resourceinstanceid, nodegroup=nodeid)
            except ObjectDoesNotExist as e:
                tile = Tile.get_blank_tile(nodeid=nodeid, resourceid=resourceinstanceid)
            related_resource_template["resourceId"] = related_resourceid
            tile.data[nodeid] = [related_resource_template]
        tile.save(transaction_id=transactionid)

        return tile

    def add_related_resource_node(self, resourceinstanceid, nodeid, transactionid, related_resourceid, tileid=None):
        if tileid is not None:
            tile = Tile.objects.get(pk=tileid)
            tile.data[nodeid](0)["resourceId"] = related_resourceid
            # do I want to update resource x resource data?
        else:
            tile = Tile.get_blank_tile(nodeid=nodeid, resourceid=resourceinstanceid)
            related_resource_template["resourceId"] = related_resourceid
            tile.data[nodeid] = [related_resource_template]
        tile.save(transaction_id=transactionid)

        return tile

    def add_to_related_resource_list_tile(self, resourceinstanceid, nodeid, transactionid, related_resourceid, tileid=None):
        if tileid is not None:
            tile = Tile.objects.get(pk=tileid)
        else:
            try:
                tile = Tile.objects.get(resourceinstance=resourceinstanceid, nodegroup=nodeid)
            except ObjectDoesNotExist as e:
                tile = Tile.get_blank_tile(nodeid=nodeid, resourceid=resourceinstanceid)
                tile.data[nodeid] = []

        list_of_rr_resources = [data["resourceId"] for data in tile.data[nodeid]]
        if related_resourceid not in list_of_rr_resources:
            related_resource_template["resourceId"] = related_resourceid
            tile.data[nodeid].append(related_resource_template)
            tile.save(transaction_id=transactionid)

        return tile

    def save_physical_thing_name(self, resourceid, transactionid, name):
        physical_thing_name_nodeid = "b9c1d8a6-b497-11e9-876b-a4d18cec433a"
        tile = self.save_node(resourceid, physical_thing_name_nodeid, transactionid, name)
        return tile

    def save_physical_thing_type(self, resourceid, transactionid):
        physical_thing_type_nodeid = "8ddfe3ab-b31d-11e9-aff0-a4d18cec433a"
        physical_thing_type = ["31d97bdd-f10f-4a26-958c-69cb5ab69af1"]  # analysis area
        tile = self.save_node(resourceid, physical_thing_type_nodeid, transactionid, physical_thing_type)
        return tile

    def save_physical_thing_related_collection(self, resourceinstanceid, transactionid, related_resourceid):
        physical_thing_member_of_nodeid = "63e49254-c444-11e9-afbe-a4d18cec433a"
        tile = self.save_related_resource_node(resourceinstanceid, physical_thing_member_of_nodeid, transactionid, related_resourceid)
        return tile

    def save_physical_thing_part_of_tile(self, resourceid, transactionid, related_resourceid):
        physical_thing_part_of_nodeid = "f8d5fe4c-b31d-11e9-9625-a4d18cec433a"
        tile = self.save_related_resource_node(resourceid, physical_thing_part_of_nodeid, transactionid, related_resourceid)
        return tile

    def save_parent_physical_thing_part_of_tile(self, resourceid, related_resourceid, transactionid, tiledata, tileid):
        print(tiledata)
        part_identifier_assignment_nodegroupid = "fec59582-8593-11ea-97eb-acde48001122"
        physical_part_of_object_nodeid = "b240c366-8594-11ea-97eb-acde48001122"
        related_resource_template["resourceId"] = related_resourceid
        tiledata[physical_part_of_object_nodeid] = [related_resource_template]
        print(tiledata)
        tile = self.save_tile(resourceid, part_identifier_assignment_nodegroupid, transactionid, tiledata, tileid)
        return tile

    def post(self, request):
        parent_physical_thing_resourceid = request.POST.get("parentPhysicalThingResourceid")
        collection_resourceid = request.POST.get("collectionResourceid")
        transaction_id = request.POST.get("transactionId")
        part_identifier_assignment_tile_data = JSONDeserializer().deserialize(request.POST.get("partIdentifierAssignmentTileData"))
        part_identifier_assignment_tile_id = request.POST.get("partIdentifierAssignmentTileId") or None
        name = request.POST.get("analysisAreaName")
        physical_part_of_object_nodeid = "b240c366-8594-11ea-97eb-acde48001122"
        analysis_area_physical_thing_resourceid = None
        if part_identifier_assignment_tile_data[physical_part_of_object_nodeid]:
            analysis_area_physical_thing_resourceid = part_identifier_assignment_tile_data[physical_part_of_object_nodeid][0]["resourceId"]

        try:
            with transaction.atomic():
                if analysis_area_physical_thing_resourceid is None:
                    analysis_area_physical_thing_resourceid = self.create_physical_thing_resource(transaction_id)

                name_tile = self.save_physical_thing_name(analysis_area_physical_thing_resourceid, transaction_id, name)
                type_tile = self.save_physical_thing_type(analysis_area_physical_thing_resourceid, transaction_id)
                member_of_tile = self.save_physical_thing_related_collection(
                    analysis_area_physical_thing_resourceid, transaction_id, collection_resourceid
                )
                part_of_tile = self.save_physical_thing_part_of_tile(
                    analysis_area_physical_thing_resourceid, transaction_id, parent_physical_thing_resourceid
                )
                physical_part_of_object_tile = self.save_parent_physical_thing_part_of_tile(
                    parent_physical_thing_resourceid,
                    analysis_area_physical_thing_resourceid,
                    transaction_id,
                    part_identifier_assignment_tile_data,
                    part_identifier_assignment_tile_id,
                )

            res = {
                "nameTile": name_tile,
                "typeTile": type_tile,
                "memberOfTile": member_of_tile,
                "partOfTile": part_of_tile,
                "physicalPartOfObjectTile": physical_part_of_object_tile,
            }
            analysis_area_physical_thing_resource = Resource.objects.get(pk=analysis_area_physical_thing_resourceid)
            analysis_area_physical_thing_resource.index()
            return JSONResponse({"result": res})

        except Exception as e:
            logger.exception(e)
            response = {"result": e, "message": [_("Request Failed"), _("Unable to save")]}
            return JSONResponse(response, status=500)
