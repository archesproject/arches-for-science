from django.views.generic import View
from arches.app.utils.response import JSONResponse
from arches.app.models import models
from arches.app.views.search import search_results
from django.http import HttpRequest
import json

class ManifestView(View):

    def get(self, request, id):
        manifest = models.IIIFManifest.objects.get(id=id).manifest
        return JSONResponse(manifest)
