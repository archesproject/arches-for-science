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

import sys
import uuid
from django.core.management.base import BaseCommand
from django.db import connection
from arches.app.models.tile import Tile


class Command(BaseCommand):
    """
    Find and replace the domain of the url in your manifest and tile records
    """

    def add_arguments(self, parser):

        parser.add_argument("-f", "--find", action="store", dest="find", help="Current string you intend find and change")
        parser.add_argument("-r", "--replace", action="store", dest="replace", help="Text with which you want to replace the current text")

    def handle(self, *args, **options):
        self.find_and_replace(options["find"], options["replace"])

    def find_and_replace(self, find, replace):

        with connection.cursor() as cursor:
            replace_tile_values = """
                update tiles set tiledata = replace(tiledata::text, ('%s'), ('%s'))::jsonb where nodegroupid = 'fec59582-8593-11ea-97eb-acde48001122';
            """ % (
                find,
                replace,
            )

            replace_manifest_values = """
                update iiif_manifests set manifest = replace(manifest::text, ('%s'), ('%s'))::jsonb;
            """ % (
                find,
                replace,
            )

            cursor.execute(replace_tile_values)
            cursor.execute(replace_manifest_values)

            tiles = Tile.objects.filter(nodegroup_id=uuid.UUID("fec59582-8593-11ea-97eb-acde48001122"))

            print("indexing tiles")
            for tile in tiles:
                tile.index()
            print("indexing complete")
