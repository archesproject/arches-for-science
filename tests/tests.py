from django.core.management import call_command
from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from django.utils.translation import get_language

from arches.app.utils.betterJSONSerializer import JSONSerializer
from arches.app.models.models import GraphModel, Node, NodeGroup, ResourceInstance, ResourceXResource, TileModel
from arches.app.models.tile import Tile

PHYSICAL_THING_GRAPH_ID = "9519cb4f-b25b-11e9-8c7b-a4d18cec433a"
PART_IDENTIFIER_ASSIGNMENT_NODEGROUP = "fec59582-8593-11ea-97eb-acde48001122"
PART_IDENTIFIER_ASSIGNMENT = "b240c366-8594-11ea-97eb-acde48001122"
PART_IDENTIFIER_ASSIGNMENT_LABEL = "3e541cc6-859b-11ea-97eb-acde48001122"
SAMPLING_ACTIVITY_GRAPH_ID = "03357848-1d9d-11eb-a29f-024e0d439fdb"
COLLECTION_RESOURCE = "54bf1022-a0b8-4f95-a5e9-82c084b2f533"  # arbitrary test value


def setUpModule():
    if not GraphModel.objects.filter(pk=PHYSICAL_THING_GRAPH_ID).exists():
        # TODO: this command isn't using a tempdir, so it's leaving behind files
        call_command("packages", "-o load_package -s arches_for_science/pkg -y".split())
    if not User.objects.filter(username="tester1").exists():
        call_command("add_test_users")


class AnalysisAreaAndSampleTakingTests(TestCase):
    def get_resource_instance(self, graph_id):
        r = ResourceInstance(graph_id=graph_id)
        r.save()  # not part of the transaction, part of the setup
        self.addCleanup(r.delete)
        return r

    def make_tile(self, parent_phys_thing, data, transaction_id, nodegroup_id):
        new_tile = Tile.get_blank_tile_from_nodegroup_id(nodegroup_id=nodegroup_id)
        new_tile.resourceinstance = parent_phys_thing
        new_tile.save()
        # Set the transactionid
        new_tile = Tile.objects.get(tileid=new_tile.pk)
        for key, value in data.items():
            new_tile.data[key] = value
        new_tile.save(transaction_id=transaction_id)

        return new_tile

    def test_create_delete_analysis_area(self):
        # TODO: fails with dev/dev? 🤔
        self.client.login(username="ben", password="Test12345!")

        transaction_id = "10000000-1000-1000-1000-100000000000"
        parent_phys_thing = self.get_resource_instance(PHYSICAL_THING_GRAPH_ID)
        create_data = {
            "transaction_id": transaction_id,  # NB: snake_case
            "parentPhysicalThingResourceid": str(parent_phys_thing.pk),  # NB: lowercase id
            "parentPhysicalThingName": "Test Name of Physical Thing",
            "collectionResourceid": COLLECTION_RESOURCE,
            "partIdentifierAssignmentTileData": JSONSerializer().serialize(
                {
                    PART_IDENTIFIER_ASSIGNMENT: [],
                    PART_IDENTIFIER_ASSIGNMENT_LABEL: {
                        get_language(): {"value": "test value", "direction": "ltr"},
                    },
                }
            ),
            "analysisAreaName": "Test Analysis Area",
        }
        response = self.client.post(reverse("saveanalysisarea"), create_data)
        self.assertEqual(response.status_code, 200)

        new_resource = ResourceInstance.objects.get(pk=response.json()["result"]["memberOfTile"]["resourceinstance_id"])
        new_tile_data = {PART_IDENTIFIER_ASSIGNMENT: [{"resourceId": str(new_resource.pk)}]}
        self.make_tile(parent_phys_thing, new_tile_data, transaction_id, nodegroup_id=PART_IDENTIFIER_ASSIGNMENT_NODEGROUP)

        delete_data = {
            "transactionId": transaction_id,  # NB: camelCase
            "parentPhysicalThingResourceId": str(parent_phys_thing.pk),  # NB: uppercase id
            "parentPhysicalThingTileData": JSONSerializer().serialize(new_tile_data),
        }
        delete_data = JSONSerializer().serialize(delete_data)
        content_type = "application/json"
        response = self.client.post(reverse("deleteanalysisarea"), delete_data, content_type=content_type)

        self.assertEqual(response.status_code, 200)

    def test_create_delete_sample(self):
        self.client.login(username="dev", password="dev")

        transaction_id = "10000000-1000-1000-1000-100000000001"
        parent_phys_thing = self.get_resource_instance(PHYSICAL_THING_GRAPH_ID)
        sampling_activity = self.get_resource_instance(SAMPLING_ACTIVITY_GRAPH_ID)
        part = self.get_resource_instance(PHYSICAL_THING_GRAPH_ID)

        # Create
        part_identifier_assignment_polygon_identifier_nodeid = "97c30c42-8594-11ea-97eb-acde48001122"
        part_identifier_assignment_tile_data = {
            PART_IDENTIFIER_ASSIGNMENT_LABEL: {get_language(): {"value": "test value", "direction": "ltr"}},
            PART_IDENTIFIER_ASSIGNMENT: [],
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
        response = self.client.post(reverse("savesamplearea"), create_data)
        self.assertEqual(response.status_code, 200)

        # Delete
        result = response.json()["result"]
        physical_part_of_object_nodeid = PART_IDENTIFIER_ASSIGNMENT
        physical_part_of_object_resourceid = result["parentPhysicalThing"]["physicalPartOfObjectTile"]["data"][
            physical_part_of_object_nodeid
        ][0]["resourceId"]
        part_identifier_assignment_tile_data = {
            **part_identifier_assignment_tile_data,
            physical_part_of_object_nodeid: [
                {"resourceId": physical_part_of_object_resourceid},
            ],
        }

        delete_data = {
            "transactionId": transaction_id,  # NB: camelCase
            "parentPhysicalThingResourceid": str(parent_phys_thing.pk),
            "partIdentifierAssignmentTileData": JSONSerializer().serialize(part_identifier_assignment_tile_data),
            "samplingActivityResourceId": str(sampling_activity.pk),
            "collectionResourceid": COLLECTION_RESOURCE,
            "sampleMotivation": "Test Motivation",
            "sampleDescription": "Test Description",
        }
        delete_data = JSONSerializer().serialize(delete_data)
        content_type = "application/json"
        response = self.client.post(reverse("deletesamplearea"), delete_data, content_type=content_type)

        self.assertEqual(response.status_code, 200)
