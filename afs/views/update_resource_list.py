import logging
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django.utils.translation import ugettext as _
from django.views.generic import View
from arches.app.datatypes.datatypes import StringDataType, DataTypeFactory
from arches.app.models.tile import Tile
from arches.app.models.models import TileModel, Node
from arches.app.models.resource import Resource
from arches.app.search.search_engine_factory import SearchEngineInstance as se
from arches.app.search.mappings import TERMS_INDEX, RESOURCES_INDEX
from arches.app.utils.betterJSONSerializer import JSONDeserializer
from arches.app.utils.response import JSONResponse

logger = logging.getLogger(__name__)
related_resource_template = {
    "resourceId": "",
    "ontologyProperty": "",
    "resourceXresourceId": "",
    "inverseOntologyProperty": "",
}


class UpdateResourceListView(View):
    """
    This view
    1. assumes one project resource, one collection resource, multiple physical thing resources
    2. if user send a collection resourceid, add or remove that resource id to the physical things in the data
    3. if user does not send any collection resourceid,
        a. create a collection instance
        b. add the collection to the project and
        c. add/remove the tile of the related collection to/from physical things (member_of_set_nodegroup_id)

    The request body should look like this
    {
        projectresourceid: always present but does not have to be used,
        collectionresourceid: optional if missing create a collection,
        transactionid: transaction_id if a part of workflow,
        data: [{
            resourceid: resourceid of resource to be edited,
            tileid: tileid of resource to be edited if available,
            action: 'add' or 'remove'
        }]
    }
    """

    def create_new_collection(self, transaction_id, project_name):
        collection_graphid = "1b210ef3-b25c-11e9-a037-a4d18cec433a"
        name_node_id = "52aa2007-c450-11e9-b5d4-a4d18cec433a"
        resource = Resource()
        resource.graph_id = collection_graphid
        resource.save(transaction_id=transaction_id)
        collection_resourceinstance_id = str(resource.pk)

        tile = Tile.get_blank_tile(nodeid=name_node_id, resourceid=collection_resourceinstance_id)
        stringDataType = StringDataType()
        tile.data[name_node_id] = stringDataType.transform_value_for_tile("Collection for {0}".format(project_name))
        tile.save(transaction_id=transaction_id, index=False)

        resource.calculate_descriptors()
        resource.save(index=False)

        return resource, tile.tileid

    def add_collection_to_project(self, resourceinstaneid, r_resourceinstaneid, transaction_id):
        used_set_node_id = "cc5d6df3-d477-11e9-9f59-a4d18cec433a"  # Project nodegroup (hidden nodegroup)
        related_resource_template["resourceId"] = r_resourceinstaneid
        tile = Tile.get_blank_tile(nodeid=used_set_node_id, resourceid=resourceinstaneid)
        tile.data[used_set_node_id] = [related_resource_template]
        tile.save(transaction_id=transaction_id, index=False)

        return (tile.tileid, Resource.objects.get(pk=tile.resourceinstance_id))

    def post(self, request):
        def bulk_update(resources):
            """
            Saves and indexes a list of resources

            Arguments:
            resources -- a list of resource models

            Keyword Arguments:
            transaction_id -- a uuid identifing the save of these instances as belonging to a collective load or process

            """

            datatype_factory = DataTypeFactory()
            node_datatypes = {str(nodeid): datatype for nodeid, datatype in Node.objects.values_list("nodeid", "datatype")}
            tiles = []
            documents = []
            term_list = []

            for resource in resources:
                resource.tiles = resource.get_flattened_tiles()
                tiles.extend(resource.tiles)

            # need to save the models first before getting the documents for index
            for tile in tiles:
                TileModel.objects.update_or_create(tile)

            for resource in resources:
                document, terms = resource.get_documents_to_index(
                    fetchTiles=True, datatype_factory=datatype_factory, node_datatypes=node_datatypes
                )

                documents.append(se.create_bulk_item(index=RESOURCES_INDEX, id=document["resourceinstanceid"], data=document))

                for term in terms:
                    term_list.append(se.create_bulk_item(index=TERMS_INDEX, id=term["_id"], data=term["_source"]))

            se.bulk_index(documents)
            se.bulk_index(term_list)

        member_of_set_node_id = "63e49254-c444-11e9-afbe-a4d18cec433a"  # Physical Thing nodegroup
        project_resourceid = request.POST.get("projectresourceid", None)
        collection_resourceid = request.POST.get("collectionresourceid", None)
        data = JSONDeserializer().deserialize(request.POST.get("data"))
        transaction_id = request.POST.get("transactionid", None)
        project_name = Resource.objects.get(pk=project_resourceid).name
        ret = {}
        resources = []
        with transaction.atomic():

            if collection_resourceid is None:
                collection_resource, collection_name_tile_id = self.create_new_collection(transaction_id, project_name)
                collection_resourceid = str(collection_resource.resourceinstanceid)
                resources.append(collection_resource)
                (project_used_set_tile_id, resource) = self.add_collection_to_project(
                    project_resourceid, collection_resourceid, transaction_id
                )
                resources.append(resource)
                ret = {
                    "collectionResourceid": collection_resourceid,
                    "collectionNameTileId": collection_name_tile_id,
                    "projectUsedSetTileId": project_used_set_tile_id,
                }

            try:
                for datum in data:
                    action = datum["action"]
                    resource_id = datum["resourceid"] if "resourceid" in datum else None
                    tile_id = datum["tileid"] if "tileid" in datum else None

                    if tile_id is not None:
                        tile = Tile.objects.get(pk=tile_id)
                    else:
                        try:
                            tile = Tile.objects.get(resourceinstance=resource_id, nodegroup=member_of_set_node_id)
                        except ObjectDoesNotExist as e:
                            tile = Tile.get_blank_tile(nodeid=member_of_set_node_id, resourceid=resource_id)
                            tile.data[member_of_set_node_id] = []

                    list_of_rr_resources = [data["resourceId"] for data in tile.data[member_of_set_node_id]]

                    if collection_resourceid not in list_of_rr_resources and action == "add":
                        related_resource_template["resourceId"] = collection_resourceid
                        tile.data[member_of_set_node_id].append(related_resource_template)
                        resources.append(Resource.objects.get(pk=tile.resourceinstance_id))
                        tile.save(transaction_id=transaction_id, index=False)
                    elif collection_resourceid in list_of_rr_resources and action == "remove":
                        rr_data = tile.data[member_of_set_node_id]
                        tile.data[member_of_set_node_id] = [rr for rr in rr_data if rr["resourceId"] != collection_resourceid]
                        resources.append(Resource.objects.get(pk=tile.resourceinstance_id))
                        tile.save(transaction_id=transaction_id, index=False)
                bulk_update(resources)

                return JSONResponse({"result": ret})

            except Exception as e:
                logger.exception(e)
                response = {"result": "failed", "message": [_("Request Failed"), _("Unable to save")]}
                return JSONResponse(response, status=500)
