import datetime
import logging
from io import StringIO
from io import BytesIO
import json
from django.contrib.auth.models import User
from django.core.files import File
from django.http import HttpRequest
from django.utils.translation import gettext as _
from django.views.generic import View
from arches.app.models import models
from arches.app.utils.response import JSONResponse, JSONErrorResponse
import arches.app.utils.zip as zip_utils
import arches.app.utils.task_management as task_management
import arches_for_science.tasks as tasks
from arches_templating.views.template import TemplateView

logger = logging.getLogger(__name__)


class FileDownloader(View):
    def post(self, request):
        json_data = json.loads(request.body)

        # get reports and save them
        templates = json_data.pop("templates")
        generated_reports = []
        for template in templates:
            request.POST = request.POST.copy()
            json_data["templateId"] = template["templateId"]
            json_data["filename"] = template["filename"]
            request._body = json.dumps(json_data)  # TODO: there should be a better way
            report_template = TemplateView()
            response = report_template.post(request, template["templateId"])

            name = response.headers["Content-Disposition"].split("=")[1]  # TODO: need more robust way to do this
            content = response.content
            f = BytesIO(content)
            file = File(f)

            report_file = models.TempFile()
            report_file.source = "project-report-workflow"
            report_file.path.save(name, file)

            generated_reports.append({"name": name, "fileid": report_file.fileid})

        # get attached files and zip them
        files = json_data["files"]
        screenshots = [{"fileid": i["fileId"], "name": i["imageName"]} for i in json_data["annotationScreenshots"]]
        temp_files = generated_reports + screenshots

        project_name = json_data["projectDetails"][0]["displayname"]
        userid = request.user.id

        if len(files) + len(temp_files) == 0:
            message = _(
                "The report(s) are submitted for download. When completed, the bell icon at the top of the page will update with links to download your files."
            )
            return JSONResponse({"success": True, "message": message})

        if task_management.check_if_celery_available():
            result = tasks.download_project_files_task.apply_async(
                (userid, files, temp_files, project_name),
            )
            message = _(
                "The report(s) and {} additional file(s) are submitted for download. When completed, the bell icon at the top of the page will update with links to download your files."
            ).format(len(files) + len(screenshots))
            return JSONResponse({"success": True, "message": message})
        else:
            response = {
                "title": _("Error"),
                "message": _("Celery must be running to download files. Check with your Arches administrator for help."),
            }
            return JSONErrorResponse(content=response)

    def create_download_zipfile(self, user, files, temp_files, project_name):
        file_ids = [file["fileid"] for file in files]
        file_objects = list(models.File.objects.filter(pk__in=file_ids))

        temp_file_ids = [temp_file["fileid"] for temp_file in temp_files]
        temp_file_objects = list(models.TempFile.objects.filter(pk__in=temp_file_ids))

        all_files = files + temp_files
        all_file_objects = file_objects + temp_file_objects

        for file in all_files:
            for file_object in all_file_objects:
                if str(file_object.fileid) == str(file["fileid"]):
                    file["file"] = file_object.path
        download_files = []
        skipped_files = []
        size_limit = 104857600  # 100MByte
        for file in all_files:
            try:
                if file["file"].size >= size_limit:
                    skipped_files.append({"name": file["name"], "fileid": file["fileid"]})
                else:
                    download_files.append({"name": file["name"], "downloadfile": file["file"]})
            except:
                logger.warning(_("Unable to locate {}".format(file["name"])))

        if len(download_files) > 0:
            zip_stream = zip_utils.create_zip_file(download_files, "downloadfile")
            now = datetime.datetime.now().isoformat()
            name = f"{project_name}_{now}.zip"
            search_history_obj = models.SearchExportHistory(user=user, numberofinstances=len(files))
            f = BytesIO(zip_stream)
            download = File(f)
            search_history_obj.downloadfile.save(name, download)
            return search_history_obj.searchexportid, skipped_files
        else:
            return None, skipped_files
