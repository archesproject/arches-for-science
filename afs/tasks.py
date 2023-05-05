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

    search_history_obj = SearchExportHistory.objects.get(pk=exportid)

    msg = _(
        "The related files for the project '{}' is ready for download. You have 24 hours to access this file, after which we'll automatically remove it."
    ).format(project_name)
    notiftype_name = "Search Export Download Ready"
    context = dict(
        greeting=_("Hello,\nYour request to download the related files is now ready."),
        link=str(exportid),
        files=files,
        button_text=_("Download Now"),
        closing=_("Thank you"),
        email=user.email,
        email_link=str(settings.ARCHES_NAMESPACE_FOR_DATA_EXPORT).rstrip("/") + "/files/" + str(search_history_obj.downloadfile),
    )

    notify_completion(msg, user, notiftype_name, context)
