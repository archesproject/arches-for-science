from django.conf.urls import include, url
from django.conf import settings
from django.conf.urls.static import static
from arches.app.views.plugin import PluginView
from afs.views.physical_thing_search import PhysicalThingSearchView

urlpatterns = [
    url(r"^", include("arches.urls")),
    url(r"^plugins/sampling-activity-workflow", PluginView.as_view(), name="sampling-activity-workflow"),
    url(r"^plugins/research-activity-workflow", PluginView.as_view(), name="research-activity-workflow"),
    url(r"^plugins/init-workflow", PluginView.as_view(), name="init-workflow"),
    url(r"^physical-thing-search-results", PhysicalThingSearchView.as_view(), name="physical-thing-search-results"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
