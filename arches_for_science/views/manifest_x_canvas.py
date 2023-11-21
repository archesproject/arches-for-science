from django.core.exceptions import ObjectDoesNotExist
from django.views.generic import View
from arches.app.utils.response import JSONResponse
from arches_for_science.models import ManifestXDigitalResource, CanvasXDigitalResource, ManifestXCanvas

class ManifestXCanvasView(View):
    def get(self, request):
        resourceid = request.GET.get("resourceid", None)
        manifest = request.GET.get("manifest", None)
        canvas = request.GET.get("canvas", None)
        if resourceid:
            try:
                manifest = ManifestXDigitalResource.objects.get(digitalresource=resourceid).manifest
            except ObjectDoesNotExist:
                canvas = CanvasXDigitalResource.objects.get(digitalresource=resourceid).canvas
        elif manifest:
            digital_resource = ManifestXDigitalResource.objects.get(manifest=manifest).digitalresource
        elif canvas:
            digital_resource = CanvasXDigitalResource.objects.get(canvas=canvas).digitalresource

        result = {"manifest": manifest, "canvas": canvas, "digital_resource": digital_resource}

        return JSONResponse(result)
