import json
import logging
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django.utils.decorators import method_decorator
from django.utils.translation import ugettext as _
from django.views.generic import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.translation import get_language, get_language_bidi
from arches.app.models.tile import Tile
from arches.app.models.resource import Resource
from arches.app.models.models import ResourceXResource
from arches.app.utils.betterJSONSerializer import JSONDeserializer
from arches.app.utils.response import JSONResponse

logger = logging.getLogger(__name__)


def get_related_resource_template(resourceid):
    return {
        "resourceId": resourceid,
        "ontologyProperty": "",
        "resourceXresourceId": "",
        "inverseOntologyProperty": "",
    }


class SaveAnnotationView(View):
    def create_physical_thing_resource(self, transaction_id):
        physical_thing_graphid = "9519cb4f-b25b-11e9-8c7b-a4d18cec433a"
        resource = Resource()
        resource.graph_id = physical_thing_graphid
        resource.save(transaction_id=transaction_id)
        resourceid = str(resource.pk)

        return resourceid

    def save_node(self, resourceinstanceid, nodegroupid, nodeid, transactionid, nodevalue, tileid=None):
        if tileid is not None:
            tile = Tile.objects.get(pk=tileid)
        else:
            try:
                tile = Tile.objects.get(resourceinstance=resourceinstanceid, nodegroup=nodegroupid)
            except ObjectDoesNotExist as e:
                tile = Tile.get_blank_tile(nodeid=nodeid, resourceid=resourceinstanceid)
        tile.data[nodeid] = nodevalue
        tile.save(transaction_id=transactionid, index=False)

        return tile

    def save_tile(self, resourceinstanceid, nodegroupid, transactionid, tiledata, tileid=None):
        if tileid is not None:
            tile = Tile.objects.get(pk=tileid)
        else:
            tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=nodegroupid, resourceid=resourceinstanceid)
        tile.data = tiledata
        tile.save(transaction_id=transactionid, index=False)

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
            related_resource_template = get_related_resource_template(related_resourceid)
            tile.data[nodeid] = [related_resource_template]
        tile.save(transaction_id=transactionid, index=False)

        return tile

    def add_related_resource_node(self, resourceinstanceid, nodeid, transactionid, related_resourceid, tileid=None):
        if tileid is not None:
            tile = Tile.objects.get(pk=tileid)
            tile.data[nodeid](0)["resourceId"] = related_resourceid
            # do I want to update resource x resource data?
        else:
            tile = Tile.get_blank_tile(nodeid=nodeid, resourceid=resourceinstanceid)
            related_resource_template = get_related_resource_template(related_resourceid)
            tile.data[nodeid] = [related_resource_template]
        tile.save(transaction_id=transactionid, index=False)

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
            related_resource_template = get_related_resource_template(related_resourceid)
            tile.data[nodeid].append(related_resource_template)
            tile.save(transaction_id=transactionid, index=False)

        return tile

    def save_physical_thing_name(self, resourceid, transactionid, name, tileid=None):
        physical_thing_name_nodegroupid = "b9c1ced7-b497-11e9-a4da-a4d18cec433a"
        physical_thing_name_nodeid = "b9c1d8a6-b497-11e9-876b-a4d18cec433a"
        physical_thing_name_type_nodeid = "b9c1d7ab-b497-11e9-9ab7-a4d18cec433a"
        physical_thing_name_language_nodeid = "b9c1d400-b497-11e9-90ea-a4d18cec433a"
        preferred_terms_conceptid = "8f40c740-3c02-4839-b1a4-f1460823a9fe"
        english_conceptid = "bc35776b-996f-4fc1-bd25-9f6432c1f349"

        if tileid is not None:
            tile = Tile.objects.get(pk=tileid)
        else:
            try:
                tile = Tile.objects.get(resourceinstance=resourceid, nodegroup=physical_thing_name_nodegroupid)
            except ObjectDoesNotExist as e:
                tile = Tile.get_blank_tile(nodeid=physical_thing_name_nodeid, resourceid=resourceid)
        tile.data[physical_thing_name_nodeid] = {}
        tile.data[physical_thing_name_nodeid][get_language()] = {"value": name, "direction": "rtl" if get_language_bidi() else "ltr"}
        tile.data[physical_thing_name_type_nodeid] = [preferred_terms_conceptid]
        tile.data[physical_thing_name_language_nodeid] = [english_conceptid]
        tile.save(transaction_id=transactionid, index=False)

        return tile

    def save_physical_thing_type(self, resourceid, transactionid, type):
        physical_thing_type_nodeid = "8ddfe3ab-b31d-11e9-aff0-a4d18cec433a"
        physical_thing_types = {
            "analysis_area": ["31d97bdd-f10f-4a26-958c-69cb5ab69af1"],
            "sample_area": ["7375a6fb-0bfb-4bcf-81a3-6180cdd26123"],
            "sample": ["77d8cf19-ce9c-4e0a-bde1-9148d870e11c"],
        }
        physical_thing_type = physical_thing_types[type]
        tile = self.save_node(resourceid, physical_thing_type_nodeid, physical_thing_type_nodeid, transactionid, physical_thing_type)
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
        part_identifier_assignment_nodegroupid = "fec59582-8593-11ea-97eb-acde48001122"
        physical_part_of_object_nodeid = "b240c366-8594-11ea-97eb-acde48001122"
        related_resource_template = get_related_resource_template(related_resourceid)
        tiledata[physical_part_of_object_nodeid] = [related_resource_template]
        tile = self.save_tile(resourceid, part_identifier_assignment_nodegroupid, transactionid, tiledata, tileid)
        return tile


