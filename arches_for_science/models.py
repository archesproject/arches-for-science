import uuid
from arches.app.models.models import TileModel, FunctionXGraph
from django.db import models
from django.db.models import JSONField
import pgtrigger

from .trigger_functions import CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_SINGLE, CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_ALL


class TileModelProxy(TileModel):
    class Meta:
        proxy = True
        triggers = [
            pgtrigger.Trigger(
                name="calculate_multicard_primary_descriptor_single",
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
                name="calculate_multicard_primary_descriptor_all",
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
