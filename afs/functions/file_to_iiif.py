import os
import shutil
from afs.settings import CANTALOUPE_DIR, MEDIA_ROOT
from arches.app.functions.base import BaseFunction
from arches.app.models import models


details = {
    "name": "File to IIIF",
    "type": "node",
    "description": "copies uploaded files into a directory reserved for local Cantaloupe host (for IIIF hosting)",
    "defaultconfig": {"selected_nodegroup": ""},
    "classname": "FileToIIIF",
    "component": "views/components/functions/file-to-iiif",
    "functionid": "210519e3-ee55-460a-ab6d-0b56e1b5ba3a",
}


class FileToIIIF(BaseFunction):
    def save(self, tile, request):

        acceptable_types = ["jpg", "tiff", "tff", "png"]
        files = list(models.File.objects.filter(tile=tile))

        for f in files:
            print(f.path.name)
            try:
                if any(ac == (f.path.name.split(".")[-1]) for ac in acceptable_types):
                    print("copying...")
                    shutil.copyfile(os.path.join(MEDIA_ROOT, f.path.name), os.path.join(CANTALOUPE_DIR, os.path.basename(f.path.url)))
                else:
                    print("filetype unacceptable: " + f.path.name)

            except Exception as e:
                raise e

    
    def on_import(self,tile):
        raise NotImplementedError

    def after_function_save(self, tile, request):
        raise NotImplementedError

    def get(self):
        raise NotImplementedError
