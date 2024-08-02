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


class SelectDatasetFilesStep(View):
    def post(self, request):
        recorded_value_node_id = "dd596aae-c457-11e9-956b-a4d18cec433a"
        digital_reference_node_id = "a298ee52-8d59-11eb-a9c4-faffc265b501"
        digital_reference_node_group_id = "8a4ad932-8d59-11eb-a9c4-faffc265b501"
        dataset_name_node_group_id = "d2fdae3d-ca7a-11e9-ad84-a4d18cec433a"
        dataset_name_node_id = "d2fdc2fa-ca7a-11e9-8ffb-a4d18cec433a"
        dataset_file_node_group_id = "7c486328-d380-11e9-b88e-a4d18cec433a"
        dataset_file_node_id = "7c486328-d380-11e9-b88e-a4d18cec433a"

        # relationship valueids
        recorded_value_of_observation = "96a4e8f5-6214-4af3-b4cc-b79c206d00f0"
        output_of = "9566b743-b23e-41df-bddb-af75f22edcc5"
        digital_source = "be3f33e9-216d-4355-8766-aced1e95616c"
        digital_source_for = "ff6a0510-6c91-4c45-8c67-dbbcf8d7d7fa"

        transaction_id = request.POST.get("transaction_id")
        observation_id = request.POST.get("observation_id")
        posted_dataset = request.POST.get("dataset")
        observation_ref_tile = request.POST.get("observation_ref_tile", None)

        with transaction.atomic():
            dataset = JSONDeserializer().deserialize(posted_dataset)
            tile_id = dataset.get("tileId", None)
            part_resource_id = dataset.get("partResourceId", None)
            dataset_resource_id = dataset.get("resourceInstanceId", None)

            # create a dataset (digital resource) and a name tile for it.
            if not dataset_resource_id:
                graphid = Node.objects.filter(nodegroup=dataset_name_node_group_id)[0].graph_id
                dataset_resource = Resource()
                dataset_resource.graph_id = graphid
                dataset_resource.save(user=request.user, transaction_id=transaction_id)

                dataset_name_tile = Tile().get_blank_tile_from_nodegroup_id(dataset_name_node_group_id)
                dataset_name_tile.resourceinstance_id = dataset_resource.resourceinstanceid
            else:
                dataset_resource = Resource.objects.get(pk=dataset_resource_id)
                dataset_name_tile = Tile.objects.get(pk=tile_id)

            string_data_type = StringDataType()
            dataset_name_tile.data[dataset_name_node_id] = string_data_type.transform_value_for_tile(dataset.get("name"))
            dataset_name_tile.save(transaction_id=transaction_id)
            dataset_resource.load_tiles()

            if not dataset_resource_id:
                # save dataset's relationship with part resource ID.
                digital_reference_tile = Tile().get_blank_tile_from_nodegroup_id(digital_reference_node_group_id)
                digital_reference_tile.resourceinstance_id = part_resource_id
                digital_reference_tile.data[digital_reference_node_id] = [
                    {
                        "resourceId": str(dataset_resource.resourceinstanceid),
                        "ontologyProperty": digital_source,
                        "inverseOntologyProperty": digital_source_for,
                    }
                ]
                digital_reference_tile.save(user=request.user, transaction_id=transaction_id)

            # create observation cross references
            if observation_ref_tile is not None:
                observation_reference_tile = Tile.objects.get(tileid=observation_ref_tile)
                relationships = observation_reference_tile.data[recorded_value_node_id]
                part_relationships = [item for item in relationships if item["partResource"] == part_resource_id]
                if len(part_relationships) == 0:
                    observation_reference_tile.data[recorded_value_node_id].append(
                        {
                            "resourceId": str(dataset_resource.resourceinstanceid),
                            "ontologyProperty": recorded_value_of_observation,
                            "inverseOntologyProperty": output_of,
                            "partResource": part_resource_id,
                        }
                    )
            else:
                observation_reference_tile = Tile().get_blank_tile_from_nodegroup_id(recorded_value_node_id)
                observation_reference_tile.resourceinstance_id = observation_id
                observation_reference_tile.data[recorded_value_node_id] = [
                    {
                        "resourceId": str(dataset_resource.resourceinstanceid),
                        "ontologyProperty": recorded_value_of_observation,
                        "inverseOntologyProperty": output_of,
                        "partResource": part_resource_id,
                    }
                ]

            observation_reference_tile.save(user=request.user, transaction_id=transaction_id)

            # save files associated with digital resource
            dataset_files = request.FILES.getlist("file-list_{}_preloaded".format(dataset_file_node_id), []) + request.FILES.getlist(
                "file-list_{}".format(dataset_file_node_id), []
            )
            file_data_list = request.POST.getlist("file-list_{}_data".format(dataset_file_node_id), None)
            file_data_list = [JSONDeserializer().deserialize(fd) for fd in file_data_list]
            new_files = []
            for file in dataset_files:
                file_data = next((fd for fd in file_data_list if fd.get("name") == file.name), None)

                new_files.append((file_data, file))

            removed_files = []
            for file in new_files:
                if file[0] is not None:
                    file_data = file[0]
                    file_content = file[1]

                    tiles = (tile for tile in dataset_resource.tiles if str(tile.nodegroup_id) == dataset_file_node_group_id)
                    # delete/replace tiles for files that share the same name
                    for tile in tiles:
                        if tile.data[dataset_file_node_id][0]["name"] == file_data["name"]:
                            removed_files.append({"name": file_data["name"], "tileid": tile.tileid})
                            Tile.objects.get(pk=tile.tileid).delete(request=request)
                    dataset_resource.load_tiles()

                    split_file_mime = file_data["type"].split("/")
                    if "image" in split_file_mime:
                        file_data["renderer"] = next(
                            (renderer["id"] for renderer in settings.RENDERERS if renderer["name"] == "imagereader"), None
                        )
                    elif "pdf" in split_file_mime:
                        file_data["renderer"] = next(
                            (renderer["id"] for renderer in settings.RENDERERS if renderer["name"] == "pdfreader"), None
                        )
                    elif file_data["name"].split(".")[-1] in settings.XY_TEXT_FILE_FORMATS:  # instrument was given by zip file name
                        file_data["renderer"] = next(
                            (renderer["id"] for renderer in settings.RENDERERS if renderer["name"] == "xy-reader"), None
                        )
                        file_data["type"] = "text/plain"

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

                    # raising the error here will cause the transaction to fail; the resource/tiles will not be saved
                    if raw_response.status_code != 200:
                        raise Exception
                    else:
                        file_data["tileid"] = response["tileid"]
                        file_data["path"] = response["data"][dataset_file_node_id][0]["path"]
            file_response = [
                {
                    "name": f[0]["name"],
                    "path": f[0]["path"],
                    "clientId": f[0]["clientFileId"] if "clientFileId" in f[0] else "",
                    "renderer": f[0]["renderer"] if "renderer" in f[0] else "",
                    "format": f[0].get("format", None),
                    "tileId": f[0]["tileid"],
                }
                for f in new_files
            ]

        return JSONResponse(
            {
                "observationReferenceTileId": str(observation_reference_tile.tileid),
                "datasetResourceId": str(dataset_name_tile.resourceinstance.resourceinstanceid),
                "datasetNameTileId": dataset_name_tile.tileid,
                "removedFiles": removed_files,
                "files": file_response,
            }
        )
