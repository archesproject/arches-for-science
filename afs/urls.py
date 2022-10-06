from django.conf.urls import include, url
from django.conf import settings
from django.conf.urls.static import static
from arches.app.views.plugin import PluginView
from afs.views.physical_thing_search import PhysicalThingSearchView
from afs.views.physical_things_in_set import PhysicalThingSetView
from afs.views.update_resource_list import UpdateResourceListView
from afs.views.save_analysis_area import SaveAnalysisAreaView, SaveSampleAreaView, DeleteSampleAreaView
from afs.views.digital_resources_by_object_parts import DigitalResourcesByObjectParts
from afs.views.instrument_info_step import InstrumentInfoStepFormSaveView

uuid_regex = settings.UUID_REGEX

urlpatterns = [
    url(r"^", include("arches.urls")),
    url(r"^physical-thing-search-results", PhysicalThingSearchView.as_view(), name="physical-thing-search-results"),
    url(r"^physical-things-in-set", PhysicalThingSetView.as_view(), name="physical_things_set"),
    url(
        r"^digital-resources-by-object-parts/(?P<resourceid>%s)$" % uuid_regex,
        DigitalResourcesByObjectParts.as_view(),
        name="digital-resources-by-object-parts",
    ),
    url(r"^updateresourcelist", UpdateResourceListView.as_view(), name="updateresourcelist"),
    url(r"^instrument-info-form-save", InstrumentInfoStepFormSaveView.as_view(), name="instrument-info-form-save"),
    url(r"^saveanalysisarea", SaveAnalysisAreaView.as_view(), name="saveanalysisarea"),
    url(r"^savesamplearea", SaveSampleAreaView.as_view(), name="savesamplearea"),
    url(r"^deletesamplearea", DeleteSampleAreaView.as_view(), name="deletesamplearea"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
