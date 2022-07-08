from django.conf.urls import include, url
from django.conf import settings
from django.conf.urls.static import static
from arches.app.views.plugin import PluginView
from afs.views.physical_thing_search import PhysicalThingSearchView
from afs.views.physical_things_in_set import PhysicalThingSetView
from afs.views.s3 import S3MultipartUploadManagerView, S3MultipartUploaderView, batch_sign, complete_upload, upload_part
from afs.views.update_resource_list import UpdateResourceListView
from afs.views.digital_resources_by_object_parts import DigitalResourcesByObjectParts

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
    url(r"^s3/multipart$", S3MultipartUploaderView.as_view(), name="s3_multipart_upload"),
    url(r"^s3/multipart/(?P<uploadid>[^\/]+)/complete$", complete_upload, name="s3_multipart_upload_complete"),
    url(r"^s3/multipart/(?P<uploadid>[^\/]+)/batch", batch_sign, name="s3_multipart_batch_sign"),
    url(r"^s3/multipart/(?P<uploadid>[^\/]+)/(?P<partnumber>\d+)$", upload_part, name="s3_multipart_upload_part"),
    url(r"^s3/multipart/(?P<uploadid>[^\/]+)", S3MultipartUploadManagerView.as_view(), name="s3_multipart_upload"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
