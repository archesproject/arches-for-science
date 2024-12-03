from django.apps import AppConfig

from arches.settings_utils import generate_frontend_configuration


class ArchesForScienceConfig(AppConfig):
    name = "arches_for_science"
    verbose_name = "Arches for Science"
    is_arches_application = True

    def ready(self):
        generate_frontend_configuration()
        from . import signals
