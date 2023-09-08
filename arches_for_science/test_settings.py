import os

# Depends on /arches being on the python path, as arches.tests is not importable
from tests.test_settings import *

INSTALLED_APPS += ("arches_for_science", "arches_templating")
ROOT_URLCONF = "arches_for_science.urls"
APP_NAME = "arches_for_science"
APP_ROOT = os.path.dirname(__file__)

# Further settings may need to be added from project, just don't
# want to clobber anything from core test settings for now.
# Also, settings can be overridden directly. See @override_settings
