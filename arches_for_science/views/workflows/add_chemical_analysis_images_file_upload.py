from io import FileIO
from mimetypes import MimeTypes
from django.views.generic import View
from django.db import transaction
import os
import io
from arches.app.datatypes.datatypes import StringDataType
from arches.app.utils.response import JSONResponse
from arches.app.views.tile import TileData
from arches.app.models.tile import Tile
from arches.app.models.resource import Resource
from arches.app.models.models import Node
from arches.app.utils.betterJSONSerializer import JSONSerializer, JSONDeserializer
import json
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.http import HttpRequest
from django.conf import settings


class AddChemicalAnalysisImagesFileUpload(View):
    def post(self, request):
        observation_digital_source_nodegroup_id = "0ae149ba-8e30-11eb-a9c4-faffc265b501"
        observation_digital_source_node_id = "0ae14d2a-8e30-11eb-a9c4-faffc265b501"
        dataset_name_node_group_id = "d2fdae3d-ca7a-11e9-ad84-a4d18cec433a"
        dataset_name_node_id = "d2fdc2fa-ca7a-11e9-8ffb-a4d18cec433a"
        dataset_file_node_group_id = "7c486328-d380-11e9-b88e-a4d18cec433a"
        dataset_file_node_id = "7c486328-d380-11e9-b88e-a4d18cec433a"

        transaction_id = request.POST.get("transaction_id")
        observation_id = request.POST.get("observation_id")
        digital_resource_instance_ids = []

        files = request.FILES.getlist("file-list_{}_preloaded".format(dataset_file_node_id), [])
        removed_files = []
        # Relate each dataset to existing observation


        def create_reference_to_observation(dataset_resource):
            observation_reference_tile = Tile().get_blank_tile_from_nodegroup_id(observation_digital_source_nodegroup_id)
            observation_reference_tile.resourceinstance_id = observation_id
            observation_reference_tile.data[observation_digital_source_node_id] = [
                {
                    "resourceId": str(dataset_resource.resourceinstanceid),
                    "ontologyProperty": "",
                    "inverseOntologyProperty": "",
                }
            ]

            observation_reference_tile.save(user=request.user, transaction_id=transaction_id)


        def create_digital_resource(file):
            # create a dataset (digital resource) and a name tile for it.
            graphid = Node.objects.filter(nodegroup=dataset_name_node_group_id)[0].graph_id
            dataset_resource = Resource()
            dataset_resource.graph_id = graphid
            dataset_resource.save(user=request.user, transaction_id=transaction_id)

            dataset_name_tile = Tile().get_blank_tile_from_nodegroup_id(dataset_name_node_group_id)
            dataset_name_tile.resourceinstance_id = dataset_resource.resourceinstanceid

            string_data_type = StringDataType()
            dataset_name_tile.data[dataset_name_node_id] = string_data_type.transform_value_for_tile(file['name'])
            dataset_name_tile.save(transaction_id=transaction_id)
            dataset_resource.load_tiles(user=request.user)
            
            return dataset_resource
        

        def save_file(dataset_resource, file):


                dataset_default_format = None

                if file[0] is not None:
                    file_data = file[0]
                    file_content = file[1]

                    tiles = (tile for tile in dataset_resource.tiles if str(tile.nodegroup_id) == dataset_file_node_group_id)
                    # delete/replace tiles for files that share the same name
                    for tile in tiles:
                        if tile.data[dataset_file_node_id][0]["name"] == file_data["name"]:
                            removed_files.append({"name": file_data["name"], "tileid": tile.tileid})
                            Tile.objects.get(pk=tile.tileid).delete(request=request)
                    dataset_resource.load_tiles(user=request.user)

                    split_file_mime = file_data["type"].split("/")
                    if "image" in split_file_mime:
                        file_data["renderer"] = next(
                            (renderer["id"] for renderer in settings.RENDERERS if renderer["name"] == "imagereader"), None
                        )
                    elif "pdf" in split_file_mime:
                        file_data["renderer"] = next(
                            (renderer["id"] for renderer in settings.RENDERERS if renderer["name"] == "pdfreader"), None
                        )
                    elif dataset_default_format is not None:  # instrument was given by zip file name
                        file_data["renderer"] = next(
                            (format["renderer"] for format in settings.FORMATS if format["id"] == dataset_default_format), None
                        )
                        file_data["format"] = dataset_default_format


                    # file has not been uploaded
                    dataset_file_tile = Tile().get_blank_tile_from_nodegroup_id(dataset_file_node_group_id)
                    dataset_file_tile.resourceinstance_id = str(dataset_resource.resourceinstanceid)
                    dataset_file_tile.data[dataset_file_node_id] = [file[0]]
                    dataset_file_tile.tileid = ""
                    dataset_file_tile.pk = ""
                    new_req = HttpRequest()
                    new_req.method = "POST"
                    new_req.user = request.user
                    new_req.POST["data"] = json.dumps(dataset_file_tile.serialize())
                    new_req.POST["transaction_id"] = transaction_id
                    if len(request.FILES.getlist("file-list_{}".format(dataset_file_node_id), [])) > 0:
                        new_req.FILES["file-list_{}".format(dataset_file_node_id)] = file_content
                    elif len(request.FILES.getlist("file-list_{}_preloaded".format(dataset_file_node_id), [])) > 0:
                        new_req.FILES["file-list_{}_preloaded".format(dataset_file_node_id)] = file_content
                    new_tile = TileData()
                    new_tile.action = "update_tile"

                    raw_response = new_tile.post(new_req)
                    response = json.loads(raw_response.content)

                    
                    digital_resource_instance_ids.append(dataset_file_tile.resourceinstance_id)

                    # raising the error here will cause the transaction to fail; the resource/tiles will not be saved
                    if raw_response.status_code != 200:
                        raise
                    else:
                        file_data["tileid"] = response["tileid"]

        with transaction.atomic():
            dataset_files = request.FILES.getlist("file-list_{}_preloaded".format(dataset_file_node_id), []) + request.FILES.getlist(
                "file-list_{}".format(dataset_file_node_id), []
            )
            file_data_list = request.POST.getlist("file-list_{}_data".format(dataset_file_node_id), None)
            file_data_list = [JSONDeserializer().deserialize(fd) for fd in file_data_list]
            new_files = []
            for file in dataset_files:
                file_data = next((fd for fd in file_data_list if fd.get("name") == file.name), None)

                new_files.append((file_data, file))

            for file in new_files:
                dataset_resource = create_digital_resource(file[0])
                save_file(dataset_resource, file)
                create_reference_to_observation(dataset_resource)


        return JSONResponse(
            {
                "digitalResourceInstanceIds": digital_resource_instance_ids
            }
        )
