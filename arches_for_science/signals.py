from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from arches.app.models.models import IIIFManifest, ResourceXResource, TileModel
from arches.app.models.resource import Resource
from .models import ManifestXCanvas, ManifestXDigitalResource
import uuid


@receiver(post_save, sender=IIIFManifest)
def create_digital_resources(sender, instance, created, **kwargs):
    from arches_for_science.utils.digital_resource_for_manifest import digital_resources_for_manifest, digital_resources_for_canvases

    digital_resources_for_manifest(instance, created)
    internal = instance.url.startswith("/manifest/")
    if internal:
        digital_resources_for_canvases(instance)


@receiver(post_delete, sender=IIIFManifest)
def delete_manifest_x_canvas(sender, instance, **kwargs):
    manifest_id = instance.manifest["id"] if "id" in instance.manifest else instance.manifest["@id"]
    ManifestXCanvas.objects.filter(manifest=manifest_id).delete()
    ManifestXDigitalResource.objects.filter(manifest=manifest_id).delete()


@receiver(post_delete, sender=ResourceXResource)
def ensure_part_tile_is_deleted(sender, instance, **kwargs):
    physical_thing_parts_node_id = uuid.UUID("b240c366-8594-11ea-97eb-acde48001122")
    if instance.nodeid_id == physical_thing_parts_node_id:
        try:
            instance.tileid.delete()
            resourceid = instance.tileid.resourceinstance_id
            resource = Resource.objects.get(pk=resourceid)
            resource.index()
        except TileModel.DoesNotExist:
            pass
