import json
import logging
import os
import requests
import shutil
from afs.settings import CANTALOUPE_DIR, CANTALOUPE_HTTP_ENDPOINT, MEDIA_ROOT, MEDIA_URL, APP_ROOT, ARCHES_HOST_ENDPOINT
from arches.app.functions.base import BaseFunction
from arches.app.models import models
from arches.app.models.resource import Resource


details = {
    "name": "File to IIIF",
    "type": "node",
    "description": "copies uploaded files into a Cantaloupe host dir, creates IIIF manifest json and db record",
    "defaultconfig": {"selected_nodegroup": ""},
    "classname": "FileToIIIF",
    "component": "views/components/functions/file-to-iiif",
    "functionid": "210519e3-ee55-460a-ab6d-0b56e1b5ba3a",
}

logger = logging.getLogger(__name__)


class FileToIIIF(BaseFunction):
    def postSave(self, tile, request):

        acceptable_types = ["jpg", "jpeg", "tiff", "tif", "png"]  # 2nd validation in case card not configured to filter image filetypes
        files = list(models.File.objects.filter(tile=tile))
        resource = Resource.objects.get(resourceinstanceid=tile.resourceinstance_id)
        name = resource.displayname
        desc = resource.displaydescription

        for f in files:
            if any(ac == (f.path.name.split(".")[-1]) for ac in acceptable_types):
                dest = os.path.join(CANTALOUPE_DIR, os.path.basename(f.path.url))
                file_name = f.path.name.split("/")[-1]
                file_name_less_ext = file_name[: (file_name.index(file_name.split(".")[-1]) - 1)]  # end slice before the '.'
                file_url = CANTALOUPE_HTTP_ENDPOINT + "iiif/2/" + file_name
                file_json = file_url + "/info.json"
                logger.info("copying file to local dir")
                shutil.copyfile(os.path.join(MEDIA_ROOT, f.path.name), dest)
                image_json = self.fetch(file_json)
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
                            "canvases": [
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
                                    "label": name,
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
                            ],
                            "label": "Object",
                            "startCanvas": "",
                        }
                    ],
                }

                json_url = ARCHES_HOST_ENDPOINT + MEDIA_URL + "uploadedfiles/" + (file_name_less_ext + ".json")  # hosted address
                json_path = os.path.join(APP_ROOT, "uploadedfiles", (file_name_less_ext + ".json"))  # abs address
                with open(json_path, "w") as pres_json:
                    json.dump(pres_dict, pres_json)

                manifest = models.IIIFManifest.objects.create(label=name, description=desc, url=json_url)
                manifest.save()

            else:
                logger.warn("filetype unacceptable: " + f.path.name)

    def fetch(self, url):
        resp = requests.get(url)
        return resp.json()

    def on_import(self, tile):
        raise NotImplementedError

    def after_function_save(self, tile, request):
        raise NotImplementedError

    def get(self):
        raise NotImplementedError
