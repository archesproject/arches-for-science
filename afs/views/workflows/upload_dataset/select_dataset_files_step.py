from io import FileIO
from mimetypes import MimeTypes
from django.views.generic import View
from django.db import transaction
import os
import io
from arches.app.utils.response import JSONResponse
from arches.app.views.tile import TileData
from arches.app.models.tile import Tile
from arches.app.models.resource import Resource
from arches.app.models.models import Node
from arches.app.utils.betterJSONSerializer import JSONSerializer, JSONDeserializer
import json
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.http import HttpRequest
import zipfile


class SelectDatasetFilesStep(View):
    def post(self, request):
        recorded_value_node_id = "dd596aae-c457-11e9-956b-a4d18cec433a"
        digital_reference_node_id = "a298ee52-8d59-11eb-a9c4-faffc265b501"
        digital_reference_node_group_id = "8a4ad932-8d59-11eb-a9c4-faffc265b501"
        dataset_name_node_group_id = "d2fdae3d-ca7a-11e9-ad84-a4d18cec433a"
        dataset_name_node_id = "d2fdc2fa-ca7a-11e9-8ffb-a4d18cec433a"
        dataset_file_node_group_id = "7c486328-d380-11e9-b88e-a4d18cec433a"
        dataset_file_node_id = "7c486328-d380-11e9-b88e-a4d18cec433a"
        renderer_lookup = {
                "artax": "88dccb59-14e3-4445-8f1b-07f0470b38bb",
                "raman": "94fa1720-6773-4f99-b49b-4ea0926b3933",
                "xrf": "31be40ae-dbe6-4f41-9c13-1964d7d17042",
                "image": "5e05aa2e-5db0-4922-8938-b4d2b7919733",
                "pdf": "09dec059-1ee8-4fbd-85dd-c0ab0428aa94"
            }
        transaction_id = request.POST.get('transaction_id')
        observation_id = request.POST.get('observation_id')
        posted_dataset = request.POST.get('dataset')
        observation_ref_tile = request.POST.get('observation_ref_tile', None)

        with transaction.atomic():
            dataset = JSONDeserializer().deserialize(posted_dataset)
            tile_id = dataset.get('tileId', None)
            part_resource_id = dataset.get('partResourceId', None)
            dataset_resource_id = dataset.get('resourceInstanceId', None)

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

            dataset_name_tile.data[dataset_name_node_id] = dataset.get('name')
            dataset_name_tile.save(transaction_id=transaction_id)
            dataset_resource.load_tiles(user=request.user)

            if not dataset_resource_id:
                # save dataset's relationship with part resource ID.
                digital_reference_tile = Tile().get_blank_tile_from_nodegroup_id(digital_reference_node_group_id)
                digital_reference_tile.resourceinstance_id = part_resource_id
                digital_reference_tile.data[digital_reference_node_id] = [{
                    "resourceId": str(dataset_resource.resourceinstanceid),
                    "ontologyProperty": "",
                    "inverseOntologyProperty": ""
                }]

                digital_reference_tile.save(user=request.user, transaction_id=transaction_id)

            #create observation cross references
            if observation_ref_tile != None:
                observation_reference_tile = Tile.objects.get(tileid=observation_ref_tile)
                relationships = observation_reference_tile.data[recorded_value_node_id]
                part_relationships = [item for item in relationships if item["partResource"] == part_resource_id]
                if len(part_relationships) == 0:
                    observation_reference_tile.data[recorded_value_node_id].append({
                        "resourceId": str(dataset_resource.resourceinstanceid),
                        "ontologyProperty": "",
                        "inverseOntologyProperty": "",
                        "partResource": part_resource_id
                    })

            else:
                observation_reference_tile = Tile().get_blank_tile_from_nodegroup_id(recorded_value_node_id)
                observation_reference_tile.resourceinstance_id = observation_id
                observation_reference_tile.data[recorded_value_node_id] = [{
                    "resourceId": str(dataset_resource.resourceinstanceid),
                    "ontologyProperty": "",
                    "inverseOntologyProperty": "",
                    "partResource": part_resource_id
                }]

            observation_reference_tile.save(user=request.user, transaction_id=transaction_id)

            
            # save files associated with digital resource
            dataset_files = request.FILES.getlist("file-list_{}".format(dataset_file_node_id), None)
            file_data_list = request.POST.getlist("file-list_{}_data".format(dataset_file_node_id), None)
            file_data_list = [JSONDeserializer().deserialize(fd) for fd in file_data_list]
            new_files = [] 
            for file in dataset_files:
                file_data = next((fd for fd in file_data_list if fd.get("name") == file.name), None)
                split_file_name = os.path.splitext(file.name)
                if split_file_name[1] in ['.zip']:
                    try:
                        instrument = os.path.splitext(split_file_name[0])[1].replace(".", "")
                    except:
                        instrument = None
                    with zipfile.ZipFile(file, "r") as myzip:
                        files = myzip.infolist()
                        for zip_file in files:
                            if not zip_file.filename.startswith("__MACOSX") and not zip_file.is_dir():
                                file_data_copy = file_data.copy()
                                new_file_bytes = io.BytesIO(myzip.read(zip_file.filename))
                                f = open('file_from_zip', 'wb')
                                f.write(new_file_bytes.read())
                                f.close()
                                type_tuple = MimeTypes().guess_type(zip_file.filename)
                                new_file_type = type_tuple[0] if type_tuple is not None else None
                                file_data_copy["name"] = zip_file.filename
                                file_data_copy["type"] = new_file_type #TODO
                                new_files.append((file_data_copy, instrument, InMemoryUploadedFile(
                                    new_file_bytes,
                                    "file-list_{}".format(dataset_file_node_id),
                                    zip_file.filename,
                                    new_file_type,
                                    zip_file.file_size,
                                    None
                                )))
                                
                                
                else:
                    new_files.append(file_data, None, file)
            removed_files = []
            for file in new_files: 
                if file[0] is not None:
                    file_data = file[0]
                    instrument = file[1]
                    file_content = file[2]

                    tiles = (tile for tile in dataset_resource.tiles if str(tile.nodegroup_id) == dataset_file_node_group_id)
                    # delete/replace tiles for files that share the same name
                    for tile in tiles:
                        if tile.data[dataset_file_node_id][0]['name'] == file_data['name']:
                            removed_files.append({"name": file_data['name'], "tileid": tile.tileid})
                            Tile.objects.get(pk=tile.tileid).delete(request=request)
                    dataset_resource.load_tiles(user=request.user)


                    split_file_mime = file_data["type"].split('/')
                    if "image" in split_file_mime:
                        file_data["renderer"] = renderer_lookup["image"]
                    elif "pdf" in split_file_mime:
                        file_data["renderer"] = renderer_lookup["pdf"]
                    elif instrument != None: # instrument was given by zip file name
                        file_data["renderer"] = renderer_lookup[instrument]

                    #file has not been uploaded
                    dataset_file_tile = Tile().get_blank_tile_from_nodegroup_id(dataset_file_node_group_id)
                    dataset_file_tile.resourceinstance_id = str(dataset_resource.resourceinstanceid)
                    dataset_file_tile.data[dataset_file_node_id] = [file[0]]
                    dataset_file_tile.tileid = ""
                    dataset_file_tile.pk = ""
                    new_req = HttpRequest()
                    new_req.method = 'POST'
                    new_req.user = request.user
                    new_req.POST['data'] = json.dumps(dataset_file_tile.serialize())
                    new_req.POST['transaction_id'] = transaction_id
                    
                    new_req.FILES["file-list_{}".format(dataset_file_node_id)] = file_content
                    new_tile = TileData()
                    new_tile.action = "update_tile"

                    raw_response = new_tile.post(new_req)
                    response = json.loads(raw_response.content)

                    # raising the error here will cause the transaction to fail; the resource/tiles will not be saved
                    if raw_response.status_code != 200:
                        raise
                    else:
                        file_data["tileid"] = response["tileid"]

        file_response = [{"name": f[0]["name"], "tileId": f[0]["tileid"]} for f in new_files]

        return JSONResponse({
            "observationReferenceTileId": str(observation_reference_tile.tileid),
            "datasetResourceId": str(dataset_name_tile.resourceinstance.resourceinstanceid),
            "datasetNameTileId": dataset_name_tile.tileid,
            "removedFiles": removed_files,
            "files": file_response
        })
