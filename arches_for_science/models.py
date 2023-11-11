import uuid
from django.db import models
from django.db.models import JSONField
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.translation import get_language, get_language_bidi
from arches.app.models.models import IIIFManifest
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile


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
    manifest = models.TextField()
    canvas = models.TextField(blank=True, null=True)
    digitalresource = models.UUIDField()

    class Meta:
        managed = True
        db_table = "manifest_x_canvas"
