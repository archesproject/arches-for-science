import json
import logging
import os
import requests
import shutil
import uuid
from django.core.files.storage import default_storage
from django.http import HttpRequest
from django.views.generic import View
from arches.app.utils.response import JSONResponse
from arches.app.models import models
from arches.app.models.tile import Tile
from arches.app.views.search import search_results

from afs.settings import CANTALOUPE_DIR, CANTALOUPE_HTTP_ENDPOINT, MEDIA_ROOT, MEDIA_URL, APP_ROOT

logger = logging.getLogger(__name__)

class ManifestManagerView(View):
    def post(self, request):
        def create_manifest(name, desc, file_url, canvases):
            return  {
                        "@context": "http://iiif.io/api/presentation/2/context.json",
                        "@type": "sc:Manifest",
                        "description": desc,
                        "label": name,
                        "logo": "",
                        "metadata": [{"label": "TBD", "value": ["Unknown"]}],
                        "thumbnail": {
                            "@id": file_url + "/full/!300,300/0/default.jpg",
                            "@type": "dctypes:Image",
                            "format": "image/jpeg",
                            "label": "Main VIew (.45v)",
                        },
                        "sequences": [{
                                "@id": CANTALOUPE_HTTP_ENDPOINT + "iiif/manifest/sequence/TBD.json",
                                "@type": "sc:Sequence",
                                "canvases": canvases,
                                "label": "Object",
                                "startCanvas": "",
                            }],
                    }

        def create_canvas(image_json, file_url, i):
            return  {
                        "@id": CANTALOUPE_HTTP_ENDPOINT + "iiif/manifest/canvas/TBD.json",
                        "@type": "sc:Canvas",
                        "height": image_json["height"],
                        "width": image_json["width"],
                        "images": [
                            {
                                "@id": CANTALOUPE_HTTP_ENDPOINT + "iiif/manifest/annotation/TBD.json",
                                "@type": "oa.Annotation",
                                "motivation": "unknown",
                                "on": CANTALOUPE_HTTP_ENDPOINT + "iiif/manifest/canvas/TBD.json",
                                "resource": {
                                    "@id": file_url + "/full/full/0/default.jpg",
                                    "@type": "dctypes:Image",
                                    "format": "image/jpeg",
                                    "height": image_json["height"],
                                    "width": image_json["width"],
                                    "service": {
                                        "@context": "http://iiif.io/api/image/2/context.json",
                                        "@id": file_url,
                                        "profile": "http://iiif.io/api/image/2/level2.json",
                                    },
                                },
                            }
                        ],
                        "label": f"{name} p. {i + 1}",
                        "license": "TBD",
                        "thumbnail": {
                            "@id": file_url + "/full/!300,300/0/default.jpg",
                            "@type": "dctypes:Image",
                            "format": "image/jpeg",
                            "service": {
                                "@context": "http://iiif.io/api/image/2/context.json",
                                "@id": file_url,
                                "profile": "http://iiif.io/api/image/2/level2.json",
                            },
                        },
                    }

        def delete_manifest(manifest):
            manifest = models.IIIFManifest.objects.get(url=manifest)
            manifest.delete()
            return ""

        def add_canvases(manifest, canvases):
            manifest = models.IIIFManifest.objects.get(url=manifest)
            manifest.manifest['sequences'][0]['canvases'] += canvases
            manifest.save()
            return manifest

        def delete_canvas(manifest, canvas): # it is possible to use canvas id?
            manifest = models.IIIFManifest.objects.get(url=manifest)
            canvases = manifest.manifest['sequences'][0]['canvases']
            canvasIdToRemove = canvas.images[0].resource.service['@id']
            for i in len(canvases):
                if canvases[i].images[0].resource.service['@id'] == canvasIdToRemove:
                    toBeRemoved = i
            manifest.manifest['sequences'][0]['canvases'].pop(toBeRemoved)
            manifest.save()
            return manifest

        def create_image(file):
            newImageId = uuid.uuid4()
            newImage = models.ManifestImage.objects.create(imageid=newImageId, image=file)
            newImage.save()

            file_name = os.path.basename(newImage.image.name)
            file_url = CANTALOUPE_HTTP_ENDPOINT + "iiif/2/" + file_name
            file_json = file_url + "/info.json"
            image_json = self.fetch(file_json)
            return image_json, file_url

        def get_image_count(manifest):
            manifest = models.IIIFManifest.objects.get(url=manifest)
            return len(manifest.manifest['sequences'][0]['canvases'])

        acceptable_types = [
            ".jpg",
            ".jpeg",
            ".tiff",
            ".tif",
            ".png",
        ]

        files = request.FILES.getlist("files")
        name = request.POST.get("manifest_title")
        desc = request.POST.get("manifest_description")
        # operation = ['create', 'add', 'remove', 'delete']
        operation = request.POST.get('operation')
        selected_canvas = request.POST.get('selected_canvas')
        manifest = request.POST.get('manifest')

        if not os.path.exists(CANTALOUPE_DIR):
            os.mkdir(CANTALOUPE_DIR)

        if operation == 'create' or operation is None:
            canvases = []
            for f in files:
                if os.path.splitext(f.name)[1].lower() in acceptable_types:
                    try:
                        image_json, file_url = create_image(f)
                    except:
                        return
                    canvas = create_canvas(image_json, file_url, 0)
                    canvases.append(canvas)
                else:
                    logger.warn("filetype unacceptable: " + f.name)

            pres_dict = create_manifest(name, desc, file_url, canvases)

            # create a manuscript record in the db
            manifest = models.IIIFManifest.objects.create(label=name, description=desc, manifest=pres_dict)
            manifest_id = manifest.id
            json_url = f"/manifest/{manifest_id}"
            manifest.url = json_url
            manifest.save()

            return JSONResponse(manifest)

        if operation == 'delete':
            updated_manifest = delete_manifest(manifest)
            return JSONResponse(updated_manifest)

        if operation == 'add':
            try:
                canvases = []
                i = get_image_count(manifest)
                for f in files:
                    if os.path.splitext(f.name)[1].lower() in acceptable_types:
                        try:
                            image_json, file_url = create_image(f)
                        except:
                            return
                        canvas = create_canvas(image_json, file_url, i)
                        canvases.append(canvas)
                        i += 1
                    else:
                        logger.warn("filetype unacceptable: " + f.name)
                updated_manifest = add_canvases(manifest, canvases)
                return JSONResponse(updated_manifest)
            except:
                logger.warning("You have to select a manifest to add images")

        if operation == 'remove':
            updated_manifest = delete_canvas(manifest, selected_canvas)
            return JSONResponse(updated_manifest)

    def fetch(self, url):
        try:
            resp = requests.get(url)
            return resp.json()
        except:
            logger.warn("Manifest not created. Check if Cantaloupe running")
            return None

    def on_import(self, tile):
        raise NotImplementedError

    def after_function_save(self, tile, request):
        raise NotImplementedError

    def get(self):
        raise NotImplementedError
