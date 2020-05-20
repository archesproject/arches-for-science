from django.views.generic import View
from arches.app.utils.response import JSONResponse
from arches.app.models import models
from arches.app.models.resource import Resource


class PhysicalThingSetView(View):
    def get(self, request):
        # via an id for a set, returns list of phys things and stuff necessary
        set_resourceid = (
            None if request.GET.get("resourceid") == "" or request.GET.get("resourceid") == None else (request.GET.get("resourceid"))
        )
        # set_resourceid = 'cc221153-08a1-49ba-bc07-35fc3b8d783e'
        print(set_resourceid)
        related_things = models.ResourceXResource.objects.filter(resourceinstanceidfrom=set_resourceid)
        related_ids = [r.resourceinstanceidto.resourceinstanceid for r in related_things]
        resources = Resource.objects.filter(resourceinstanceid__in=related_ids)
        data = []

        # for each of the related things, need to get the tile data
        for resource in resources:
            resource.load_tiles()
            iiif = []
            metadata = {}
            # need to handle case of multiple annotation tiles in resource
            for tile in resource.tiles:
                for nodeid in list(tile.data.keys()):
                    node = models.Node.objects.get(nodeid=nodeid)
                    if node.datatype == "annotation" and tile.data[str(node.nodeid)]["features"]:
                        # if tile.data[str(node.nodeid)]['features']:
                        # iiif = tile.data
                        iiif_tile_dict = {
                            "thumbnail": tile.data[str(node.nodeid)]["features"][0]["properties"]["canvas"] + "/full/!75,75/0/default.jpg",
                            "tileid": tile.tileid,
                        }
                        iiif.append(iiif_tile_dict)
            new_dict = {
                "name": resource.displayname,
                "desc": resource.displaydescription,
                "resourceid": resource.resourceinstanceid,
                "iiif": iiif,
            }
            data.append(new_dict)

        return JSONResponse({"items": data})
