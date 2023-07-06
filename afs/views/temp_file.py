import logging
import uuid
from django.utils.translation import ugettext as _
from django.views.generic import View
from arches.app.models.models import TempFile
from arches.app.utils.response import JSONResponse
from django.http import HttpResponse, HttpResponseNotFound
from mimetypes import MimeTypes

logger = logging.getLogger(__name__)

class TempFileView(View):
    def get(self, request, file_id):

        #file_id = request.GET.get("file_id")

        file = TempFile.objects.get(pk=file_id)
        try:    
            with file.path.open('rb') as f:
                # sending response 
                contents = f.read()
                file_mime = MimeTypes().guess_type(file.path.name)[0]
                response = HttpResponse(contents, content_type=file_mime)
                response['Content-Disposition'] = 'attachment; filename={}'.format(file.path.name.split('/')[1])

        except IOError:
            # handle file not exist case here
            response = HttpResponseNotFound('<h1>File not exist</h1>')

        return response
    
    def post(self, request):
        file_id = uuid.uuid4()
        file_name = request.POST.get("fileName", None)
        file = request.FILES.get("file", None)
        file.file_name = file_name
        file.name = file_name
        temp_file = TempFile.objects.create(fileid=file_id, path=file)
        temp_file.save()

        response_dict = {
            "file_id": file_id
        }

        return JSONResponse(response_dict)





