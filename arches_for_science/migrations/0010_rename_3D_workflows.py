from django.db import migrations
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("arches_for_science", "0009_add_pottery_object_type"),
    ]

    def forward(apps, schema_editor):
        Plugin = apps.get_model("models", "Plugin")
        image_upload_workflow = Plugin.objects.get(pk=uuid.UUID("c206cfc6-6b4a-481e-a018-8da72aeb7074"))
        image_upload_workflow.name = '{"en": "Chemical Imaging 3D Data Upload"}'
        image_upload_workflow.save()

        image_stack_workflow = Plugin.objects.get(pk=uuid.UUID("af06e949-5e16-49f0-b23e-e8529e8ce321"))
        image_stack_workflow.name = '{"en": "Chemical Image Stack Upload"}'
        image_stack_workflow.save()

    def reverse(apps, schema_editor):
        Plugin = apps.get_model("models", "Plugin")
        image_upload_workflow = Plugin.objects.get(pk=uuid.UUID("c206cfc6-6b4a-481e-a018-8da72aeb7074"))
        image_upload_workflow.name = '{"en": "Chemical Analysis Data Upload"}'
        image_upload_workflow.save()

        image_stack_workflow = Plugin.objects.get(pk=uuid.UUID("af06e949-5e16-49f0-b23e-e8529e8ce321"))
        image_stack_workflow.name = '{"en": "Add Chemical Analysis Images"}'
        image_stack_workflow.save()

    operations = [migrations.RunPython(forward, reverse)]
