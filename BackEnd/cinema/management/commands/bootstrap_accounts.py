import os

from django.contrib.auth.models import User
from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand
from django.contrib.contenttypes.models import ContentType


class Command(BaseCommand):
    help = "Create/update development admin + staff accounts (idempotent)."

    def _ensure_staff_group(self) -> Group:
        """Create/update a 'Cinema Staff' group with limited permissions."""
        group, _ = Group.objects.get_or_create(name="Cinema Staff")

        # Staff can manage core cinema data; bookings are viewable and updatable (status) but not deletable.
        desired = {
            "movie": ["add", "change", "delete", "view"],
            "moviehall": ["add", "change", "delete", "view"],
            "screening": ["add", "change", "delete", "view"],
            "booking": ["view", "change"],
        }

        perms: list[Permission] = []
        for model, actions in desired.items():
            ct = ContentType.objects.get(app_label="cinema", model=model)
            for action in actions:
                codename = f"{action}_{model}"
                perms.append(Permission.objects.get(content_type=ct, codename=codename))

        group.permissions.set(perms)
        return group

    def add_arguments(self, parser):
        parser.add_argument("--admin-username", default=os.environ.get("ADMIN_USERNAME", "admin"))
        parser.add_argument("--admin-email", default=os.environ.get("ADMIN_EMAIL", "admin@cinema.local"))
        parser.add_argument("--admin-password", default=os.environ.get("ADMIN_PASSWORD"))

        parser.add_argument("--staff-username", default=os.environ.get("STAFF_USERNAME", "staff"))
        parser.add_argument("--staff-email", default=os.environ.get("STAFF_EMAIL", "staff@cinema.local"))
        parser.add_argument("--staff-password", default=os.environ.get("STAFF_PASSWORD"))

    def handle(self, *args, **options):
        admin_password = options["admin_password"] or "Admin123!"
        # Per project convention, keep a simple default for local dev.
        staff_password = options["staff_password"] or "staff"

        staff_group = self._ensure_staff_group()

        admin_user, _ = User.objects.get_or_create(
            username=options["admin_username"],
            defaults={"email": options["admin_email"]},
        )
        admin_user.email = options["admin_email"]
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.set_password(admin_password)
        admin_user.save()

        staff_user, _ = User.objects.get_or_create(
            username=options["staff_username"],
            defaults={"email": options["staff_email"]},
        )
        staff_user.email = options["staff_email"]
        staff_user.is_staff = True
        staff_user.is_superuser = False
        staff_user.set_password(staff_password)
        staff_user.save()

        staff_user.groups.add(staff_group)

        if not options["admin_password"]:
            self.stdout.write(self.style.WARNING("ADMIN_PASSWORD not provided; using default Admin123!"))
        if not options["staff_password"]:
            self.stdout.write(self.style.WARNING("STAFF_PASSWORD not provided; using default staff"))

        self.stdout.write(
            self.style.SUCCESS(
                f"OK: admin='{admin_user.username}' (superuser), staff='{staff_user.username}' (is_staff)"
            )
        )
