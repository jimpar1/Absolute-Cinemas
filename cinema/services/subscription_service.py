"""
SubscriptionService — pricing and weekly free-ticket logic for CinemaPass tiers.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from django.utils import timezone

TIER_CONFIG = {
    'free':  {'weekly_free': 0, 'discount': 0.00},
    'pro':   {'weekly_free': 2, 'discount': 0.30},
    'ultra': {'weekly_free': 4, 'discount': 0.50},
}


@dataclass(frozen=True)
class SubscriptionService:
    repo: object

    def get_or_create(self, user):
        return self.repo.get_or_create_free(user)

    def _maybe_reset_week(self, sub):
        from ..models.subscription import _this_monday
        current_monday = _this_monday()
        if sub.week_start < current_monday:
            sub.free_tickets_used = 0
            sub.week_start = current_monday
            sub.save(update_fields=['free_tickets_used', 'week_start'])

    def compute_booking_price(self, sub, seats_count, ticket_price):
        """
        Returns a dict with:
          total, free_seats, paid_seats, discount_rate
        """
        self._maybe_reset_week(sub)
        cfg = TIER_CONFIG.get(sub.tier, TIER_CONFIG['free'])
        weekly_free = cfg['weekly_free']
        discount    = cfg['discount']
        remaining   = max(0, weekly_free - sub.free_tickets_used)
        free_count  = min(remaining, seats_count)
        paid_count  = seats_count - free_count
        total       = paid_count * float(ticket_price) * (1 - discount)
        return {
            'total':         round(total, 2),
            'free_seats':    free_count,
            'paid_seats':    paid_count,
            'discount_rate': discount,
        }

    def consume_free_tickets(self, sub, count):
        self._maybe_reset_week(sub)
        if count > 0:
            sub.free_tickets_used += count
            sub.save(update_fields=['free_tickets_used'])

    def subscribe(self, user, tier):
        sub = self.get_or_create(user)
        sub.tier = tier
        sub.expires_at = timezone.now() + timedelta(days=30) if tier != 'free' else None
        sub.save()
        return sub
