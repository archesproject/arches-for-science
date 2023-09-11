from django.core.management import call_command

from django.contrib.auth.models import User
from django.test import TestCase
from django.test.client import Client
from django.urls import reverse
from django.utils.translation import get_language

from arches.app.utils.betterJSONSerializer import JSONSerializer
from arches.app.models.models import GraphModel, Node, NodeGroup, ResourceInstance, ResourceXResource, TileModel
from arches.app.models.system_settings import settings
from arches.app.models.tile import Tile

PHYSICAL_THING_GRAPH_ID = "9519cb4f-b25b-11e9-8c7b-a4d18cec433a"
PART_IDENTIFIER_ASSIGNMENT = "b240c366-8594-11ea-97eb-acde48001122"
SAMPLING_ACTIVITY_GRAPH_ID = "03357848-1d9d-11eb-a29f-024e0d439fdb"
COLLECTION_RESOURCE = "54bf1022-a0b8-4f95-a5e9-82c084b2f533"  # arbitrary test value


def setUpModule():
    if not GraphModel.objects.filter(pk=PHYSICAL_THING_GRAPH_ID).exists():
        # TODO: this command isn't using a tempdir, so it's leaving behind files
        call_command("packages", "-o load_package -s arches_for_science/pkg -y".split())
    if not User.objects.filter(username="tester1").exists():
        call_command("add_test_users")


class AnalysisAreaAndSampleTakingTests(TestCase):
    def login(self, username="dev", password="dev"):
        client = Client()
        client.login(username=username, password=password)
        return client

    def get_resource_instance(self, graph_id):
        r = ResourceInstance(graph_id=graph_id)
        r.save()  # not part of the transaction, part of the setup
        self.addCleanup(r.delete)
        return r

    def make_tile(self, parent_phys_thing, data, transaction_id):
        arbitrary_nodegroup = NodeGroup.objects.first()
        new_tile = TileModel(resourceinstance=parent_phys_thing, nodegroup=arbitrary_nodegroup)
        new_tile.save()
        # Set the transactionid
        new_tile = Tile.objects.get(tileid=new_tile.pk)
        new_tile.data = data
        new_tile.save(transaction_id=transaction_id)

        self.addCleanup(new_tile.delete)
        return new_tile

    def test_create_delete_analysis_area(self):
        # TODO: fails with dev/dev? 🤔
        client = self.login(username="ben", password="Test12345!")

        transaction_id = "10000000-1000-1000-1000-100000000000"
        parent_phys_thing = self.get_resource_instance(PHYSICAL_THING_GRAPH_ID)
        create_data = {
            "transaction_id": transaction_id,  # NB: snake_case
            "parentPhysicalThingResourceid": str(parent_phys_thing.pk),  # NB: lowercase id
            "collectionResourceid": COLLECTION_RESOURCE,
            "partIdentifierAssignmentTileData": JSONSerializer().serialize(
                {PART_IDENTIFIER_ASSIGNMENT: []}
            ),
            "analysisAreaName": "Test Analysis Area",
        }
        response = client.post(reverse("saveanalysisarea"), create_data)
        self.assertEqual(response.status_code, 200)

        new_resource = ResourceInstance.objects.get(
            pk=response.json()['result']['memberOfTile']['resourceinstance_id']
        )
        new_tile_data = {PART_IDENTIFIER_ASSIGNMENT: [{"resourceId": str(new_resource.pk)}]}
        new_tile = self.make_tile(parent_phys_thing, new_tile_data, transaction_id)
        rxr = ResourceXResource(
            nodeid=Node.objects.get(pk=PART_IDENTIFIER_ASSIGNMENT),
            resourceinstanceidfrom=parent_phys_thing,
            resourceinstanceidto=new_resource,
            tileid=new_tile,
        )
        rxr.save(transaction_id=transaction_id)
        self.addCleanup(rxr.delete)

        delete_data = {
            "transactionId": transaction_id,  # NB: camelCase
            "parentPhysicalThingResourceId": str(parent_phys_thing.pk),  # NB: uppercase id
            "parentPhysicalThingTileData": JSONSerializer().serialize(new_tile_data),
        }
        delete_data = JSONSerializer().serialize(delete_data)
        content_type = "application/json"
        response = client.post(reverse("deleteanalysisarea"), delete_data, content_type=content_type)

        self.assertEqual(response.status_code, 200)

    def test_create_delete_sample(self):
        client = self.login()

        transaction_id = "10000000-1000-1000-1000-100000000001"
        parent_phys_thing = self.get_resource_instance(PHYSICAL_THING_GRAPH_ID)
        sampling_activity = self.get_resource_instance(SAMPLING_ACTIVITY_GRAPH_ID)
        part = self.get_resource_instance(PHYSICAL_THING_GRAPH_ID)

        # Create
        physical_part_of_object_nodeid = "b240c366-8594-11ea-97eb-acde48001122"
        part_identifier_assignment_label_nodeid = "3e541cc6-859b-11ea-97eb-acde48001122"
        part_identifier_assignment_polygon_identifier_nodeid = "97c30c42-8594-11ea-97eb-acde48001122"
        part_identifier_assignment_tile_data = {
            part_identifier_assignment_label_nodeid: {
                get_language(): {"value": "test value", "direction": "ltr"}
            },
            physical_part_of_object_nodeid: [],
            part_identifier_assignment_polygon_identifier_nodeid: {},
        }
    
        create_data = {
            "transaction_id": transaction_id,  # NB: snake_case
            "parentPhysicalThingResourceid": str(parent_phys_thing.pk),
            "parentPhysicalThingName": "Test Name of Physical Thing",
            "collectionResourceid": COLLECTION_RESOURCE,
            "partIdentifierAssignmentTileData": JSONSerializer().serialize(part_identifier_assignment_tile_data),
            "partIdentifierAssignmentResourceId": str(part.pk),
            "sampleMotivation": "Test Motivation",
            "sampleDescription": "Test Description",
            "samplingActivityResourceId": str(sampling_activity.pk),
        }
        response = client.post(reverse("savesamplearea"), create_data)
        self.assertEqual(response.status_code, 200)

        # Delete
        result = response.json()['result']
        physical_part_of_object_nodeid = "b240c366-8594-11ea-97eb-acde48001122"
        physical_part_of_object_resourceid = result['parentPhysicalThing']['physicalPartOfObjectTile']['data'][physical_part_of_object_nodeid][0]['resourceId']
        part_identifier_assignment_tile_data = {
            **part_identifier_assignment_tile_data,
            physical_part_of_object_nodeid: [
                {"resourceId": physical_part_of_object_resourceid},
            ],
        }

        delete_data = {
            "transactionId": transaction_id,  # NB: camelCase
            "parentPhysicalThingResourceid": str(parent_phys_thing.pk),
            "parentPhysicalThingName": "Test Name of Physical Thing",
            "partIdentifierAssignmentTileData": JSONSerializer().serialize(part_identifier_assignment_tile_data),
            "samplingActivityResourceId": str(sampling_activity.pk),
            "collectionResourceid": COLLECTION_RESOURCE,
            "sampleMotivation": "Test Motivation",
            "sampleDescription": "Test Description",
        }
        delete_data = JSONSerializer().serialize(delete_data)
        content_type = "application/json"
        response = client.post(reverse("deletesamplearea"), delete_data, content_type=content_type)

        self.assertEqual(response.status_code, 200)