class SaveAnalysisAreaView(SaveAnnotationView):
    """
    Updates the Parent physical thing (9519cb4f-b25b-11e9-8c7b-a4d18cec433a)
        the annotation (Part Identifier Assignment) (fec59582-8593-11ea-97eb-acde48001122)

    Creates Analysis Area physical thing (9519cb4f-b25b-11e9-8c7b-a4d18cec433a)
        the name (b9c1d8a6-b497-11e9-876b-a4d18cec433a)
        the type (8ddfe3ab-b31d-11e9-aff0-a4d18cec433a)
        the parent object (part of) (f8d5fe4c-b31d-11e9-9625-a4d18cec433a)
        the related collection (memeber of) (63e49254-c444-11e9-afbe-a4d18cec433a)
    """

    def post(self, request):
        parent_physical_thing_resourceid = request.POST.get("parentPhysicalThingResourceid")
        collection_resourceid = request.POST.get("collectionResourceid")
        transaction_id = request.POST.get("transactionId")
        part_identifier_assignment_tile_data = JSONDeserializer().deserialize(request.POST.get("partIdentifierAssignmentTileData"))
        part_identifier_assignment_tile_id = request.POST.get("partIdentifierAssignmentTileId") or None
        name = request.POST.get("analysisAreaName")
        if name:
            name_object = name
        physical_part_of_object_nodeid = "b240c366-8594-11ea-97eb-acde48001122"
        analysis_area_physical_thing_resourceid = None
        if part_identifier_assignment_tile_data[physical_part_of_object_nodeid]:
            analysis_area_physical_thing_resourceid = part_identifier_assignment_tile_data[physical_part_of_object_nodeid][0]["resourceId"]

        try:
            with transaction.atomic():
                if analysis_area_physical_thing_resourceid is None:
                    analysis_area_physical_thing_resourceid = self.create_physical_thing_resource(transaction_id)

                name_tile = self.save_physical_thing_name(analysis_area_physical_thing_resourceid, transaction_id, name_object)
                type_tile = self.save_physical_thing_type(analysis_area_physical_thing_resourceid, transaction_id, "analysis_area")
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

        except Exception as e:
            logger.exception(e)
            response = {"result": e, "message": [_("Request Failed"), _("Unable to save")]}
            return JSONResponse(response, status=500)

        res = {
            "nameTile": name_tile,
            "typeTile": type_tile,
            "memberOfTile": member_of_tile,
            "partOfTile": part_of_tile,
            "physicalPartOfObjectTile": physical_part_of_object_tile,
        }
        analysis_area_physical_thing_resource = Resource.objects.get(pk=analysis_area_physical_thing_resourceid)
        analysis_area_physical_thing_resource.index()
        parent_physical_thing_resource = Resource.objects.get(pk=parent_physical_thing_resourceid)
        parent_physical_thing_resource.index()
        return JSONResponse({"result": res})


