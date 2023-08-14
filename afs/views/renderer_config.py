import logging
import uuid
from django.utils.translation import ugettext as _
from django.views.generic import View
from afs.models import RendererConfig
from arches.app.utils.response import JSONResponse
from django.http import HttpResponse, HttpResponseNotFound
from mimetypes import MimeTypes
from arches.app.utils.betterJSONSerializer import JSONSerializer, JSONDeserializer

logger = logging.getLogger(__name__)

class RendererView(View):
    def get(self, request, renderer_id=None):
        renderer = {}
        if renderer_id is None:
            return JSONResponse([]) # this should be fixed later to return all renderers; not currently used.
        else:
            renderer_config = RendererConfig.objects.filter(rendererid=renderer_id)

            if renderer_config:
                renderer["configs"] = renderer_config.values()
                return JSONResponse(renderer)
            else:
                return HttpResponseNotFound('<h1>Renderers do not exist</h1>')
            
class RendererConfigView(View):
    def get(self, request, renderer_config_id=None):
        if renderer_config_id is None:
            return JSONResponse(RendererConfig.objects.all().values())

        else:
            renderer_config = RendererConfig.objects.filter(configid=renderer_config_id)

            if renderer_config:
                return JSONResponse(renderer_config.values())
            else:
                return HttpResponseNotFound('<h1>Renderers config does not exist</h1>')
    
    def post(self, request):
        body = JSONDeserializer().deserialize(request.body)

        renderer_config = RendererConfig.objects.create(rendererid=body["rendererId"], name=body["name"], config=body)

        response_dict = JSONSerializer().serialize(renderer_config)

        return JSONResponse(response_dict)





