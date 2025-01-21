from django.conf import settings
from django.urls import include, path, re_path
from django.conf.urls.i18n import i18n_patterns
from django.conf.urls.static import static
from arches_for_science.views.renderer_config import RendererConfigView, RendererView
from arches_for_science.views.workflows.upload_dataset.format_render_map import FormatRenderMap
from arches_for_science.views.workflows.upload_dataset.update_file_format import UpdateFileFormat
from arches_for_science.views.workflows.upload_dataset.select_dataset_files_step import SelectDatasetFilesStep
from arches_for_science.views.download_project_files import FileDownloader
from arches_for_science.views.physical_thing_search import PhysicalThingSearchView
from arches_for_science.views.physical_things_in_set import PhysicalThingSetView
from arches_for_science.views.s3 import (
    S3MultipartUploadManagerView,
    S3MultipartUploaderView,
    S3BatchSignView,
    S3CompleteUploadView,
    S3UploadPartView,
    S3UploadView,
)
from arches_for_science.views.update_resource_list import UpdateResourceListView
from arches_for_science.views.analysis_area_and_sample_taking import (
    SaveAnalysisAreaView,
    SaveSampleAreaView,
    DeleteSampleAreaView,
    DeleteAnalysisAreaView,
    GetLockedStatus,
)
from arches_for_science.views.digital_resources_by_object_parts import DigitalResourcesByObjectParts
from arches_for_science.views.instrument_info_step import InstrumentInfoStepFormSaveView
from arches_for_science.views.manifest_x_canvas import ManifestXCanvasView

uuid_regex = settings.UUID_REGEX

urlpatterns = [
    re_path(r"^physical-thing-search-results", PhysicalThingSearchView.as_view(), name="physical-thing-search-results"),
    re_path(r"^physical-things-in-set", PhysicalThingSetView.as_view(), name="physical_things_set"),
    re_path(
        r"^digital-resources-by-object-parts/(?P<resourceid>%s)$" % uuid_regex,
        DigitalResourcesByObjectParts.as_view(),
        name="digital-resources-by-object-parts",
    ),
    re_path(
        r"^workflows/upload-dataset-workflow/select-dataset-files-step",
        SelectDatasetFilesStep.as_view(),
        name="upload_dataset_select_dataset_files_step",
    ),
    re_path(
        r"^workflows/upload-dataset-workflow/file-renderer/(?P<tileid>%s)$" % uuid_regex,
        UpdateFileFormat.as_view(),
        name="upload_dataset_file_renderer",
    ),
    re_path(
        r"^workflows/upload-dataset-workflow/get-format-renderer/(?P<format>[0-9a-zA-Z_\-./]*)$",
        FormatRenderMap.as_view(),
        name="format_render_map",
    ),
    re_path(r"^updateresourcelist", UpdateResourceListView.as_view(), name="updateresourcelist"),
    re_path(r"^uppy/s3/multipart/(?P<uploadid>[^\/]+)/complete$", S3CompleteUploadView.as_view(), name="s3_multipart_upload_complete"),
    re_path(r"^uppy/s3/multipart/(?P<uploadid>[^\/]+)/batch", S3BatchSignView.as_view(), name="s3_multipart_batch_sign"),
    re_path(r"^uppy/s3/multipart/(?P<uploadid>[^\/]+)/(?P<partnumber>\d+)", S3UploadPartView.as_view(), name="s3_multipart_upload_part"),
    re_path(r"^uppy/s3/multipart/(?P<uploadid>[^\/]+)", S3MultipartUploadManagerView.as_view(), name="s3_multipart_upload"),
    re_path(r"^uppy/s3/multipart$", S3MultipartUploaderView.as_view(), name="s3_multipart_upload"),
    re_path(r"^uppy/s3/params", S3UploadView.as_view(), name="s3_upload"),
    re_path(r"^instrument-info-form-save", InstrumentInfoStepFormSaveView.as_view(), name="instrument-info-form-save"),
    re_path(r"^saveanalysisarea", SaveAnalysisAreaView.as_view(), name="saveanalysisarea"),
    re_path(r"^savesamplearea", SaveSampleAreaView.as_view(), name="savesamplearea"),
    re_path(r"^deletesamplearea", DeleteSampleAreaView.as_view(), name="deletesamplearea"),
    re_path(r"^deleteanalysisarea", DeleteAnalysisAreaView.as_view(), name="deleteanalysisarea"),
    re_path(r"^analysisarealocked", GetLockedStatus.as_view(), name="analysisarealocked"),
    re_path(r"^download_project_files", FileDownloader.as_view(), name="download_project_files"),
    re_path(r"^renderer/(?P<renderer_id>[^\/]+)", RendererView.as_view(), name="renderer"),
    re_path(r"^renderer_config/(?P<renderer_config_id>[^\/]+)", RendererConfigView.as_view(), name="renderer_config"),
    re_path(r"^renderer_config/", RendererConfigView.as_view(), name="renderer_config"),
    re_path(r"^manifest_x_canvas/", ManifestXCanvasView.as_view(), name="manifest_x_canvas"),
    path("reports/", include("arches_templating.urls")),
    path("", include("arches.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Only handle i18n routing in active project. This will still handle the routes provided by Arches core and Arches applications,
# but handling i18n routes in multiple places causes application errors.
if settings.ROOT_URLCONF == __name__:
    if settings.SHOW_LANGUAGE_SWITCH is True:
        urlpatterns = i18n_patterns(*urlpatterns)

    urlpatterns.append(path("i18n/", include("django.conf.urls.i18n")))
