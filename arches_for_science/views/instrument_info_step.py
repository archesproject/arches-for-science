from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.generic import View
from django.views.decorators.csrf import csrf_exempt

from arches.app.models.tile import Tile
from arches.app.models.resource import Resource
from arches.app.utils.response import JSONResponse
from arches.app.utils.betterJSONSerializer import JSONDeserializer


@method_decorator(csrf_exempt, name="dispatch")
class InstrumentInfoStepFormSaveView(View):
    def post(self, request):
        data = JSONDeserializer().deserialize(request.body)
        transaction_id = data.pop("transaction_id", None)
        resourceinstance_id = data.pop("resourceinstance_id", None)

        try:
            with transaction.atomic():
                if resourceinstance_id:
                    resource = Resource.objects.get(pk=resourceinstance_id)
                    resource.load_tiles()

                    Tile.objects.filter(pk__in=[tile.pk for tile in resource.tiles]).delete()

                    resource.tiles = []  # ensures outdated tiles are not saved
                else:
                    resource = Resource()
                    resource.graph_id = "615b11ee-c457-11e9-910c-a4d18cec433a"

                for key, tiledata in data.items():
                    tile = Tile(tiledata)
                    data[key] = tile
                    resource.tiles.append(tile)

                resource.save(user=request.user, transaction_id=transaction_id)
                return JSONResponse(data)
        except:
            return JSONResponse(status=500)
