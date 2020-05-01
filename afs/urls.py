from django.conf.urls import include, url
from django.conf import settings
from django.conf.urls.static import static
from arches.app.views.plugin import PluginView

urlpatterns = [
    url(r'^', include('arches.urls')),
    url(r'^/plugins/project-workflow', PluginView.as_view(), name='project-workflow'),
    url(r'^/plugins/init-workflow', PluginView.as_view(), name='init-workflow'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
