from arches.app.functions.primary_descriptors import AbstractPrimaryDescriptorsFunction
from arches.app.models.system_settings import settings

from django.utils.translation import get_language, gettext as _

# This duplicates the configuration declared in migration 0004,
# but on first package load, the function will be re-registered, because
# the .py file has not yet been placed in the destination folder.
# Re-registration will overwrite whatever the migration inserted.
details = {
    "functionid": "00b2d15a-fda0-4578-b79a-784e4138664b",
    "name": "Multi-card Resource Descriptor",
    "type": "primarydescriptors",
    "description": "Configure the name, description, and map popup of a resource",
    "defaultconfig": {
        "descriptor_types": {
            "name": {
                "nodegroup_id": "",
                "string_template": "",
            },
            "map_popup": {
                "nodegroup_id": "",
                "string_template": "",
            },
            "description": {
                "nodegroup_id": "",
                "string_template": "",
            },
        }
    },
    "classname": "MulticardResourceDescriptor",
    "component": "views/components/functions/multicard-resource-descriptor",
}


class MulticardResourceDescriptor(AbstractPrimaryDescriptorsFunction):
    """Implemented in the database via triggers on tiles table.

    This implementation just fetches the calculated result from the db."""

    def get_primary_descriptor_from_nodes(self, resource, config, context=None, descriptor=None):
        resource.refresh_from_db(fields={"name", "descriptors"})
        resource.get_descriptor_language(context)

        result = ""
        requested_language = context.get("language", None) if context else None

        lookup_language = requested_language or get_language() or settings.LANGUAGE_CODE
        try:
            result = resource.descriptors[lookup_language][descriptor]
        except KeyError:
            pass

        if result.strip() == "":
            result = _("Undefined")

        return result
