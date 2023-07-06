from celery import shared_task
from django.contrib.auth.models import User
from django.http import HttpRequest
from django.utils.translation import ugettext as _
from arches.app.models.models import SearchExportHistory
from arches.app.models.system_settings import settings


try:
    from arches.app.tasks import *
except ImportError:
    pass


@shared_task
def download_project_files_task(userid, files, project_name):
    from afs.views.download_project_files import FileDownloader

    downloader = FileDownloader()
    user = User.objects.get(pk=userid)
    exportid, files = downloader.create_download_zipfile(user, files, project_name)

    search_history_obj = SearchExportHistory.objects.get(pk=exportid) if exportid else None

    msg = _(
        "The related files for the project '{}' are ready for download. You have 24 hours to download your files before they are automatically removed."
    ).format(project_name)
    notiftype_name = "Search Export Download Ready"
    context = dict(
        greeting=_("Your request to download related project files is complete and your files are ready for download."),
        link=str(exportid) if exportid else "",
        files=files,
        button_text=_("Download Now"),
        closing=_("Thank you"),
        email=user.email,
        email_link=str(settings.ARCHES_NAMESPACE_FOR_DATA_EXPORT).rstrip("/") + settings.MEDIA_URL + str(search_history_obj.downloadfile) if search_history_obj else None,
    )

    notify_completion(msg, user, notiftype_name, context)