class SaveSampleAreaView(SaveAnnotationView):
    def save_sampling_unit_tile(
        self,
        sampling_activity_resourceid,
        parent_physical_thing_resourceid,
        sample_area_physical_thing_resourceid,
        sample_physical_thing_resourceid,
        part_identifier_assignment_tile_data,
        transactionid,
        tileid=None,
    ):
        sampling_unit_nodegroupid = "b3e171a7-1d9d-11eb-a29f-024e0d439fdb"
        overall_object_sampled_nodeid = "b3e171aa-1d9d-11eb-a29f-024e0d439fdb"
        sampling_area_nodeid = "b3e171ac-1d9d-11eb-a29f-024e0d439fdb"
        sampling_area_sample_created_nodeid = "b3e171ab-1d9d-11eb-a29f-024e0d439fdb"
        sampling_area_visualization_nodeid = "b3e171ae-1d9d-11eb-a29f-024e0d439fdb"
        part_identifier_assignment_polygon_identifier_nodeid = "97c30c42-8594-11ea-97eb-acde48001122"
        sample_area_visualization = part_identifier_assignment_tile_data[part_identifier_assignment_polygon_identifier_nodeid]

        if tileid is not None:
            tile = Tile.objects.get(pk=tileid)
        else:
            tile = None
            try:
                tiles = Tile.objects.filter(resourceinstance=sampling_activity_resourceid, nodegroup=sampling_unit_nodegroupid)
                for t in tiles:
                    if t.data[sampling_area_nodeid][0]["resourceId"] == sample_area_physical_thing_resourceid:
                        tile = t
                if tile is None:
                    tile = Tile.get_blank_tile_from_nodegroup_id(
                        nodegroup_id=sampling_unit_nodegroupid, resourceid=sampling_activity_resourceid
                    )

            except ObjectDoesNotExist as e:
                tile = Tile.get_blank_tile_from_nodegroup_id(
                    nodegroup_id=sampling_unit_nodegroupid, resourceid=sampling_activity_resourceid
                )

        tile.data[overall_object_sampled_nodeid] = [get_related_resource_template(parent_physical_thing_resourceid)]
        tile.data[sampling_area_nodeid] = [get_related_resource_template(sample_area_physical_thing_resourceid)]
        tile.data[sampling_area_sample_created_nodeid] = [get_related_resource_template(sample_physical_thing_resourceid)]
        tile.data[sampling_area_visualization_nodeid] = sample_area_visualization

        tile.save(transaction_id=transactionid, index=False)

        return tile

    def save_sample_statement_tile(self, resourceid, statement, type, tileid=None):
        statement_nodegroupid = "1952bb0a-b498-11e9-a679-a4d18cec433a"
        statement_type_nodeid = "1952e470-b498-11e9-b261-a4d18cec433a"
        statement_content_nodeid = "1953016e-b498-11e9-9445-a4d18cec433a"
        statement_language_nodeid = "1952d7de-b498-11e9-a8a8-a4d18cec433a"
        english_conceptid = "bc35776b-996f-4fc1-bd25-9f6432c1f349"

        statement_types = {
            "motivation": "7060892c-4d91-4ab3-b3de-a95e19931a61",
            "description": "9886efe9-c323-49d5-8d32-5c2a214e5630",
        }

        if tileid is not None:
            tile = Tile.objects.get(pk=tileid)
        else:
            tile = None
            try:
                tiles = Tile.objects.filter(resourceinstance=resourceid, nodegroup=statement_nodegroupid)
                for t in tiles:
                    if statement_types[type] in t.data[statement_type_nodeid]:
                        tile = t
                if tile is None:
                    tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=statement_nodegroupid, resourceid=resourceid)

            except ObjectDoesNotExist as e:
                tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=statement_nodegroupid, resourceid=resourceid)

        tile.data[statement_content_nodeid] = {}
        tile.data[statement_content_nodeid][get_language()] = {"value": statement, "direction": "rtl" if get_language_bidi() else "ltr"}
        tile.data[statement_type_nodeid] = [statement_types[type]]
        tile.data[statement_language_nodeid] = [english_conceptid]
        tile.save(index=False)

        return tile

    def save_removed_from_tile(self, sample_resourceid, removed_from_resourceids, transactionid):
        removed_from_nodeid = "38814345-d2bd-11e9-b9d6-a4d18cec433a"
        removal_from_object_nodegroupid = "b11f217a-d2bc-11e9-8dfa-a4d18cec433a"
        removed_from_related_list = [get_related_resource_template(resourceid) for resourceid in removed_from_resourceids]
        tile = self.save_node(
            sample_resourceid, removal_from_object_nodegroupid, removed_from_nodeid, transactionid, removed_from_related_list
        )
        tile.save(transaction_id=transactionid, index=False)

    def post(self, request):
        physical_part_of_object_nodeid = "b240c366-8594-11ea-97eb-acde48001122"
        part_identifier_assignment_label_nodeid = "3e541cc6-859b-11ea-97eb-acde48001122"
        part_identifier_assignment_polygon_identifier_nodeid = "97c30c42-8594-11ea-97eb-acde48001122"
        sampling_area_nodeid = "b3e171ac-1d9d-11eb-a29f-024e0d439fdb"
        sampling_area_sample_created_nodeid = "b3e171ab-1d9d-11eb-a29f-024e0d439fdb"
        sampling_unit_nodegroupid = "b3e171a7-1d9d-11eb-a29f-024e0d439fdb"

        parent_physical_thing_resourceid = request.POST.get("parentPhysicalThingResourceid")
        parent_physical_thing_name = request.POST.get("parentPhysicalThingName")
        sampling_activity_resourceid = request.POST.get("samplingActivityResourceId")
        collection_resourceid = request.POST.get("collectionResourceid")
        sample_motivation = request.POST.get("sampleMotivation")
        sample_description = request.POST.get("sampleDescription")
        transaction_id = request.POST.get("transactionId")
        part_identifier_assignment_tile_data = JSONDeserializer().deserialize(request.POST.get("partIdentifierAssignmentTileData"))
        part_identifier_assignment_tile_id = request.POST.get("partIdentifierAssignmentTileId") or None

        sample_area_physical_thing_resourceid = None
        if part_identifier_assignment_tile_data[physical_part_of_object_nodeid]:
            sample_area_physical_thing_resourceid = part_identifier_assignment_tile_data[physical_part_of_object_nodeid][0]["resourceId"]

        sample_physical_thing_resourceid = None
        sampling_unit_tiles = Tile.objects.filter(resourceinstance=sampling_activity_resourceid, nodegroup=sampling_unit_nodegroupid)
        if len(sampling_unit_tiles) > 0:
            for sampling_unit_tile in sampling_unit_tiles:
                if sampling_unit_tile.data[sampling_area_nodeid][0]["resourceId"] == sample_area_physical_thing_resourceid:
                    sample_physical_thing_resourceid = sampling_unit_tile.data[sampling_area_sample_created_nodeid][0]["resourceId"]

        base_name = part_identifier_assignment_tile_data[part_identifier_assignment_label_nodeid][get_language()]["value"]
        sample_name = "{} [Sample of {}]".format(base_name, parent_physical_thing_name)
        sample_area_name = "{} [Sample Area of {}]".format(base_name, parent_physical_thing_name)

        try:
            with transaction.atomic():
                # saving the sample area resource and tiles
                if sample_area_physical_thing_resourceid is None:
                    sample_area_physical_thing_resourceid = self.create_physical_thing_resource(transaction_id)

                sample_area_name_tile = self.save_physical_thing_name(
                    sample_area_physical_thing_resourceid, transaction_id, sample_area_name
                )
                sample_area_type_tile = self.save_physical_thing_type(sample_area_physical_thing_resourceid, transaction_id, "sample_area")
                sample_area_member_of_tile = self.save_physical_thing_related_collection(
                    sample_area_physical_thing_resourceid, transaction_id, collection_resourceid
                )
                sample_area_part_of_tile = self.save_physical_thing_part_of_tile(
                    sample_area_physical_thing_resourceid, transaction_id, parent_physical_thing_resourceid
                )

                # saving the sample resource and tiles
                if sample_physical_thing_resourceid is None:
                    sample_physical_thing_resourceid = self.create_physical_thing_resource(transaction_id)

                sample_name_tile = self.save_physical_thing_name(sample_physical_thing_resourceid, transaction_id, sample_name)
                sample_type_tile = self.save_physical_thing_type(sample_physical_thing_resourceid, transaction_id, "sample")
                sample_member_of_tile = self.save_physical_thing_related_collection(
                    sample_physical_thing_resourceid, transaction_id, collection_resourceid
                )
                sample_part_of_tile = self.save_physical_thing_part_of_tile(
                    sample_physical_thing_resourceid, transaction_id, parent_physical_thing_resourceid
                )
                removed_from_tile = self.save_removed_from_tile(
                    sample_physical_thing_resourceid,
                    [parent_physical_thing_resourceid, sample_area_physical_thing_resourceid],
                    transaction_id,
                )

                # saving the sampling activity resource and tiles
                sampling_unit_tile = self.save_sampling_unit_tile(
                    sampling_activity_resourceid,
                    parent_physical_thing_resourceid,
                    sample_area_physical_thing_resourceid,
                    sample_physical_thing_resourceid,
                    part_identifier_assignment_tile_data,
                    transaction_id,
                )

                sample_description_tile = self.save_sample_statement_tile(
                    sample_physical_thing_resourceid, sample_description, "description"
                )

                sample_motivation_tile = self.save_sample_statement_tile(sample_physical_thing_resourceid, sample_motivation, "motivation")

                # saving the parent physical thing area resource and tiles
                physical_part_of_object_tile = self.save_parent_physical_thing_part_of_tile(
                    parent_physical_thing_resourceid,
                    sample_area_physical_thing_resourceid,
                    transaction_id,
                    part_identifier_assignment_tile_data,
                    part_identifier_assignment_tile_id,
                )
        except Exception as e:
            logger.exception(e)
            response = {"result": e, "message": [_("Request Failed"), _("Unable to save")]}
            return JSONResponse(response, status=500)

        sample_area_physical_thing_resource = Resource.objects.get(pk=sample_area_physical_thing_resourceid)
        sample_area_physical_thing_resource.index()
        sample_physical_thing_resource = Resource.objects.get(pk=sample_physical_thing_resourceid)
        sample_physical_thing_resource.index()
        sampling_activity_resource = Resource.objects.get(pk=sampling_activity_resourceid)
        sampling_activity_resource.index()
        parent_physical_thing_resource = Resource.objects.get(pk=parent_physical_thing_resourceid)
        parent_physical_thing_resource.index()

        res = {
            "sample": {
                "nameTile": sample_name_tile,
                "typeTile": sample_type_tile,
                "memberOfTile": sample_member_of_tile,
                "partOfTile": sample_part_of_tile,
                "removedFromTile": removed_from_tile,
            },
            "sampleArea": {
                "nameTile": sample_area_name_tile,
                "typeTile": sample_area_type_tile,
                "memberOfTile": sample_area_member_of_tile,
                "partOfTile": sample_area_part_of_tile,
            },
            "samplingActivity": {
                "samplingUnitTile": sampling_unit_tile,
                "samplingDescriptionTile": sample_description_tile,
                "samplingMotivationTile": sample_motivation_tile,
            },
            "parentPhysicalThing": {
                "physicalPartOfObjectTile": physical_part_of_object_tile,
            },
        }

        return JSONResponse({"result": res})


