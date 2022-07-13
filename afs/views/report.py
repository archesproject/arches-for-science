from io import BytesIO
import logging
import json
from django.conf import settings
from django.http import HttpResponse, HttpResponseServerError
from django.utils.translation import ugettext as _
from django.views.generic import View
from arches.app.utils.response import JSONResponse
from arches.app.models.resource import Resource
from docx import Document
from pptx import Presentation

logger = logging.getLogger(__name__)


class ReportView(View):
    def get(self, request):
        return JSONResponse(settings.AFS_CUSTOM_REPORTS)

    def post(self, request):
        json_data = json.loads(request.body)
        title_key = "b5b38bde-b2f2-11e9-aff6-a4d18cec433a"
        template_id = json_data["templateid"] if "templateid" in json_data else None
        project_id = json_data["projectid"] if "projectid" in json_data else None
        template = settings.AFS_CUSTOM_REPORTS[template_id] if template_id in settings.AFS_CUSTOM_REPORTS else None
        project = Resource.objects.filter(pk=project_id)[0]
        project.load_tiles()
        tiles = project.tiles

        bytestream = BytesIO()

        if template.endswith("docx"):
            doc = Document(template)

            for tile in tiles:
                for key in tile.data:
                    if key == title_key:
                        title = tile.data[key] + ".docx"
                    for p in doc.paragraphs:
                        if key in p.text:
                            p.text = p.text.replace("<" + key + ">", tile.data[key])
            doc.save(bytestream)
            mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

        elif template.endswith("pptx"):
            pptx = Presentation(template)

            for tile in tiles:
                for key in tile.data:
                    if key == title_key:
                        title = tile.data[key] + ".pptx"
                    for s in pptx.slides:
                        for shape in s.shapes:
                            if key in shape.text:
                                shape.text = shape.text.replace("<" + key + ">", tile.data[key])
            pptx.save(bytestream)
            mime = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        bytestream.seek(0)

        if template is None:
            return HttpResponseServerError("Could not find requested template")

        response = HttpResponse(content=bytestream.read())
        response["Content-Type"] = mime
        response["Content-Disposition"] = "attachment; filename={}".format(title)
        return response
