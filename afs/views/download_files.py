import datetime
import logging
from io import StringIO
from io import BytesIO
import json
from django.contrib.auth.models import User
from django.core.files import File
from django.http import HttpRequest
from django.utils.translation import ugettext as _
from django.views.generic import View
from arches.app.models import models
from arches.app.utils.response import JSONResponse
import arches.app.utils.zip as zip_utils
import arches.app.utils.task_management as task_management
import afs.tasks as tasks

class FileDownloader(View):
    def post(self, request):
        files = json.loads(request.POST.get("files"))
        if len(files) == 0:
            message = _("No files is selected for download.")
            return JSONResponse({"success": False, "message": message})

        project_name = files[0]['project']
        userid = request.user.id

        if task_management.check_if_celery_available():
            result = tasks.download_related_files.apply_async((userid, files, project_name),)
            message = _(
                "{} file(s) have been submitted for download. Click the bell icon to check for the link(s) to download your file(s)"
            ).format(len(files))
            return JSONResponse({"success": True, "message": message})
        else:
            message = _("The Celery is required to download files")
            return JSONResponse({"success": False, "message": message})


    def create_download_zipfile(self, user, files, project_name):
        file_ids = [file['fileid'] for file in files]
        file_objects = list(models.File.objects.filter(pk__in=file_ids))
        for file in files:
            for file_object in file_objects:
                if str(file_object.fileid) == file['fileid']:
                    file['file'] = file_object.path
        download_files = []
        skipped_files = []
        size_limit = 1048576
        for file in files:
            if file['file'].size >= size_limit:
                skipped_files.append({'name': file['name'], 'fileid': file['fileid']})
            else:
                download_files.append({'name': file['name'], 'downloadfile': file['file']})

        zip_stream = zip_utils.create_zip_file(download_files, "downloadfile")
        now = datetime.datetime.now().isoformat()
        name = f"{project_name}_{now}.zip"
        search_history_obj = models.SearchExportHistory(user=user, numberofinstances = len(files))
        f = BytesIO(zip_stream)
        download = File(f)
        search_history_obj.downloadfile.save(name, download)
        return search_history_obj.searchexportid, skipped_files
