from arches.app.datatypes.base import BaseDataType
from arches.app.models.models import Widget

details = {
    "datatype": "iiif",
    "iconclass": "fa fa-image",
    "modulename": "datatypes.py",
    "classname": "IIIFDataType",
    "configcomponent": None,
    "defaultconfig": None,
    "configname": None,
    "isgeometric": False,
    "defaultwidget": Widget.objects.get(widgetid="aae743b8-4c48-11ea-988b-2bc775672c81"),
    "issearchable": False,
}
# resource-instance-list
# fa fa-external-link-square
# datatypes.py
# ResourceInstanceListDataType
# views/components/datatypes/resource-instance
# {"graphid":null}
# resource-instance-datatype-config
# false
# ff3c400a-76ec-11e7-a793-784f435179ea


class IIIFDataType(BaseDataType):
    def validate(self, value, source=None):
        errors = []
        return errors

    def append_to_document(self, document, nodevalue, nodeid, tile):
        document["strings"].append({"string": nodevalue["address"], "nodegroup_id": tile.nodegroup_id})

    def get_search_terms(self, nodevalue, nodeid=None):
        return [nodevalue["address"]]
