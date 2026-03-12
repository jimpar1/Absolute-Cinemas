"""WebSocket consumers for realtime seat updates."""

from __future__ import annotations

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .realtime import build_screening_seat_state, screening_group_name


class ScreeningSeatConsumer(AsyncJsonWebsocketConsumer):
    """Pushes booked/locked seat snapshots for one screening in real time."""

    async def connect(self):
        try:
            self.screening_id = int(self.scope['url_route']['kwargs']['screening_id'])
        except (KeyError, TypeError, ValueError):
            await self.close(code=4400)
            return

        self.group_name = screening_group_name(self.screening_id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        initial_state = await database_sync_to_async(build_screening_seat_state)(self.screening_id)
        await self.send_json(initial_state)

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def seats_state_event(self, event):
        await self.send_json(event['payload'])
