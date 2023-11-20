from arches.app.functions.primary_descriptors import AbstractPrimaryDescriptorsFunction

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
    """Implemented in the database via triggers on tiles table."""
    pass
