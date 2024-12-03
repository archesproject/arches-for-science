from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from arches.app.models.models import IIIFManifest, ResourceXResource
from arches.app.models.resource import Resource
from .models import ManifestXCanvas, ManifestXDigitalResource
import uuid


@receiver(post_save, sender=IIIFManifest)
def create_digital_resources(sender, instance, created, **kwargs):
    from arches_for_science.utils.digital_resource_for_manifest import digital_resources_for_manifest, digital_resources_for_canvases

    digital_resources_for_manifest(instance, created)
    digital_resources_for_canvases(instance)


@receiver(post_delete, sender=IIIFManifest)
def delete_manifest_x_canvas(sender, instance, **kwargs):
    ManifestXCanvas.objects.filter(manifest=instance.manifest["@id"]).delete()
    ManifestXDigitalResource.objects.filter(manifest=instance.manifest["@id"]).delete()

