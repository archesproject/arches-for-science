
import json
from django.conf import settings
from django.http import Http404, JsonResponse
from django.utils.decorators import method_decorator
from asgiref.sync import async_to_sync, sync_to_async
import asyncio
from arches.app.views.base import BaseManagerView
from arches.app.utils.decorators import can_edit_resource_instance
import boto3

KEY_BASE = "uploadedfiles/"

@method_decorator(can_edit_resource_instance, name="dispatch")
class S3MultipartUploaderView(BaseManagerView):
    """doom"""
    def post(self, request):
        json_body = json.loads(request.body)
        response_object = {}
        s3 = boto3.client('s3')
        resp = s3.create_multipart_upload(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME, 
            Key=KEY_BASE + json_body['filename'],
            ContentType=json_body['type'],
            Metadata=json_body['metadata']
        )
        response_object["key"] = resp["Key"]
        response_object["uploadId"] = resp["UploadId"]
        return JsonResponse(response_object)

@method_decorator(can_edit_resource_instance, name="dispatch")
class S3MultipartUploadManagerView(BaseManagerView):
    """doom"""
    def get(self, request, uploadid):
        parts = []
        key = request.GET.get('key', '')
        def get_parts(client, uploadId, partNumber):
            response =  client.list_parts(
                Bucket = settings.AWS_STORAGE_BUCKET_NAME,
                Key = key,
                UploadId = uploadId,
                PartNumberMarker = partNumber
            )
            if("Parts" in response):
                parts = parts + response["Parts"]
            if(response["IsTruncated"]):
                get_parts(client, uploadId, response["NextPartNumberMarker"])

        s3 = boto3.client('s3')
        get_parts(s3, uploadid, 0)
        return JsonResponse(parts, safe=False)
    
    def delete(self, request):
        """post"""
        
        return JsonResponse({})


def batch_sign(request, uploadid):
    if request.method == "GET":
        key = request.GET.get('key', '')
        part_numbers = [int(x) for x in request.GET.get('partNumbers').split(',')]
        s3 = boto3.client('s3')
        urls = {}
        urls["presignedUrls"] = [None]* part_numbers[0]
        for part in part_numbers:
            urls["presignedUrls"].append(s3.generate_presigned_url(
                'upload_part',
                {
                    'Key': key,
                    'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                    'PartNumber': int(part),
                    'Body': '',
                    'UploadId': uploadid,
                },
                300
            ))
        return JsonResponse(urls, safe=False)
    else:
        raise Http404

def upload_part(request, uploadid, partnumber):
    if request.method == "GET":
        s3 = boto3.client('s3')
        key = request.GET.get('key', '')
        url = s3.generate_presigned_url(
            'upload_part',
            {
                'Key': key,
                'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                'PartNumber': int(partnumber),
                'UploadId': uploadid,
            },
            300
        )
        return JsonResponse(url, safe=False)
    else:
        raise Http404

def complete_upload(request, uploadid):
    if request.method == "POST":
        key = request.GET.get('key', '')
        s3 = boto3.client('s3')
        response = s3.complete_multipart_upload(
            Bucket = settings.AWS_STORAGE_BUCKET_NAME,
            Key = key,
            UploadId = uploadid,
            MultipartUpload = {
                'Parts': json.loads(request.body.decode('utf-8'))["parts"]
            }
        )
        return JsonResponse({"location": response["Location"]})
    else:
        raise Http404