@method_decorator(csrf_exempt, name="dispatch")
class DeleteSampleAreaView(View):
    def post(self, request):
        # need to delete:
        # the "sample" physical thing
        # the "sample area" physical thing
        # the tile from the parent physical thing that references the "sample area"
        # the tile from the sampling activity that references the "sample area"

        data = JSONDeserializer().deserialize(request.body)

        physical_part_of_object_nodeid = "b240c366-8594-11ea-97eb-acde48001122"
        part_identifier_assignment_label_nodeid = "3e541cc6-859b-11ea-97eb-acde48001122"
        part_identifier_assignment_polygon_identifier_nodeid = "97c30c42-8594-11ea-97eb-acde48001122"
        sampling_area_nodeid = "b3e171ac-1d9d-11eb-a29f-024e0d439fdb"
        sampling_area_sample_created_nodeid = "b3e171ab-1d9d-11eb-a29f-024e0d439fdb"
        sampling_unit_nodegroupid = "b3e171a7-1d9d-11eb-a29f-024e0d439fdb"

        parent_physical_thing_resourceid = data.get("parentPhysicalThingResourceid")
        parent_physical_thing_name = data.get("parentPhysicalThingName")
        sampling_activity_resourceid = data.get("samplingActivityResourceId")
        collection_resourceid = data.get("collectionResourceid")
        sample_motivation = data.get("sampleMotivation")
        sample_description = data.get("sampleDescription")
        transaction_id = data.get("transactionId")

        part_identifier_assignment_tile_data = JSONDeserializer().deserialize(data.get("partIdentifierAssignmentTileData"))
        part_identifier_assignment_tile_id = data.get("partIdentifierAssignmentTileId", None)

        sample_area_physical_thing_resourceid = None
        if part_identifier_assignment_tile_data[physical_part_of_object_nodeid]:
            sample_area_physical_thing_resourceid = part_identifier_assignment_tile_data[physical_part_of_object_nodeid][0]["resourceId"]

        try:
            sample_physical_thing_resourceid = None
            sampling_unit_tiles = Tile.objects.filter(resourceinstance_id=sampling_activity_resourceid, nodegroup=sampling_unit_nodegroupid)
            if len(sampling_unit_tiles) > 0:
                for sampling_unit_tile in sampling_unit_tiles:
                    if sampling_unit_tile.data[sampling_area_nodeid][0]["resourceId"] == sample_area_physical_thing_resourceid:
                        sample_physical_thing_resourceid = sampling_unit_tile.data[sampling_area_sample_created_nodeid][0]["resourceId"]

            parentPhysicalThingSampleTile = ResourceXResource.objects.get(
                nodeid=physical_part_of_object_nodeid,
                resourceinstanceidfrom_id=parent_physical_thing_resourceid,
                resourceinstanceidto_id=sample_area_physical_thing_resourceid,
            )

            samplingActivitySampleTile = ResourceXResource.objects.get(
                nodeid=sampling_area_nodeid,
                resourceinstanceidfrom_id=sampling_activity_resourceid,
                resourceinstanceidto_id=sample_area_physical_thing_resourceid,
            )

            with transaction.atomic():
                Resource.objects.get(resourceinstanceid=sample_area_physical_thing_resourceid).delete(transaction_id=transaction_id)
                Resource.objects.get(resourceinstanceid=sample_physical_thing_resourceid).delete(transaction_id=transaction_id)
                Tile.objects.get(tileid=parentPhysicalThingSampleTile.tileid_id).delete(transaction_id=transaction_id)
                Tile.objects.get(tileid=samplingActivitySampleTile.tileid_id).delete(transaction_id=transaction_id)
            return JSONResponse(status=200)
        except:
            response = {"message": _("Unable to delete"), "title": _("Delete Failed")}
            return JSONResponse(response, status=500)


