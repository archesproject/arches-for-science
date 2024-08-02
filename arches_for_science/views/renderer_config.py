import logging
from django.views.generic import View
from arches_for_science.models import RendererConfig
from arches.app.models import models
from arches.app.utils.response import JSONResponse
from django.http import HttpResponseNotFound
from django.db.models import Q
from django.utils.translation import gettext as _
from arches.app.utils.betterJSONSerializer import JSONSerializer, JSONDeserializer

logger = logging.getLogger(__name__)


class RendererView(View):
    def get(self, request, renderer_id=None):
        renderer = {}
        if renderer_id is None:
            return JSONResponse([])  # this should be fixed later to return all renderers; not currently used.
        else:
            renderer_config = RendererConfig.objects.filter(rendererid=renderer_id)

            if renderer_config:
                renderer["configs"] = renderer_config.values()
                return JSONResponse(renderer)
            else:
                return HttpResponseNotFound(_("<h1>Renderers do not exist</h1>"))


class RendererConfigView(View):
    def get(self, request, renderer_config_id=None):
        if renderer_config_id is None:
            return JSONResponse(RendererConfig.objects.all().values())

        else:
            renderer_config = RendererConfig.objects.filter(configid=renderer_config_id)

            if renderer_config:
                return JSONResponse(renderer_config.values())
            else:
                return HttpResponseNotFound(_("<h1>Renderers config does not exist</h1>"))

    def post(self, request, renderer_config_id=None):
        body = JSONDeserializer().deserialize(request.body)
        if renderer_config_id:
            renderer_config = RendererConfig.objects.get(configid=renderer_config_id)
            renderer_config.rendererid = body["rendererId"]
            renderer_config.name = body["name"]
            renderer_config.description = body["description"]
            body.pop("rendererId")
            body.pop("name")
            body.pop("description")
            renderer_config.config = body
            renderer_config.save()
        else:
            renderer_config = RendererConfig.objects.create(rendererid=body["rendererId"], name=body["name"], config=body)

        response_dict = JSONSerializer().serialize(renderer_config)

        return JSONResponse(response_dict)

    def delete(self, request, renderer_config_id):
        file_nodegroup_id = "7c486328-d380-11e9-b88e-a4d18cec433a"
        renderer_config = RendererConfig.objects.get(configid=renderer_config_id)
        query = Q(
            **{
                "nodegroup_id": file_nodegroup_id,
                "data__has_key": file_nodegroup_id,
                f"data__{file_nodegroup_id}__0__rendererConfig": renderer_config_id,
            }
        )

        renderer_used = models.TileModel.objects.filter(query).exists()
        if not renderer_used:
            renderer_config.delete()
            response_dict = {"deleted": JSONSerializer().serialize(renderer_config)}
        else:
            response_dict = {"deleted": False}

        return JSONResponse(response_dict)
