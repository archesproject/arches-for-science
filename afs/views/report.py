from io import BytesIO
from types import SimpleNamespace
import logging
import json
import re
import uuid
from django.conf import settings
from django.http import HttpResponse, HttpResponseServerError
from django.utils.translation import ugettext as _
from django.views.generic import View
from django.utils.translation import get_language
from afs.utils.docx_template_engine import DocxTemplateEngine
from afs.utils.pptx_template_engine import PptxTemplateEngine
from afs.utils.xlsx_template_engine import XlsxTemplateEngine
from arches.app.utils.response import JSONResponse
from arches.app.models.models import PublishedGraph, Node
from arches.app.models.resource import Resource
from arches.app.datatypes.datatypes import DataTypeFactory

logger = logging.getLogger(__name__)


class ReportView(View):
    def get(self, request):
        return JSONResponse(settings.AFS_CUSTOM_REPORTS)

    def post(self, request):
        json_data = json.loads(request.body)
        title_key = "b5b38bde-b2f2-11e9-aff6-a4d18cec433a"
        template_id = json_data["templateId"] if "templateId" in json_data else None
        project_id = json_data["projectId"] if "projectId" in json_data else None
        template = settings.AFS_CUSTOM_REPORTS[template_id] if template_id in settings.AFS_CUSTOM_REPORTS else None
        project = Resource.objects.filter(pk=project_id)[0]
        published_graph = PublishedGraph.objects.filter(publication_id=str(project.graph_publication_id), language=get_language()).first()

        datatype_factory = DataTypeFactory()
        serialized_graph = published_graph.serialized_graph

        node_dict = {}

        for index, i in enumerate(serialized_graph["nodes"]):
            if serialized_graph["nodes"][index]["alias"]:
                serialized_graph["nodes"][index]["pk"] = uuid.UUID(serialized_graph["nodes"][index]["nodeid"])
                node_dict[serialized_graph["nodes"][index]["alias"].lower()] = SimpleNamespace(**serialized_graph["nodes"][index])

        project.load_tiles()
        tiles = project.tiles

        bytestream = BytesIO()

        if template.endswith("docx"):
            template_engine = DocxTemplateEngine()
            (bytestream, mime, title) = template_engine.document_replace(template, json_data)

        elif template.endswith("pptx"):
            template_engine = PptxTemplateEngine()
            (bytestream, mime, title) = template_engine.document_replace(template, json_data)
        elif template.endswith("xlsx"):
            template_engine = XlsxTemplateEngine()
            (bytestream, mime, title) = template_engine.document_replace(template, json_data)

        bytestream.seek(0)

        if template is None:
            return HttpResponseServerError("Could not find requested template")

        response = HttpResponse(content=bytestream.read())
        response["Content-Type"] = mime
        response["Content-Disposition"] = "attachment; filename={}".format(title)
        return response


# class ArchesTemplateEngine():

#     def __init__(self, language=None):
#         if not language:
#             self.language = get_language()
#         else:
#             self.language = language

#         published_graphs = PublishedGraph.objects.filter(language=get_language())

#         self.serialized_graphs = {}
#         self.patterns = [
#             {
#                 "pattern": re.compile(r'(\<arches\:\s?([A-Za-z_0-9]+)\>)'),
#                 "replacement_method": "single"
#             }
#         ]

#         for graph in published_graphs:
#             serialized_graph = graph.serialized_graph

#             for index, i in enumerate(serialized_graph['nodes']):
#                 if serialized_graph['nodes'][index]["alias"]:
#                     serialized_graph['nodes'][index]["pk"] = uuid.UUID(serialized_graph['nodes'][index]["nodeid"])
#                     serialized_graph['node_namespace'] = SimpleNamespace(**serialized_graph['nodes'][index])

#             self.serialized_graphs[graph.graphid] = serialized_graph

#     def document_replace(self, document, resources):
#         pass

#     class DocxTemplateEngine(ArchesTemplateEngine):
#         def document_replace(self, ):
#             pass
