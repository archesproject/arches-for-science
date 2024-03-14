import json
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.utils.decorators import method_decorator
from django.utils.translation import gettext as _
from arches.app.views.base import BaseManagerView
from arches.app.utils.decorators import can_edit_resource_instance
import boto3
from botocore.config import Config

KEY_BASE = settings.UPLOADED_FILES_DIR


class S3View(BaseManagerView):
    def __init__(self):
        self.config = Config(region_name=settings.AWS_S3_REGION_NAME, s3={"signature_version": "s3v4"})


@method_decorator(can_edit_resource_instance, name="dispatch")
class S3MultipartUploaderView(S3View):
    """S3 Multipart uploader chunks files to allow for parallel uploads to S3"""

    def __init__(self):
        super().__init__()

    def options(self, request):
        response = HttpResponse()
        response.headers["access-control-allow-headers"] = "x-csrftoken,accept,content-type,uppy-auth-token,location"
        return response

    def post(self, request):
        try:
            storage_bucket = settings.AWS_STORAGE_BUCKET_NAME
        except AttributeError:
            raise Exception(_("Django storages for AWS not configured"))

        json_body = json.loads(request.body)
        file_name = json_body["filename"]
        if file_name and file_name.startswith(KEY_BASE):
            key = file_name
        else:
            key = KEY_BASE + file_name

        response_object = {}
        s3 = boto3.client("s3", config=self.config)
        resp = s3.create_multipart_upload(
            Bucket=storage_bucket,
            Key=key,
            ContentType=json_body["type"],
            Metadata=json_body["metadata"],
        )
        response_object["key"] = resp["Key"]
        response_object["uploadId"] = resp["UploadId"]
        return JsonResponse(response_object)


@method_decorator(can_edit_resource_instance, name="dispatch")
class S3MultipartUploadManagerView(S3View):
    """Returns all of the parts of a given upload id"""

    def __init__(self):
        super().__init__()

    def get(self, request, uploadid):
        try:
            storage_bucket = settings.AWS_STORAGE_BUCKET_NAME
        except AttributeError:
            raise Exception(_("Django storages for AWS not configured"))

        parts = []
        key = request.GET.get("key", "")

        def get_parts(client, uploadId, partNumber):
            response = client.list_parts(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key, UploadId=uploadId, PartNumberMarker=partNumber)
            if "Parts" in response:
                parts = parts + response["Parts"]
            if response["IsTruncated"]:
                get_parts(client, uploadId, response["NextPartNumberMarker"])

        s3 = boto3.client("s3", config=self.config)
        get_parts(s3, uploadid, 0)
        return JsonResponse(parts, safe=False)

    def delete(self, request, uploadid):
        try:
            storage_bucket = settings.AWS_STORAGE_BUCKET_NAME
        except AttributeError:
            raise Exception(_("Django storages for AWS not configured"))

        s3 = boto3.client("s3", config=self.config)
        key = request.GET.get("key", "")

        s3.abort_multipart_upload(storage_bucket, key, uploadid)

        return JsonResponse({})


@method_decorator(can_edit_resource_instance, name="dispatch")
class S3BatchSignView(S3View):
    """generates a batch of presigned urls for a group of part numbers"""

    def __init__(self):
        super().__init__()

    def get(self, request, uploadid):
        try:
            storage_bucket = settings.AWS_STORAGE_BUCKET_NAME
        except AttributeError:
            raise Exception(_("Django storages for AWS not configured"))
        key = request.GET.get("key", "")
        part_numbers = [int(x) for x in request.GET.get("partNumbers").split(",")]
        s3 = boto3.client("s3", config=self.config)
        urls = {}
        urls["presignedUrls"] = [None] * part_numbers[0]
        for part in part_numbers:
            urls["presignedUrls"].append(
                s3.generate_presigned_url(
                    "upload_part",
                    {
                        "Key": key,
                        "Bucket": storage_bucket,
                        "PartNumber": int(part),
                        "Body": "",
                        "UploadId": uploadid,
                    },
                    300,
                )
            )
        return JsonResponse(urls, safe=False)


@method_decorator(can_edit_resource_instance, name="dispatch")
class S3UploadView(S3View):
    """Generates a single presigned URL to be used in a post to S3 (for small files)"""

    def __init__(self):
        super().__init__()

    def get(self, request):
        try:
            storage_bucket = settings.AWS_STORAGE_BUCKET_NAME
        except AttributeError:
            raise Exception(_("Django storages for AWS not configured"))
        s3 = boto3.client("s3", config=self.config)

        file_name = request.GET.get("filename")

        if file_name.startswith(KEY_BASE):
            key = file_name
        else:
            key = KEY_BASE + "/" + file_name

        fields = {}
        response = s3.generate_presigned_post(
            storage_bucket,
            key,
            fields,
            ExpiresIn=300,
        )
        return JsonResponse({"method": "post", "url": response["url"], "fields": response["fields"], "expires": 300}, safe=False)


@method_decorator(can_edit_resource_instance, name="dispatch")
class S3UploadPartView(S3View):
    """Generates a presigned URL for a single part of a multipart upload"""

    def __init__(self):
        super().__init__()

    def get(self, request, uploadid, partnumber):
        try:
            storage_bucket = settings.AWS_STORAGE_BUCKET_NAME
        except AttributeError:
            raise Exception(_("Django storages for AWS not configured"))
        s3 = boto3.client("s3", config=self.config)
        key = request.GET.get("key", "")
        url = s3.generate_presigned_url(
            "upload_part",
            {
                "Key": key,
                "Bucket": storage_bucket,
                "PartNumber": int(partnumber),
                "UploadId": uploadid,
            },
            300,
        )
        return JsonResponse({"url": url, "expires": 300}, safe=False)


@method_decorator(can_edit_resource_instance, name="dispatch")
class S3CompleteUploadView(S3View):
    """Finalizes a multipart upload in s3"""

    def __init__(self):
        super().__init__()

    def post(self, request, uploadid):
        try:
            storage_bucket = settings.AWS_STORAGE_BUCKET_NAME
        except AttributeError:
            raise Exception(_("Django storages for AWS not configured"))
        key = request.GET.get("key", "")
        s3 = boto3.client("s3", config=self.config)
        response = s3.complete_multipart_upload(
            Bucket=storage_bucket,
            Key=key,
            UploadId=uploadid,
            MultipartUpload={"Parts": json.loads(request.body.decode("utf-8"))["parts"]},
        )
        return JsonResponse({"location": response["Location"]})
