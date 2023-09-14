from io import FileIO
from mimetypes import MimeTypes
from urllib import response
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
from django.http import HttpRequest, HttpResponseBadRequest
import zipfile


class UpdateFileFormat(View):
    def post(self, request, tileid):
        format_mappings = {
            "bm6": "xrf",
            "b5g": "xrf",
            "bt45": "xrf",
            "bt3": "xrf",
            "b5i": "xrf",
            "bart": "xrf",
            "r785": "raman",
            "r633": "raman",
            "asd": "fors",
        }
        renderer_lookup = {
            "fors": "88dccb59-14e3-4445-8f1b-07f0470b38bb",
            "raman": "94fa1720-6773-4f99-b49b-4ea0926b3933",
            "xrf": "31be40ae-dbe6-4f41-9c13-1964d7d17042",
        }

        body = JSONDeserializer().deserialize(request.body)
        format = body["format"]
        if format not in format_mappings:
            return HttpResponseBadRequest(body="Format not found.")
        file_data_node_id = "7c486328-d380-11e9-b88e-a4d18cec433a"
        file_tile = Tile.objects.get(pk=tileid)
        file_tile.data[file_data_node_id][0]["format"] = format
        file_tile.data[file_data_node_id][0]["renderer"] = renderer_lookup[format_mappings[format]]
        file_tile.save()
        return JSONResponse({"updated": True})
