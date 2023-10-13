
import json
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.utils.decorators import method_decorator
from arches.app.views.base import BaseManagerView
from arches.app.utils.decorators import can_edit_resource_instance
import boto3

KEY_BASE = settings.UPLOADED_FILES_DIR

@method_decorator(can_edit_resource_instance, name="dispatch")
class S3MultipartUploaderView(BaseManagerView):
    """S3 Multipart uploader chunks files to allow for parallel uploads to S3"""
    def options(self, request):
        response = HttpResponse()
        response.headers['access-control-allow-headers'] = 'x-csrftoken,accept,content-type,uppy-auth-token,location'
        return response
    
    def post(self, request):
        try:
            storage_bucket = settings.AWS_STORAGE_BUCKET_NAME
        except AttributeError:
            raise Exception("Django storages for AWS not configured")
        
        json_body = json.loads(request.body)
        file_name = json_body["filename"]
        if(file_name and file_name.startswith(KEY_BASE)):
            key = file_name
        else:
            key = KEY_BASE + file_name

        response_object = {}
        s3 = boto3.client("s3")
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
class S3MultipartUploadManagerView(BaseManagerView):
    """Returns all of the parts of a given upload id"""
    def get(self, request, uploadid):
        try:
            storage_bucket = settings.AWS_STORAGE_BUCKET_NAME
        except AttributeError:
            raise Exception("Django storages for AWS not configured")

        parts = []
        key = request.GET.get("key", "")

        def get_parts(client, uploadId, partNumber):
            response = client.list_parts(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key, UploadId=uploadId, PartNumberMarker=partNumber)
            if "Parts" in response:
                parts = parts + response["Parts"]
            if response["IsTruncated"]:
                get_parts(client, uploadId, response["NextPartNumberMarker"])

        s3 = boto3.client("s3")
        get_parts(s3, uploadid, 0)
        return JsonResponse(parts, safe=False)

    def delete(self, request, uploadid):
        try:
            storage_bucket = settings.AWS_STORAGE_BUCKET_NAME
        except AttributeError:
            raise Exception("Django storages for AWS not configured")
        

        s3 = boto3.client("s3")
        key = request.GET.get("key", "")

        s3.abort_multipart_upload(
            storage_bucket,
            key,
            uploadid
        )

        return JsonResponse({})

@method_decorator(can_edit_resource_instance, name="dispatch")
class S3BatchSignView(BaseManagerView):
    """generates a batch of presigned urls for a group of part numbers"""
    def get(self, request, uploadid):
        try:
            storage_bucket = settings.AWS_STORAGE_BUCKET_NAME
        except AttributeError:
            raise Exception("Django storages for AWS not configured")
        key = request.GET.get("key", "")
        part_numbers = [int(x) for x in request.GET.get("partNumbers").split(",")]
        s3 = boto3.client("s3")
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
class S3UploadView(BaseManagerView):
    """Generates a single presigned URL to be used in a post to S3 (for small files)"""
    def get(self, request):
        try:
            storage_bucket = settings.AWS_STORAGE_BUCKET_NAME
        except AttributeError:
            raise Exception("Django storages for AWS not configured")
        s3 = boto3.client("s3")

        file_name = request.GET.get("filename")

        if(file_name.startswith(KEY_BASE)):
            key = file_name
        else:
            key = KEY_BASE + "/" + file_name

        fields={}
        response = s3.generate_presigned_post(
            storage_bucket,
            key,
            fields,
            ExpiresIn=300,
        )
        return JsonResponse({
            'method': 'post',
            'url': response['url'],
            'fields': response['fields'],
            'expires': 300
        }, safe=False)

@method_decorator(can_edit_resource_instance, name="dispatch")
class S3UploadPartView(BaseManagerView):
    """Generates a presigned URL for a single part of a multipart upload"""
    def get(self, request, uploadid, partnumber):
        try:
            storage_bucket = settings.AWS_STORAGE_BUCKET_NAME
        except AttributeError:
            raise Exception("Django storages for AWS not configured")
        s3 = boto3.client("s3")
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
        return JsonResponse({'url': url, 'expires': 300}, safe=False)


@method_decorator(can_edit_resource_instance, name="dispatch")
class S3CompleteUploadView(BaseManagerView):
    """Finalizes a multipart upload in s3"""
    def post(self, request, uploadid):
        try:
            storage_bucket = settings.AWS_STORAGE_BUCKET_NAME
        except AttributeError:
            raise Exception("Django storages for AWS not configured")
        key = request.GET.get("key", "")
        s3 = boto3.client("s3")
        response = s3.complete_multipart_upload(
            Bucket=storage_bucket,
            Key=key,
            UploadId=uploadid,
            MultipartUpload={"Parts": json.loads(request.body.decode("utf-8"))["parts"]},
        )
        return JsonResponse({"location": response["Location"]})