from storages.backends.s3boto3 import S3Boto3Storage
from django.core.files.storage import Storage


class S3BackendReadOnlyStorage(S3Boto3Storage):
    def generate_filename(self, filename):
        return filename

    def save(self, name, content, max_length=None):
        if content.field_name.endswith("_preloaded"):
            return name
        else:
            return super().save(name, content, max_length)
