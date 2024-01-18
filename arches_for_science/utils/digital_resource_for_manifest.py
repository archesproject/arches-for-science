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

from django.utils.translation import get_language, get_language_bidi
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from arches_for_science.models import ManifestXDigitalResource, CanvasXDigitalResource, ManifestXCanvas


def build_string_object(string):
    return {get_language(): {"value": string, "direction": "rtl" if get_language_bidi() else "ltr"}}


def create_manifest_x_digitalresource(manifest, digital_resource):
    manifest_x_digitalresource = ManifestXDigitalResource.objects.create(manifest=manifest, digitalresource=digital_resource)
    return manifest_x_digitalresource


def create_canvas_x_digitalresource(canvas, digital_resource):
    canvas_x_digitalresource = CanvasXDigitalResource.objects.create(canvas=canvas, digitalresource=digital_resource)
    return canvas_x_digitalresource


def create_manifest_x_canvas(manifest, canvas):
    manifest_x_canvas = ManifestXCanvas.objects.create(manifest=manifest, canvas=canvas)
    return manifest_x_canvas


def add_tiles(
    resource_id,
    name=None,
    statement=None,
    id=None,
    type=None,
    service={},
    service_identifiers=[],
    transactionid=None,
    manifest_data=None,
    iiif_type=None,
):
    name_content_node_id = "d2fdc2fa-ca7a-11e9-8ffb-a4d18cec433a"
    identifier_content_node_id = "db05c421-ca7a-11e9-bd7a-a4d18cec433a"
    identifier_type_node_id = "db05c05e-ca7a-11e9-8824-a4d18cec433a"
    type_node_id = "09c1778a-ca7b-11e9-860b-a4d18cec433a"
    statement_content_node_id = "da1fbca1-ca7a-11e9-8256-a4d18cec433a"
    service_type_node_id = "5ceedd21-ca7c-11e9-a60f-a4d18cec433a"
    service_type_conformance_node_id = "cec360bd-ca7f-11e9-9ab7-a4d18cec433a"
    service_identifier_type_node_id = "56f8e759-ca7c-11e9-bda1-a4d18cec433a"
    service_identifier_content_node_id = "56f8e9bd-ca7c-11e9-b578-a4d18cec433a"
    part_of_manifest_node_id = "1b3d7f38-ca7b-11e9-ab2c-a4d18cec433a"

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
        name_tile.save(transaction_id=transactionid, index=True)

    if statement:
        statement_count = Tile.objects.filter(nodegroup_id=statement_nodegroupid, resourceinstance_id=resource_id).count()
        if statement_count == 1:
            statement_tile = Tile.objects.get(nodegroup_id=statement_nodegroupid, resourceinstance_id=resource_id)
        elif statement_count == 0:
            statement_tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=statement_nodegroupid, resourceid=resource_id)
        else:
            return
        statement_tile.data[statement_content_node_id] = build_string_object(statement)
        statement_tile.save(transaction_id=transactionid, index=True)

    if service:
        for service_type_conformance, service_type in service.items():
            service_tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=service_nodegroupid, resourceid=resource_id)
            service_tile.data[service_type_conformance_node_id] = build_string_object(service_type_conformance)
            service_tile.data[service_type_node_id] = service_type
            service_tile.save(transaction_id=transactionid, index=False)

    if service_identifiers:
        for service_identifier in service_identifiers:
            for service_identifier_content, service_identifier_type in service_identifier.items():
                service_identifier_tile = Tile.get_blank_tile_from_nodegroup_id(
                    nodegroup_id=service_identifier_nodegroupid, resourceid=resource_id, parenttile=service_tile
                )
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

    if iiif_type == "canvas":
        manifest_digital_resource = ManifestXDigitalResource.objects.get(manifest=manifest_data["@id"])
        part_of_tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=part_of_manifest_node_id, resourceid=resource_id)
        part_of_tile.data[part_of_manifest_node_id] = [
            {
                "resourceId": manifest_digital_resource.digitalresource,
                "ontologyProperty": "c04138e2-7ea8-4ca0-9e81-d4355362b686",
                "resourceXresourceId": "",
                "inverseOntologyProperty": "c07f05bc-0397-49c8-880a-46ed69ce2a4a",
            }
        ]
        part_of_tile.save(transaction_id=transactionid, index=True)