@method_decorator(csrf_exempt, name="dispatch")
class DeleteAnalysisAreaView(View):
    def post(self, request):
        # need to delete:
        # the "analysis" physical thing
        # the tile from the parent physical thing that references the "sample area"

        data = JSONDeserializer().deserialize(request.body)

        parent_physical_thing_resourceid = data.get("parentPhysicalThingResourceId")
        part_identifier_assignment_tile_data = JSONDeserializer().deserialize(data.get("parentPhysicalThingTileData"))
        transaction_id = data.get("transactionId")

        physical_part_of_object_nodeid = "b240c366-8594-11ea-97eb-acde48001122"
        analysis_area_physical_thing_resourceid = None

        if part_identifier_assignment_tile_data[physical_part_of_object_nodeid]:
            analysis_area_physical_thing_resourceid = part_identifier_assignment_tile_data[physical_part_of_object_nodeid][0]["resourceId"]

        try:
            parentPhysicalThingAnalysisTile = ResourceXResource.objects.get(
                nodeid=physical_part_of_object_nodeid,
                resourceinstanceidfrom_id=parent_physical_thing_resourceid,
                resourceinstanceidto_id=analysis_area_physical_thing_resourceid,
            )

            with transaction.atomic():
                Resource.objects.get(resourceinstanceid=analysis_area_physical_thing_resourceid).delete(transaction_id=transaction_id)
                Tile.objects.get(tileid=parentPhysicalThingAnalysisTile.tileid_id).delete(transaction_id=transaction_id)
            return JSONResponse(status=200)
        except:
            response = {"message": _("Unable to delete"), "title": _("Delete Failed")}
            return JSONResponse(response, status=500)


class GetLockedStatus(View):
    def get(self, request):
        digitalResourceGraphId = "707cbd78-ca7a-11e9-990b-a4d18cec433a"
        resourceId = request.GET.get("resourceId")
        ret = ResourceXResource.objects.filter(
            nodeid="a298ee52-8d59-11eb-a9c4-faffc265b501",
            resourceinstanceidfrom_id=resourceId,
            resourceinstanceto_graphid_id=digitalResourceGraphId,
        ).exists()

        return JSONResponse({"isRelatedToDigitalResource": ret})
