"""
ARCHES - a program developed to inventory and manage immovable cultural heritage.
Copyright (C) 2013 J. Paul Getty Trust and World Monuments Fund

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
"""

from arches.app.models.system_settings import settings


def project_settings(request):
    cloud_storage_enabled = (
        settings.DEFAULT_FILE_STORAGE == "storages.backends.s3boto3.S3Boto3Storage"
    )  # add additional supported formats as needed
    return {"project_settings": {"FORMATS": settings.FORMATS, "CLOUD_STORAGE_ENABLED": "true" if cloud_storage_enabled else "false"}}