def create_digital_resource(instance, iiif_type, canvas=None):
    """Creates the digital resources resource instance representing manifest
    and also creates the manifest_x_canvas record
    """
    iiif_manifest_valueid = ["305c62f0-7e3d-4d52-a210-b451491e6100"]
    internal_id_valueid = ["768b2f11-26e4-4ada-a699-7a8d3fe9fe5a"]
    web_service_valueid = ["e208df66-9e61-498b-8071-3024aa7bed30"]
    digital_resource_graph = "707cbd78-ca7a-11e9-990b-a4d18cec433a"

    manifest_data = instance.manifest
    service = {manifest_data["@context"]: web_service_valueid}  # TODO canvas does not have its own service
    type = iiif_manifest_valueid  # TODO canvas type need to be added
    transactionid = instance.transactionid

    resource = Resource(graph_id=digital_resource_graph)
    resource.save(transaction_id=instance.transactionid)
    resource_id = resource.pk

    if iiif_type == "manifest":
        name = manifest_data["label"]
        statement = manifest_data["description"]
        id = {str(instance.globalid): internal_id_valueid}
        service_identifiers = [
            {manifest_data["@id"]: ["f32d0944-4229-4792-a33c-aadc2b181dc7"]},
        ]
    elif iiif_type == "canvas":
        name = canvas["label"]
        statement = None
        id = {canvas["images"][0]["resource"]["service"]["@id"]: internal_id_valueid}
        service_identifiers = [
            {canvas["images"][0]["resource"]["@id"]: ["f32d0944-4229-4792-a33c-aadc2b181dc7"]},
            {canvas["images"][0]["resource"]["service"]["@id"]: ["768b2f11-26e4-4ada-a699-7a8d3fe9fe5a"]},
            {canvas["images"][0]["@id"]: ["768b2f11-26e4-4ada-a699-7a8d3fe9fe5a"]},
        ]
    add_tiles(
        resource_id=resource_id,
        name=name,
        statement=statement,
        id=id,
        type=type,
        service=service,
        service_identifiers=service_identifiers,
        transactionid=transactionid,
        manifest_data=manifest_data,
        iiif_type=iiif_type,
    )
    return resource_id


def update_manifest_digital_resource(instance):
    manifest_data = instance.manifest
    manifest_resource_id = ManifestXDigitalResource.objects.get(manifest=manifest_data["@id"]).digitalresource
    add_tiles(
        manifest_resource_id, name=manifest_data["label"], statement=manifest_data["description"], transactionid=instance.transactionid
    )
    return manifest_resource_id


def digital_resources_for_manifest(instance, created):
    """the main function to create/update the digital resource for the manifest"""
    # the creation of the resource will be only applied to the local manifests that can be created and updated

    if created:
        manifest_resource_id = create_digital_resource(instance, "manifest")
        create_manifest_x_digitalresource(instance.manifest["@id"], manifest_resource_id)

    else:
        if ManifestXDigitalResource.objects.filter(manifest=instance.manifest["@id"]).count() == 1:
            update_manifest_digital_resource(instance)
        else:
            manifest_resource_id = create_digital_resource(instance, "manifest")
            create_manifest_x_digitalresource(instance.manifest["@id"], manifest_resource_id)


def digital_resources_for_canvases(instance):
    """the main function to create/update the digital resource for the canvases"""
    manifest_data = instance.manifest

    # add the canvas record to canvas_x_digitalresource if not already available
    for canvas in manifest_data["sequences"][0]["canvases"]:
        if not CanvasXDigitalResource.objects.filter(canvas=canvas["images"][0]["resource"]["service"]["@id"]).exists():
            canvas_resource_id = create_digital_resource(instance, "canvas", canvas)
            create_canvas_x_digitalresource(canvas["images"][0]["resource"]["service"]["@id"], canvas_resource_id)

        if not ManifestXCanvas.objects.filter(
            manifest=manifest_data["@id"], canvas=canvas["images"][0]["resource"]["service"]["@id"]
        ).exists():
            create_manifest_x_canvas(manifest_data["@id"], canvas["images"][0]["resource"]["service"]["@id"])

    # remove the canvas record in manifest_x_canvas that was removed from the current manifest
    current_canvases = [canvas["images"][0]["resource"]["service"]["@id"] for canvas in manifest_data["sequences"][0]["canvases"]]
    for manifest_x_canvas in ManifestXCanvas.objects.filter(manifest=manifest_data["@id"]):
        if manifest_x_canvas.canvas not in current_canvases:
            manifest_x_canvas.delete()
