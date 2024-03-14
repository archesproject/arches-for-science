import uuid

from arches.app.models.models import IIIFManifest, TileModel, FunctionXGraph
from django.db import models
from django.db.models import JSONField
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
import pgtrigger

from .trigger_functions import CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_SINGLE, CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_ALL

class TileModelProxy(TileModel):
    class Meta:
        proxy = True
        triggers = [
            pgtrigger.Trigger(
                name='calculate_multicard_primary_descriptor_single',
                when=pgtrigger.After,
                operation=pgtrigger.Insert | pgtrigger.Update | pgtrigger.Delete,
                func=CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_SINGLE,
            ),
        ]

class FunctionXGraphProxy(FunctionXGraph):
    class Meta:
        proxy = True
        triggers = [
            pgtrigger.Trigger(
                name='calculate_multicard_primary_descriptor_all',
                when=pgtrigger.After,
                condition=pgtrigger.Q(
                    new__function_id="00b2d15a-fda0-4578-b79a-784e4138664b",
                    new__config__isnull=False,
                ),
                operation=pgtrigger.Insert | pgtrigger.Update,
                func=CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_ALL,
            ),
        ]


class RendererConfig(models.Model):
    configid = models.UUIDField(primary_key=True, unique=True)
    rendererid = models.UUIDField()
    name = models.TextField(blank=False, null=False)
    description = models.TextField(blank=True, null=True)
    config = JSONField(default=dict)
    

    class Meta:
        managed = True
        db_table = "renderer_config"

    def __init__(self, *args, **kwargs):
        super(RendererConfig, self).__init__(*args, **kwargs)
        if not self.configid:
            self.configid = uuid.uuid4()


class ManifestXDigitalResource(models.Model):
    manifest = models.TextField(unique=True)
    digitalresource = models.TextField(unique=True)

    class Meta:
        managed = True
        db_table = "manifest_x_digitalresource"

class CanvasXDigitalResource(models.Model):
    canvas = models.TextField(unique=True)
    digitalresource = models.TextField(unique=True)

    class Meta:
        managed = True
        db_table = "canvas_x_digitalresource"

class ManifestXCanvas(models.Model):
    manifest = models.TextField()
    canvas = models.TextField()

    class Meta:
        managed = True
        db_table = "manifest_x_canvas"


@receiver(post_save, sender=IIIFManifest)
def create_digital_resources(sender, instance, created, **kwargs):
    from arches_for_science.utils.digital_resource_for_manifest import digital_resources_for_manifest, digital_resources_for_canvases
    digital_resources_for_manifest(instance, created)
    digital_resources_for_canvases(instance)

@receiver(post_delete, sender=IIIFManifest)
def delete_manifest_x_canvas(sender, instance, **kwargs):
    ManifestXCanvas.objects.filter(manifest=instance.manifest["@id"]).delete()
    ManifestXDigitalResource.objects.filter(manifest=instance.manifest["@id"]).delete()
