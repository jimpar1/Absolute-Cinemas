"""ASGI websocket routing for cinema app."""

from django.urls import re_path

from .consumers import ScreeningSeatConsumer


websocket_urlpatterns = [
    re_path(r'^ws/screenings/(?P<screening_id>\d+)/seats/$', ScreeningSeatConsumer.as_asgi()),
]
