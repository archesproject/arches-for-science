from datetime import datetime
import json
import logging
import urllib3
import uuid
from django.db import connection
from arches.app.etl_modules.base_import_module import BaseImportModule
from django.utils.translation import ugettext as _

logger = logging.getLogger(__name__)

details = {
    "etlmoduleid": "3b19a76a-0b09-450e-bee1-65accb096000",
    "name": "Import JSON",
    "description": "Loads resource data from a JSON source",
    "etl_type": "import",
    "component": "views/components/etl_modules/json-importer",
    "componentname": "json-importer",
    "modulename": "json_importer.py",
    "classname": "JsonImporter",
    "config": {"circleColor": "#ff77cc", "bgColor": "#cc2266", "show": True},
    "icon": "fa fa-upload",
    "slug": "json-importer"
}


class JsonImporter(BaseImportModule):
    def __init__(self, request=None, loadid=None, temp_dir=None):
        self.request = request if request else None
        self.userid = request.user.id if request else None
        self.moduleid = request.POST.get("module") if request else None
        self.loadid = loadid if loadid else None
        self.name_nodeid = 'f6e7ee86-fbfd-11ec-8af4-0242ac1a0006'
        self.nodegroupid = 'f6e7ee86-fbfd-11ec-8af4-0242ac1a0006'
        self.geom_nodeid = 'fe6d0baa-fbfd-11ec-8af4-0242ac1a0006'

    def stage_data(self, data):
        row_count = 0
        for feature in data["features"]:
            try:
                with connection.cursor() as cursor:
                    row_count += 1
                    properties = feature.pop("properties")
                    feature_collection = {
                        "features": [feature],
                        "type": "FeatureCollection"
                    }
                    tile_value = {}
                    tile_value[self.name_nodeid] = {"value": properties["Placename"], "valid": True, "source": "aher", "notes": None, "datatype": 'string'}
                    tile_value[self.geom_nodeid] = {"value": feature_collection, "valid": True, "source": "aher", "notes": None, "datatype": 'geojson-feature-collection'}
                    cursor.execute(
                        """INSERT INTO load_staging (nodegroupid, legacyid, resourceid, tileid, parenttileid, value, loadid, nodegroup_depth, source_description, passes_validation) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                        (
                            self.nodegroupid,
                            None,
                            uuid.uuid4(),
                            uuid.uuid4(),
                            None,
                            json.dumps(tile_value),
                            self.loadid,
                            0,
                            "some url",  # source_description
                            True,
                        ),
                    )
            except KeyError:
                pass
        return {"name": "did stuff", "rows": row_count}

    def validate(self):
        success = True
        with connection.cursor() as cursor:
            error_message = _("Legacy id(s) already exist. Legacy ids must be unique")
            cursor.execute(
                """UPDATE load_event SET error_message = %s, status = 'failed' WHERE  loadid = %s::uuid
            AND EXISTS (SELECT legacyid FROM load_staging where loadid = %s::uuid and legacyid is not null INTERSECT SELECT legacyid from resource_instances);""",
                (error_message, self.loadid, self.loadid),
            )
            cursor.execute("""SELECT * FROM __arches_load_staging_report_errors(%s)""", (self.loadid,))
            row = cursor.fetchall()
        return {"success": success, "data": row}

    def fetch_data(self):
        http = urllib3.PoolManager()
        r = http.request('GET', 'https://qa.archesproject.org/api/search/export_results?paging-filter=1&tiles=true&format=geojson&reportlink=false&precision=6&total=0&resource-type-filter=%5B%7B%22graphid%22%3A%2278b32d8c-b6f2-11ea-af42-f875a44e0e11%22%2C%22name%22%3A%22Place%22%2C%22inverted%22%3Afalse%7D%5D')
        return json.loads(r.data.decode('utf-8'))

    def read(self, request):
        self.loadid = request.POST.get("load_id")
        result = self.fetch_data()
        return {"success": result, "data": result}

    def start(self, request):
        self.loadid = request.POST.get("load_id")
        result = {"started": False, "message": ""}
        with connection.cursor() as cursor:
            try:
                cursor.execute(
                    """INSERT INTO load_event (loadid, etl_module_id, complete, status, load_start_time, user_id) VALUES (%s, %s, %s, %s, %s, %s)""",
                    (self.loadid, self.moduleid, False, "running", datetime.now(), self.userid),
                )
                result["started"] = True
            except Exception:
                result["message"] = _("Unable to initialize load")
        return {"success": result["started"], "data": result}

    def write(self, request):
        self.loadid = request.POST.get("load_id")
        self.details = request.POST.get("load_details", None)
        data = self.fetch_data()
        result = {}
        if self.details:
            response = self.run_load_task(data, result, self.loadid)
            return response

    def run_load_task(self, data, result, loadid):
        with connection.cursor() as cursor:
            self.stage_data(data)
            cursor.execute("""CALL __arches_check_tile_cardinality_violation_for_load(%s)""", [loadid])
            result["validation"] = self.validate()
            if len(result["validation"]["data"]) == 0:
                self.complete_load(loadid, multiprocessing=False)
            else:
                cursor.execute(
                    """UPDATE load_event SET status = %s, load_end_time = %s WHERE loadid = %s""",
                    ("failed", datetime.now(), loadid),
                )
        return {"success": result["validation"]["success"], "data": result}


