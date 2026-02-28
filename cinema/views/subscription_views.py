"""
SubscriptionView — GET and POST endpoints for the current user's CinemaPass subscription.

GET  /api/me/subscription/ — returns tier info and weekly usage
POST /api/me/subscription/ — body { "tier": "pro" } → subscribes, returns updated info
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from dependency_injector.wiring import inject, Provide

from ..container import Container
from ..services import SubscriptionService
from ..services.subscription_service import TIER_CONFIG


class SubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    @inject
    def get(self, request,
            subscription_service: SubscriptionService = Provide[Container.subscription_service]):
        sub = subscription_service.get_or_create(request.user)
        cfg = TIER_CONFIG.get(sub.tier, TIER_CONFIG['free'])
        remaining = max(0, cfg['weekly_free'] - sub.free_tickets_used)
        return Response({
            'tier':                  sub.tier,
            'expires_at':            sub.expires_at,
            'weekly_free_total':     cfg['weekly_free'],
            'free_tickets_used':     sub.free_tickets_used,
            'free_tickets_remaining': remaining,
            'discount_rate':         cfg['discount'],
        })

    @inject
    def post(self, request,
             subscription_service: SubscriptionService = Provide[Container.subscription_service]):
        tier = request.data.get('tier', 'free')
        if tier not in ('free', 'pro', 'ultra'):
            return Response({'error': 'Invalid tier. Choose free, pro, or ultra.'}, status=400)
        sub = subscription_service.subscribe(request.user, tier)
        cfg = TIER_CONFIG.get(sub.tier, TIER_CONFIG['free'])
        remaining = max(0, cfg['weekly_free'] - sub.free_tickets_used)
        return Response({
            'tier':                  sub.tier,
            'expires_at':            sub.expires_at,
            'weekly_free_total':     cfg['weekly_free'],
            'free_tickets_used':     sub.free_tickets_used,
            'free_tickets_remaining': remaining,
            'discount_rate':         cfg['discount'],
        })
