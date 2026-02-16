from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsStaffWithModelPermsOrReadOnly(BasePermission):
    """Allow read-only access to everyone; write access only to staff users with model permissions.

    This makes the API align with Django Groups/Permissions (e.g. the "Cinema Staff" group)
    rather than relying solely on the boolean `is_staff`.
    """

    def _get_model(self, view):
        serializer_class = getattr(view, 'serializer_class', None)
        meta = getattr(serializer_class, 'Meta', None) if serializer_class else None
        model = getattr(meta, 'model', None) if meta else None
        if model is not None:
            return model

        queryset = getattr(view, 'queryset', None)
        if queryset is not None:
            return getattr(queryset, 'model', None)
        return None

    def _required_action(self, request, view):
        if request.method in ('PUT', 'PATCH'):
            return 'change'
        if request.method == 'DELETE':
            return 'delete'
        if request.method == 'POST':
            # POST /resource/ (create) => add
            # POST /resource/{id}/custom_action/ => usually changes existing => change
            action = getattr(view, 'action', None)
            if action == 'create':
                return 'add'
            if getattr(view, 'kwargs', {}).get('pk') is not None:
                return 'change'
            return 'add'
        return None

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        if not getattr(user, 'is_staff', False):
            return False

        model = self._get_model(view)
        if model is None:
            return False

        action = self._required_action(request, view)
        if action is None:
            return False

        perm = f"{model._meta.app_label}.{action}_{model._meta.model_name}"
        return bool(user.has_perm(perm))


class IsStaffWithBookingViewPermission(BasePermission):
    """Allow only authenticated staff users that can view bookings."""

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        if not getattr(user, 'is_staff', False):
            return False
        return bool(user.has_perm('cinema.view_booking'))
