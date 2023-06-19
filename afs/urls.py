from django.conf.urls import url
from django.conf import settings
from django.urls import path, include
from django.conf.urls.static import static
from afs.views.temp_file import TempFileView
from arches.app.views.plugin import PluginView
from afs.views.workflows.upload_dataset.format_render_map import FormatRenderMap
from afs.views.workflows.upload_dataset.update_file_format import UpdateFileFormat
from afs.views.workflows.upload_dataset.select_dataset_files_step import SelectDatasetFilesStep
from afs.views.download_project_files import FileDownloader
from afs.views.physical_thing_search import PhysicalThingSearchView
from afs.views.physical_things_in_set import PhysicalThingSetView
from afs.views.s3 import S3MultipartUploadManagerView, S3MultipartUploaderView, batch_sign, complete_upload, upload_part
from afs.views.update_resource_list import UpdateResourceListView
from afs.views.analysis_area_and_sample_taking import (
    SaveAnalysisAreaView,
    SaveSampleAreaView,
    DeleteSampleAreaView,
    DeleteAnalysisAreaView,
    GetLockedStatus,
)
from afs.views.digital_resources_by_object_parts import DigitalResourcesByObjectParts
from afs.views.instrument_info_step import InstrumentInfoStepFormSaveView

uuid_regex = settings.UUID_REGEX

urlpatterns = [
    url(r"^physical-thing-search-results", PhysicalThingSearchView.as_view(), name="physical-thing-search-results"),
    url(r"^physical-things-in-set", PhysicalThingSetView.as_view(), name="physical_things_set"),
    url(
        r"^digital-resources-by-object-parts/(?P<resourceid>%s)$" % uuid_regex,
        DigitalResourcesByObjectParts.as_view(),
        name="digital-resources-by-object-parts",
    ),
    url(
        r"^workflows/upload-dataset-workflow/select-dataset-files-step",
        SelectDatasetFilesStep.as_view(),
        name="upload_dataset_select_dataset_files_step",
    ),
    url(
        r"^workflows/upload-dataset-workflow/file-renderer/(?P<tileid>%s)$" % uuid_regex,
        UpdateFileFormat.as_view(),
        name="upload_dataset_file_renderer",
    ),
    url(
        r"^workflows/upload-dataset-workflow/get-format-renderer/(?P<format>[0-9a-zA-Z_\-./]*)$",
        FormatRenderMap.as_view(),
        name="format_render_map",
    ),
    url(r"^updateresourcelist", UpdateResourceListView.as_view(), name="updateresourcelist"),
    url(r"^s3/multipart/(?P<uploadid>[^\/]+)/complete$", complete_upload, name="s3_multipart_upload_complete"),
    url(r"^s3/multipart/(?P<uploadid>[^\/]+)/batch", batch_sign, name="s3_multipart_batch_sign"),
    url(r"^s3/multipart/(?P<uploadid>[^\/]+)/(?P<partnumber>\d+)$", upload_part, name="s3_multipart_upload_part"),
    url(r"^s3/multipart/(?P<uploadid>[^\/]+)", S3MultipartUploadManagerView.as_view(), name="s3_multipart_upload"),
    url(r"^s3/multipart$", S3MultipartUploaderView.as_view(), name="s3_multipart_upload"),
    url(r"^instrument-info-form-save", InstrumentInfoStepFormSaveView.as_view(), name="instrument-info-form-save"),
    url(r"^saveanalysisarea", SaveAnalysisAreaView.as_view(), name="saveanalysisarea"),
    url(r"^savesamplearea", SaveSampleAreaView.as_view(), name="savesamplearea"),
    url(r"^deletesamplearea", DeleteSampleAreaView.as_view(), name="deletesamplearea"),
    url(r"^deleteanalysisarea", DeleteAnalysisAreaView.as_view(), name="deleteanalysisarea"),
    url(r"^analysisarealocked", GetLockedStatus.as_view(), name="analysisarealocked"),
    url(r"^download_project_files", FileDownloader.as_view(), name="download_project_files"),
    url(r"^temp_file/(?P<file_id>[^\/]+)", TempFileView.as_view(), name="temp_file"),
    url(r"^temp_file$", TempFileView.as_view(), name="temp_file"),
    path("reports/", include("arches_templating.urls")),
    url(r"^", include("arches.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
