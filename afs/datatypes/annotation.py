from arches.app.datatypes.base import BaseDataType
from arches.app.models.models import Widget

details = {
    "datatype": "annotation",
    "iconclass": "fa fa-image",
    "modulename": "datatypes.py",
    "classname": "AnnotationDataType",
    "configcomponent": None,
    "defaultconfig": None,
    "configname": None,
    "isgeometric": False,
    "defaultwidget": Widget.objects.get(widgetid="aae743b8-4c48-11ea-988b-2bc775672c81"),
    "issearchable": False,
}


class AnnotationDataType(BaseDataType):
    def validate(self, value, source=None, node=None):
        errors = []
        return errors

    def append_to_document(self, document, nodevalue, nodeid, tile):
        # document["strings"].append({"string": nodevalue["address"], "nodegroup_id": tile.nodegroup_id})
        return

    def get_search_terms(self, nodevalue, nodeid=None):
        # return [nodevalue["address"]]
        return []

    def default_es_mapping(self):
        # let ES dyanamically map this datatype
        return
