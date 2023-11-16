"""
ARCHES - a program developed to inventory and manage immovable cultural heritage.
Copyright (C) 2013 J. Paul Getty Trust and World Monuments Fund

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
"""

from django.core.exceptions import ObjectDoesNotExist
from django.utils.translation import get_language, get_language_bidi
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from arches_for_science.models import ManifestXCanvas


def build_string_object(string):
    return { get_language(): { "value": string, "direction": "rtl" if get_language_bidi() else "ltr" }}

def create_digital_resource(transactionid):
    digital_resource_graph = "707cbd78-ca7a-11e9-990b-a4d18cec433a"
    resource = Resource(graph_id = digital_resource_graph)
    resource.save(transaction_id=transactionid)
    return resource.pk

def create_manifest_x_canvas(digital_resource, manifest, canvas=None):
    manifest_x_canvas = ManifestXCanvas.objects.create(
        manifest=manifest,
        canvas=canvas,
        digitalresource=digital_resource
    )
    return manifest_x_canvas

def add_tiles(resource_id, name=None, statement=None, id=None, type=None, service={}, service_identifiers=[], transactionid=None):
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

    if name:
        name_count = Tile.objects.filter(nodegroup_id=name_nodegroupid, resourceinstance_id=resource_id).count()
        if name_count == 1:
            name_tile = Tile.objects.get(nodegroup_id=name_nodegroupid, resourceinstance_id=resource_id)
        elif name_count == 0:
            name_tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=name_nodegroupid, resourceid=resource_id)
        else:
            return
        name_tile.data[name_content_node_id] = build_string_object(name)
        name_tile.save(transaction_id=transactionid, index=False)

    if statement:
        statement_count = Tile.objects.filter(nodegroup_id=statement_nodegroupid, resourceinstance_id=resource_id).count()
        if statement_count == 1:
            statement_tile = Tile.objects.get(nodegroup_id=statement_nodegroupid, resourceinstance_id=resource_id)
        elif statement_count == 0:
            statement_tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=statement_nodegroupid, resourceid=resource_id)
        else:
            return            
        statement_tile.data[statement_content_node_id] = build_string_object(statement)
        statement_tile.save(transaction_id=transactionid, index=False)

    if service:
        for service_type_conformance, service_type in service.items():
            service_tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=service_nodegroupid, resourceid=resource_id)
            service_tile.data[service_type_conformance_node_id] = build_string_object(service_type_conformance)
            service_tile.data[service_type_node_id] = service_type
            service_tile.save(transaction_id=transactionid, index=False)

    if service_identifiers:
        for service_identifier in service_identifiers:
            for service_identifier_content, service_identifier_type in service_identifier.items():
                service_identifier_tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=service_identifier_nodegroupid, resourceid=resource_id, parenttile=service_tile)
                service_identifier_tile.data[service_identifier_type_node_id] = service_identifier_type
                service_identifier_tile.data[service_identifier_content_node_id] = build_string_object(service_identifier_content)
                service_identifier_tile.save(transaction_id=transactionid, index=False)

    if id:
        for identifier_content, identifier_type in id.items():
            identifier_tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=identifier_nodegroupid, resourceid=resource_id)
            identifier_tile.data[identifier_content_node_id] = build_string_object(identifier_content)
            identifier_tile.data[identifier_type_node_id] = identifier_type
            identifier_tile.save(transaction_id=transactionid, index=False)

    if type:
        type_tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=type_nodegroupid, resourceid=resource_id)
        type_tile.data[type_node_id] = type
        type_tile.save(transaction_id=transactionid, index=True)

def create_manifest_digitla_resource(instance):
    """
        Creates the digital resources resource instance representing manifest
        and also creates the manifest_x_canvas record
    """
    manifest_data = instance.manifest

    resource_id = create_digital_resource(instance.transactionid)
    add_tiles(
        resource_id,
        name = manifest_data["label"],
        statement = manifest_data["description"],
        id = {str(instance.globalid): ["768b2f11-26e4-4ada-a699-7a8d3fe9fe5a"]},
        type = ['305c62f0-7e3d-4d52-a210-b451491e6100'], # IIIF Manifest
        service = {manifest_data['@context']: ['e208df66-9e61-498b-8071-3024aa7bed30']}, # web service
        service_identifiers = [
            {manifest_data["@id"]: ["f32d0944-4229-4792-a33c-aadc2b181dc7"]},
        ],
        transactionid=instance.transactionid
    )
    create_manifest_x_canvas(resource_id, manifest_data["@id"])

def digital_resources_for_manifest(instance, created):
    """
        main function to crate/update the digital resource for the manifest
    """
    # the creation of the resource will be only applied to the local manifests that can be created and updated
    manifest_data = instance.manifest
    if created:
        create_manifest_digitla_resource(instance)
    else:
        try:
            manifest_resource_id = ManifestXCanvas.objects.get(manifest=manifest_data["@id"], canvas__isnull=True).digitalresource
            add_tiles(
                manifest_resource_id,
                name = manifest_data["label"],
                statement = manifest_data["description"],
                transactionid=instance.transactionid
            )
        except ObjectDoesNotExist:
            create_manifest_digitla_resource(instance)

def digital_resources_for_canvases(instance):
    """
        main function to crate/update the digital resource for the canvases
    """
    manifest_data = instance.manifest

    # add canvas record in manifest_x_canvas if not already available
    for canvas in manifest_data["sequences"][0]["canvases"]:
        if not ManifestXCanvas.objects.filter(canvas=canvas["images"][0]["resource"]["service"]["@id"]).exists():
            canvas_resource_id = create_digital_resource(transactionid=instance.transactionid)
            add_tiles(
                canvas_resource_id,
                name = canvas["label"],
                id = {canvas["images"][0]["resource"]["service"]["@id"]: ["768b2f11-26e4-4ada-a699-7a8d3fe9fe5a"]},
                type = ['305c62f0-7e3d-4d52-a210-b451491e6100'], #IIIF Manifest #TODO canvas type can be added
                service = {manifest_data['@context']: ['e208df66-9e61-498b-8071-3024aa7bed30']}, # web service
                service_identifiers = [
                    {canvas["images"][0]["resource"]["@id"]: ["f32d0944-4229-4792-a33c-aadc2b181dc7"]},
                    {canvas["images"][0]["resource"]["service"]["@id"]: ["768b2f11-26e4-4ada-a699-7a8d3fe9fe5a"]},
                    {canvas["images"][0]["@id"]: ["768b2f11-26e4-4ada-a699-7a8d3fe9fe5a"]},
                ],
                transactionid=instance.transactionid
            )
        else:
            canvas_resource_id = ManifestXCanvas.objects.filter(canvas=canvas["images"][0]["resource"]["service"]["@id"])[0].digitalresource

        if not ManifestXCanvas.objects.filter(manifest=manifest_data["@id"], canvas=canvas["images"][0]["resource"]["service"]["@id"]).exists():
            create_manifest_x_canvas(canvas_resource_id, manifest_data["@id"], canvas["images"][0]["resource"]["service"]["@id"])

    # update the canvas in manifest_x_canvas that was removed from the current manifest
    current_canvases = [canvas["images"][0]["resource"]["service"]["@id"] for canvas in manifest_data["sequences"][0]["canvases"]]
    for manifest_x_canvas in ManifestXCanvas.objects.filter(manifest=manifest_data["@id"], canvas__isnull=False):
        if manifest_x_canvas.canvas not in current_canvases:
            manifest_x_canvas.manifest = None
            manifest_x_canvas.save()
