import uuid
from django.core.exceptions import ObjectDoesNotExist
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


@receiver(post_save, sender=IIIFManifest)
def create_digital_resources(sender, instance, created, **kwargs):
    name_content_node_id = "d2fdc2fa-ca7a-11e9-8ffb-a4d18cec433a"
    identifier_content_node_id = "db05c421-ca7a-11e9-bd7a-a4d18cec433a"
    identifier_type_node_id = "db05c05e-ca7a-11e9-8824-a4d18cec433a"
    type_node_id = "09c1778a-ca7b-11e9-860b-a4d18cec433a"
    statement_content_node_id = "da1fbca1-ca7a-11e9-8256-a4d18cec433a"
    service_type_node_id= "5ceedd21-ca7c-11e9-a60f-a4d18cec433a"
    service_type_conformance_node_id = "cec360bd-ca7f-11e9-9ab7-a4d18cec433a"
    service_identifier_type_node_id = "56f8e759-ca7c-11e9-bda1-a4d18cec433a"
    service_identifier_content_node_id = "56f8e9bd-ca7c-11e9-b578-a4d18cec433a"

    name_nodegroupid = "d2fdae3d-ca7a-11e9-ad84-a4d18cec433a"
    identifier_nodegroupid = "db05b5ca-ca7a-11e9-82ca-a4d18cec433a"
    type_nodegroupid = "09c1778a-ca7b-11e9-860b-a4d18cec433a"
    statement_nodegroupid = "da1fac57-ca7a-11e9-86a3-a4d18cec433a"
    service_nodegroupid = "29c8c76e-ca7c-11e9-9e11-a4d18cec433a"
    service_identifier_nodegroupid = "56f8e26e-ca7c-11e9-9aa3-a4d18cec433a"

    def build_string_object(string):
        return { get_language(): { "value": string, "direction": "rtl" if get_language_bidi() else "ltr" }}
    
    def create_digital_resource():
        digital_resource_graph = "707cbd78-ca7a-11e9-990b-a4d18cec433a"
        resource = Resource(graph_id = digital_resource_graph)
        resource.save()
        return resource.pk

    def create_manifest_x_canvas(digital_resource, manifest, canvas=None):
        manifest_x_canvas = ManifestXCanvas.objects.create(
            manifest=manifest,
            canvas=canvas,
            digitalresource=digital_resource
        )
        return manifest_x_canvas

    def add_tiles(resource_id, name=None, statement=None, id=None, type=None, service={}, service_identifiers=[]):
        if name:
            try:
                name_tile = Tile.objects.filter(nodegroup_id=name_nodegroupid, resourceinstance_id=resource_id)[0]
            except:
                name_tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=name_nodegroupid, resourceid=resource_id)
            name_tile.data[name_content_node_id] = build_string_object(name)
            name_tile.save(index=False)

        if statement:
            try:
                statement_tile = Tile.objects.filter(nodegroup_id=statement_nodegroupid, resourceinstance_id=resource_id)[0]
            except:
                statement_tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=statement_nodegroupid, resourceid=resource_id)
            statement_tile.data[statement_content_node_id] = build_string_object(statement)
            statement_tile.save(index=False)

        if service:
            for service_type_conformance, service_type in service.items():
                service_tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=service_nodegroupid, resourceid=resource_id)
                service_tile.data[service_type_conformance_node_id] = build_string_object(service_type_conformance)
                service_tile.data[service_type_node_id] = service_type
                service_tile.save(index=False)

        if service_identifiers:
            for service_identifier in service_identifiers:
                for service_identifier_content, service_identifier_type in service_identifier.items():
                    service_identifier_tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=service_identifier_nodegroupid, resourceid=resource_id, parenttile=service_tile)
                    service_identifier_tile.data[service_identifier_type_node_id] = service_identifier_type
                    service_identifier_tile.data[service_identifier_content_node_id] = build_string_object(service_identifier_content)
                    service_identifier_tile.save(index=False)

        if id:
            for identifier_content, identifier_type in id.items():
                identifier_tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=identifier_nodegroupid, resourceid=resource_id)
                identifier_tile.data[identifier_content_node_id] = build_string_object(identifier_content)
                identifier_tile.data[identifier_type_node_id] = identifier_type
                identifier_tile.save(index=False)

        if type:
            type_tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=type_nodegroupid, resourceid=resource_id)
            type_tile.data[type_node_id] = type
            type_tile.save(index=True)

    def create_manifest_digitla_resource(manifest_data):
        resource_id = create_digital_resource()
        add_tiles(
            resource_id,
            name = manifest_data["label"],
            statement = manifest_data["description"],
            id = {str(instance.globalid): ["768b2f11-26e4-4ada-a699-7a8d3fe9fe5a"]},
            type = ['305c62f0-7e3d-4d52-a210-b451491e6100'], # IIIF Manifest
            service = {manifest_data['@context']: ['e208df66-9e61-498b-8071-3024aa7bed30']}, # web service
            service_identifiers = [
                {manifest_data["@id"]: ["f32d0944-4229-4792-a33c-aadc2b181dc7"]},
            ]
        )
        create_manifest_x_canvas(resource_id, manifest_data["@id"])

    manifest_data = instance.manifest
    if created:
        create_manifest_digitla_resource(manifest_data)
    else:
        try:
            resource_id = ManifestXCanvas.objects.get(manifest=manifest_data["@id"], canvas__isnull=True).digitalresource
            add_tiles(
                resource_id,
                name = manifest_data["label"],
                statement = manifest_data["description"],
            )
        except ObjectDoesNotExist:
            create_manifest_digitla_resource(manifest_data)

    for canvas in manifest_data["sequences"][0]["canvases"]:
        if not ManifestXCanvas.objects.filter(canvas=canvas["images"][0]["resource"]["service"]["@id"]).exists():
            resource_id = create_digital_resource()
            add_tiles(
                resource_id,
                name = canvas["label"],
                id = {canvas["images"][0]["resource"]["service"]["@id"]: ["768b2f11-26e4-4ada-a699-7a8d3fe9fe5a"]},
                type = ['305c62f0-7e3d-4d52-a210-b451491e6100'], #IIIF Manifest #TODO canvas type can be added
                service = {manifest_data['@context']: ['e208df66-9e61-498b-8071-3024aa7bed30']}, # web service
                service_identifiers = [
                    {canvas["images"][0]["resource"]["@id"]: ["f32d0944-4229-4792-a33c-aadc2b181dc7"]},
                    {canvas["images"][0]["resource"]["service"]["@id"]: ["768b2f11-26e4-4ada-a699-7a8d3fe9fe5a"]},
                    {canvas["images"][0]["@id"]: ["768b2f11-26e4-4ada-a699-7a8d3fe9fe5a"]},
                ]
            )
        if not ManifestXCanvas.objects.filter(manifest=manifest_data["@id"],canvas=canvas["images"][0]["resource"]["service"]["@id"]).exists():
            create_manifest_x_canvas(resource_id, manifest_data["@id"], canvas["images"][0]["resource"]["service"]["@id"])
