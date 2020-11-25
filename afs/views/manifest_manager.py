import json
import logging
import os
import requests
import shutil
from django.views.generic import View
from django.http import HttpRequest
from arches.app.utils.response import JSONResponse
from arches.app.models import models
from arches.app.models.tile import Tile
from arches.app.views.search import search_results

from afs.settings import CANTALOUPE_DIR, CANTALOUPE_HTTP_ENDPOINT, MEDIA_ROOT, MEDIA_URL, APP_ROOT

logger = logging.getLogger(__name__)

class ManifestManagerView(View):
    def post(self, request):

        files = request.POST.get("data") # nedd to get the file 
        name = "manifest" # to be changed, may be able to get this from request
        desc = "description"  # to be changed

        acceptable_types = [
            ".jpg",
            ".jpeg",
            ".tiff",
            ".tif",
            ".png",
        ]

        if not os.path.exists(CANTALOUPE_DIR):
            os.mkdir(CANTALOUPE_DIR)

        canvases = []
        for f in files:
            if os.path.splitext(f.name)[1].lower() in acceptable_types:
                dest = os.path.join(CANTALOUPE_DIR, os.path.basename(f.path.url))
                file_name = os.path.basename(f.name)
                file_url = CANTALOUPE_HTTP_ENDPOINT + "iiif/2/" + file_name
                file_json = file_url + "/info.json"
                logger.info("copying file to local dir")
                shutil.copyfile(os.path.join(MEDIA_ROOT, f.path.name), dest)
                image_json = self.fetch(file_json)
                if image_json is None:
                    return
                canvases.append(
                    {
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
                        "label": f"{name} p. {len(canvases) + 1}",
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
                )
            else:
                logger.warn("filetype unacceptable: " + f.path.name)
        pres_dict = {
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
            "sequences": [
                {
                    "@id": CANTALOUPE_HTTP_ENDPOINT + "iiif/manifest/sequence/TBD.json",
                    "@type": "sc:Sequence",
                    "canvases": canvases,
                    "label": "Object",
                    "startCanvas": "",
                }
            ],
        }

        # create manuscript record in the db
        manifest = models.IIIFManifest.objects.create(label=name, description=desc, manifest=pres_dict)
        manifest_id = manifest.id
        json_url = f"/manifest/{manifest_id}"
        manifest.url = json_url
        manifest.save()
