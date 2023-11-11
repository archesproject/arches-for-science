from django.views.generic import View
from arches.app.utils.response import JSONResponse
from arches_for_science.models import ManifestXCanvas

class ManifestXCanvasView(View):
    def get(self, request):
        resourceid = request.GET.get("resourceid")
        manifest = request.GET.get("manifest")
        canvas = request.GET.get("canvas")
        if resourceid:
            manifest_x_canvas = ManifestXCanvas.objects.filter(digitalresource=resourceid)
        elif manifest:
            manifest_x_canvas = ManifestXCanvas.objects.filter(manifest=manifest)
        elif canvas:
            manifest_x_canvas = ManifestXCanvas.objects.filter(canvas=canvas)
        results = list(manifest_x_canvas)

        return JSONResponse(results)
