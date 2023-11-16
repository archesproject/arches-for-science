import uuid
from django.db import models
from django.db.models import JSONField
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from arches.app.models.models import IIIFManifest
from arches_for_science.utils.digital_resource_for_manifest import digital_resources_manifest, digital_resources_canvas


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


class ManifestXCanvas(models.Model):
    manifest = models.TextField(blank=True, null=True)
    canvas = models.TextField(blank=True, null=True)
    digitalresource = models.UUIDField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = "manifest_x_canvas"


@receiver(post_save, sender=IIIFManifest)
def create_digital_resources(sender, instance, created, **kwargs):
    digital_resources_manifest(instance, created)
    digital_resources_canvas(instance)

@receiver(post_delete, sender=IIIFManifest)
def delete_manifest_x_canvas(sender, instance, **kwargs):
    try:
        ManifestXCanvas.objects.filter(manifest=instance.manifest["@id"], canvas__isnull=False).update(manifest=None)
        ManifestXCanvas.objects.filter(manifest=instance.manifest["@id"], canvas__isnull=True).delete()
    except:
        pass