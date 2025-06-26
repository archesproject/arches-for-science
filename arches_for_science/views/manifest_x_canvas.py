from http import HTTPStatus
import uuid

from django.core.exceptions import ObjectDoesNotExist
from django.views.generic import View

from arches.app.utils.response import JSONErrorResponse, JSONResponse
from arches.app.models.models import IIIFManifest
from arches_for_science.models import ManifestXDigitalResource, CanvasXDigitalResource
from arches_for_science.utils.digital_resource_for_manifest import create_manifest_record, create_digital_resource_from_manifest


class ManifestXCanvasView(View):
    def get(self, request):
        resourceid = request.GET.get("resourceid", None)
        manifest = request.GET.get("manifest", None)
        canvas = request.GET.get("canvas", None)
        if resourceid:
            try:
                link = ManifestXDigitalResource.objects.get(digitalresource=resourceid)
                manifest = link.manifest
            except ObjectDoesNotExist:
                link = CanvasXDigitalResource.objects.get(digitalresource=resourceid)
                canvas = link.canvas
            digital_resource = link.digitalresource
        elif manifest:
            if not IIIFManifest.objects.filter(url=manifest).exists():
                create_manifest_record(manifest)
            digital_resource = ManifestXDigitalResource.objects.get(manifest=manifest).digitalresource

        elif canvas:
            digital_resource = CanvasXDigitalResource.objects.get(canvas=canvas).digitalresource
        else:
            return JSONErrorResponse(status=HTTPStatus.BAD_REQUEST)

        result = {"manifest": manifest, "canvas": canvas, "digital_resource": digital_resource}

        return JSONResponse(result)
