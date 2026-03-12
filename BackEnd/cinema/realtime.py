"""Realtime helpers for broadcasting screening seat state updates over Channels."""

from __future__ import annotations

from datetime import timedelta
from importlib import import_module
from typing import Any, TypedDict

from asgiref.sync import async_to_sync
from django.utils import timezone


class SeatStatePayload(TypedDict):
    type: str
    screening_id: int
    booked_seats: list[str]
    locked_seats: dict[str, str]
    timestamp: str


def _get_channel_layer() -> Any:
    """Resolve channel layer lazily to avoid static import issues in local tooling."""
    channels_layers = import_module("channels.layers")
    get_channel_layer_fn = getattr(channels_layers, "get_channel_layer")
    return get_channel_layer_fn()


def _screening_group_name(screening_id: int) -> str:
    return f"screening_{screening_id}_seats"


def build_screening_seat_state(screening_id: int) -> SeatStatePayload:
    """Build current booked/locked seat snapshot for one screening."""
    from .models import Booking, SeatLock

    booked_seats: list[str] = []
    bookings = Booking.objects.filter(screening_id=screening_id).exclude(seat_numbers="")
    for booking in bookings:
        booked_seats.extend([seat.strip() for seat in booking.seat_numbers.split(',') if seat.strip()])

    active_locks = SeatLock.objects.filter(
        screening_id=screening_id,
        created_at__gte=timezone.now() - timedelta(minutes=10),
    )
    locked_seats: dict[str, str] = {
        lock.seat_number: lock.session_id
        for lock in active_locks
    }

    return {
        'type': 'seats.state',
        'screening_id': screening_id,
        'booked_seats': sorted(set(booked_seats)),
        'locked_seats': locked_seats,
        'timestamp': timezone.now().isoformat(),
    }


def broadcast_screening_seat_state(screening_id: int) -> None:
    """Broadcast a screening seat snapshot to all connected websocket clients."""
    channel_layer = _get_channel_layer()
    if channel_layer is None:
        return

    payload = build_screening_seat_state(screening_id)
    group_send = channel_layer.group_send
    async_to_sync(group_send)(
        _screening_group_name(screening_id),
        {
            'type': 'seats_state_event',
            'payload': payload,
        },
    )


def screening_group_name(screening_id: int) -> str:
    """Public helper used by consumer routing."""
    return _screening_group_name(screening_id)
