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
from arches.app.models.tile import Tile
from arches.app.datatypes.concept_types import ConceptListDataType
from arches.app.datatypes.datatypes import FileListDataType


class Command(BaseCommand):
    """
    Adds file tiles from csv
    """


    def add_arguments(self, parser):
        parser.add_argument(
            "-s", "--source", default="afs-test-pkg/pkg/business_data/Digital Resources.csv", action="store", dest="source", help=""
        )

    def handle(self, *args, **options):
        self.concept_list_datatype = ConceptListDataType()
        self.file_list_datatype = FileListDataType()
        src = os.path.join(settings.APP_ROOT, options["source"])
        with open(src) as f:
            lines = csv.DictReader(f)
            parent_tile = None
            records = lines
            files_cleared = []
            for record in records:
                if record['ResourceID'] not in files_cleared:
                    self.delete_existing_tiles('7c486328-d380-11e9-b88e-a4d18cec433a', record)
                    files_cleared.append(record['ResourceID'])
                if record["File"] not in (None, ""):
                    parent_tile = self.create_file_tile(record)
                    if parent_tile is not None:
                        self.create_name_tile(record, parent_tile.tileid)
                        self.create_statement_tile(record, parent_tile.tileid)
                        print(record['ResourceID'])

    def reindex_instances(self):
        management.call_command("es", "index_resources_by_type", resource_types=["9519cb4f-b25b-11e9-8c7b-a4d18cec433a"])

    def delete_existing_tiles(self, nodegroupid, record):
        deleted_tiles = []
        try:
            old_tiles = Tile.objects.filter(
                nodegroup_id=nodegroupid,
                resourceinstance_id=record["ResourceID"],
            )
            for tile in old_tiles:
                deleted_tiles.append(tile.tileid)
                tile.delete()
        except Exception as e:
            print('failed to delete tiles')
        print('tiles deleted', deleted_tiles)

    def create_file_tile(self, record):
        nodegroupid = "7c486328-d380-11e9-b88e-a4d18cec433a"
        tile = Tile().get_blank_tile_from_nodegroup_id(nodegroupid, resourceid=record["ResourceID"])
        tile.data['29d5ecb8-79a5-11ea-8ae2-acde48001122'] = self.concept_list_datatype.transform_value_for_tile(record["File_Name_type"])
        tile.data['7c486328-d380-11e9-b88e-a4d18cec433a'] = self.file_list_datatype.transform_value_for_tile(record["File"])
        tile.save()
        print('saved file', record["File"])
        return tile

    def create_name_tile(self, record, parenttileid):
        nodegroupid = "17fc58ec-79a5-11ea-8ae2-acde48001122"
        tile = Tile().get_blank_tile_from_nodegroup_id(nodegroupid, resourceid=record["ResourceID"])
        tile.parenttile_id = parenttileid
        tile.data['17fc5b9e-79a5-11ea-8ae2-acde48001122'] = self.concept_list_datatype.transform_value_for_tile(record["File_Name_type"])
        tile.data['17fc5e14-79a5-11ea-8ae2-acde48001122'] = record["File_Name_content"]
        tile.data['17fc5cfc-79a5-11ea-8ae2-acde48001122'] = self.concept_list_datatype.transform_value_for_tile(record["File_Name_language"])
        print('saved name')
        tile.save()
        return tile

    def create_statement_tile(self, record, parenttileid):
        nodegroupid = "ca226fe2-78ed-11ea-a33b-acde48001122"
        tile = Tile().get_blank_tile_from_nodegroup_id(nodegroupid, resourceid=record["ResourceID"])
        tile.parenttile_id = parenttileid
        tile.data['ca2272c6-78ed-11ea-a33b-acde48001122'] = self.concept_list_datatype.transform_value_for_tile(record["File_Statement_type"])
        tile.data['ca227726-78ed-11ea-a33b-acde48001122'] = record["File_Statement_content"]
        print('saved statement')
        tile.save()
        return tile
