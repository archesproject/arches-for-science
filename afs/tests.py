from django.core.management import call_command

from django.test import TestCase
from django.test.client import Client
from django.urls import reverse

from arches.app.utils.betterJSONSerializer import JSONSerializer
from arches.app.models.models import Node, NodeGroup, ResourceInstance, ResourceXResource, TileModel
from arches.app.models.tile import Tile

def setUpModule():
    call_command("packages", "-o load_package -s afs/pkg -y".split())


class AnalysisAreaAndSampleTakingTests(TestCase):
    def test_create_delete_analysis_area(self):
        client = Client()
        client.login(username="ben", password="Test12345!")

        transaction_id = "10000000-1000-1000-1000-100000000000"
        graph_id = "9519cb4f-b25b-11e9-8c7b-a4d18cec433a"
        part_identifier_assignment = "b240c366-8594-11ea-97eb-acde48001122"
        collection_resource =  "54bf1022-a0b8-4f95-a5e9-82c084b2f53"

        r = ResourceInstance(graph_id=graph_id)
        r.save()  # not part of the transaction, part of the setup
        self.addCleanup(r.delete)
        parent_phys_thing = str(r.pk)

        create_data = {
            "transaction_id": transaction_id,  # NB: snake_case
            "parentPhysicalThingResourceid": parent_phys_thing,  # NB: lowercase id
            "collectionResourceid": collection_resource,
            "partIdentifierAssignmentTileData": JSONSerializer().serialize(
                {part_identifier_assignment: []}
            ),
            "analysisAreaName": "Test Analysis Area",
        }
        response = client.post(reverse("saveanalysisarea"), create_data)
        self.assertEqual(response.status_code, 200)

        new_resource = ResourceInstance.objects.get(
            pk=response.json()['result']['memberOfTile']['resourceinstance_id']
        )
        arbitrary_nodegroup = NodeGroup.objects.first()
        new_tile = TileModel(resourceinstance=r, nodegroup=arbitrary_nodegroup)
        new_tile.save()
        # Set the transactionid
        new_tile_data = {part_identifier_assignment: [{"resourceId": str(new_resource.pk)}]}
        new_tile = Tile.objects.get(tileid=new_tile.pk)
        new_tile.data = new_tile_data
        new_tile.save(transaction_id=transaction_id)

        self.addCleanup(new_tile.delete)
        rxr = ResourceXResource(
            nodeid=Node.objects.get(pk=part_identifier_assignment),
            resourceinstanceidfrom=r,
            resourceinstanceidto=new_resource,
            tileid=new_tile,
        )
        rxr.save(transaction_id=transaction_id)
        self.addCleanup(rxr.delete)

        delete_data = {
            "transactionId": transaction_id,  # NB: camelCase
            "parentPhysicalThingResourceId": parent_phys_thing,  # NB: uppercase id
            "parentPhysicalThingTileData": JSONSerializer().serialize(new_tile_data),
        }
        delete_data = JSONSerializer().serialize(delete_data)
        content_type = "application/json"
        response = client.post(reverse("deleteanalysisarea"), delete_data, content_type=content_type)

        self.assertEqual(response.status_code, 200)
