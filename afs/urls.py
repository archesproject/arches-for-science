from django.conf.urls import include, url
from django.conf import settings
from django.conf.urls.static import static
from arches.app.views.plugin import PluginView
from afs.views.physical_thing_search import PhysicalThingSearchView
from afs.views.physical_things_in_set import PhysicalThingSetView
from afs.views.manifest import ManifestView

urlpatterns = [
    url(r"^", include("arches.urls")),
    url(r"^physical-thing-search-results", PhysicalThingSearchView.as_view(), name="physical-thing-search-results"),
    url(r"^physical-things-in-set", PhysicalThingSetView.as_view(), name="physical_things_set"),
    url(r"^manifest/(?P<id>[0-9]+)$", ManifestView.as_view(), name="manifest"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
