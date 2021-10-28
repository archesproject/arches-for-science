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

import ast
import os
import csv
import json
from django.core import management
from django.core.management.base import BaseCommand
from arches.app.models.system_settings import settings
from arches.app.models.models import TileModel
from arches.app.datatypes.datatypes import DateDataType
from arches.app.datatypes.concept_types import ConceptListDataType
from arches.app.models.resource import Resource


class Command(BaseCommand):
    """
    Adds production tiles from csv
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "-s", "--source", default="afs-test-pkg/pkg/business_data/Physical Thing.csv", action="store", dest="source", help=""
        )

    def handle(self, *args, **options):
        src = os.path.join(settings.APP_ROOT, options["source"])
        concept_list_datatype = ConceptListDataType()
        date_datatype = DateDataType()
        with open(src) as f:
            lines = csv.DictReader(f)
            prod_tile = None
            events = self.build_prod(lines)
            for event in events.items():
                record = event[1]
                if record["Production_carried_out_by2"] not in (None, ""):
                    prod_tile = self.create_prod_tile(record)
                    self.create_prod_time_tile(prod_tile.tileid, record, date_datatype)
                    self.create_prod_statement_tile(prod_tile.tileid, record, concept_list_datatype)
        self.reindex_instances()

    def reindex_instances(self):
        management.call_command("es", "index_resources_by_type", resource_types=["9519cb4f-b25b-11e9-8c7b-a4d18cec433a"])

    def build_prod(self, lines):
        production_events = {}
        for line in lines:
            resourceid = line["ResourceID"]
            nodes = [
                "Production_carried_out_by2",
                "Production_Time_end_of_the end",
                "Production_Time_Name_label",
                "Production_Time_begin_of_the_begin",
                "Production_Time_Name_content",
                "Production_Statement_language",
                "Production_Statement_type",
                "Production_Statement_content",
                "Production_Statement_label",
            ]

            event = {
                "ResourceID": resourceid,
                "Production_carried_out_by2": line["Production_carried_out_by2"],
                "Production_Time_end_of_the end": line["Production_Time_end_of_the end"],
                "Production_Time_begin_of_the_begin": line["Production_Time_begin_of_the_begin"],
                "Production_Time_Name_content": line["Production_Time_Name_content"],
                "Production_Time_Name_label": line["Production_Time_Name_label"],
                "Production_Statement_language": line["Production_Statement_language"],
                "Production_Statement_type": line["Production_Statement_type"],
                "Production_Statement_content": line["Production_Statement_content"],
                "Production_Statement_label": line["Production_Statement_label"],
            }
            if resourceid not in production_events:
                production_events[resourceid] = event
            else:
                for node in nodes:
                    production_events[resourceid][node] = (
                        line[node] if line[node] not in ("", None) else production_events[resourceid][node]
                    )
        return production_events

    def delete_existing_tile(self, nodegroupid, line):
        try:
            old_tile = TileModel.objects.get(
                nodegroup_id=nodegroupid,
                resourceinstance_id=line["ResourceID"],
            )
            old_tile_tileid = old_tile.tileid
            old_tile.delete()
        except Exception as e:
            old_tile_tileid = None
        return old_tile_tileid

    def save_new_tile(self, nodegroupid, line, tile_template, old_tile_tileid, parenttileid=None):
        try:
            tile = TileModel.objects.create(
                nodegroup_id=nodegroupid,
                resourceinstance_id=line["ResourceID"],
                data=tile_template,
                tileid=old_tile_tileid,
                parenttile_id=parenttileid,
            )
        except Exception as e:
            print("failed to create tile")
            print(e)
            tile = None
        return tile

    def create_prod_tile(self, line):
        nodegroupid = "cc15650c-b497-11e9-a64d-a4d18cec433a"
        tile_template = {
            "cc1591c7-b497-11e9-967e-a4d18cec433a": None,
            "cc15a23a-b497-11e9-bb7f-a4d18cec433a": None,
            "cc15bb30-b497-11e9-b68a-a4d18cec433a": None,
            "cc15ce0f-b497-11e9-bedd-a4d18cec433a": None,
            "cc1611e6-b497-11e9-b277-a4d18cec433a": None,
            "cc1650d4-b497-11e9-9965-a4d18cec433a": None,
            "cc168005-b497-11e9-a303-a4d18cec433a": None,
            "cc16893d-b497-11e9-94b0-a4d18cec433a": [
                {
                    "resourceId": "d540519b-9937-4423-803e-00d096075859",
                    "ontologyProperty": "",
                    "resourceXresourceId": "0730c122-36bb-11ec-bf23-0242ac1a0007",
                    "inverseOntologyProperty": "",
                }
            ],
            "cc16adf5-b497-11e9-9a90-a4d18cec433a": None,
            "cc16aff3-b497-11e9-84be-a4d18cec433a": None,
        }

        try:
            tile_template["cc16893d-b497-11e9-94b0-a4d18cec433a"] = json.loads(line["Production_carried_out_by2"])
        except Exception as e:
            try:
                tile_template["cc16893d-b497-11e9-94b0-a4d18cec433a"] = ast.literal_eval(line["Production_carried_out_by2"])
            except Exception as e:
                tile_template = None

        old_tile_tileid = self.delete_existing_tile(nodegroupid, line)
        tile = self.save_new_tile(nodegroupid, line, tile_template, old_tile_tileid)
        return tile

    def create_prod_time_tile(self, parenttileid, line, datatype):
        nodegroupid = "cc15718f-b497-11e9-a9e8-a4d18cec433a"
        tile = None
        try:
            tile_template = {
                "cc15aa94-b497-11e9-9a42-a4d18cec433a": datatype.transform_value_for_tile(line["Production_Time_end_of_the end"]),
                "cc164d21-b497-11e9-a7f0-a4d18cec433a": line["Production_Time_Name_content"],
                "cc166421-b497-11e9-a14c-a4d18cec433a": datatype.transform_value_for_tile(line["Production_Time_begin_of_the_begin"]),
                "cc16677d-b497-11e9-b450-a4d18cec433a": None,
                "cc16a7b5-b497-11e9-a8fd-a4d18cec433a": None,
                "cc16bdf0-b497-11e9-b2a9-a4d18cec433a": None,
            }
            old_tile_tileid = self.delete_existing_tile(nodegroupid, line)
            tile = self.save_new_tile(nodegroupid, line, tile_template, old_tile_tileid, parenttileid)
        except:
            print("Oh no!! Unable to save the production time span tile with the following data:")
            print("Production_Time_end_of_the end", line["Production_Time_end_of_the end"])
            print("Production_Time_begin_of_the_begin", line["Production_Time_begin_of_the_begin"])
            print("Production_Time_Name_content", line["Production_Time_Name_content"])
            print(line["ResourceID"])
        return tile

    def create_prod_statement_tile(self, parenttileid, line, datatype):
        nodegroupid = "6c1d4051-bee9-11e9-a4d2-a4d18cec433a"
        tile = None
        try:
            tile_template = {
                "6c1d4873-bee9-11e9-8e6e-a4d18cec433a": datatype.transform_value_for_tile(line["Production_Statement_language"]),
                "6c1d4e2e-bee9-11e9-a29e-a4d18cec433a": datatype.transform_value_for_tile(line["Production_Statement_type"]),
                "6c1d51d1-bee9-11e9-a4a6-a4d18cec433a": None,
                "6c1d538a-bee9-11e9-91b9-a4d18cec433a": None,
                "6c1d589c-bee9-11e9-a1a8-a4d18cec433a": line["Production_Statement_content"],
            }
            old_tile_tileid = self.delete_existing_tile(nodegroupid, line)
            tile = self.save_new_tile(nodegroupid, line, tile_template, old_tile_tileid, parenttileid)
        except:
            print("Dang!! Unable to save the production statement tile with the following data:")
            print("Production_Statement_language", line["Production_Statement_language"])
            print("Production_Statement_type", line["Production_Statement_type"])
            print("Production_Statement_content", line["Production_Statement_content"])
        return tile
