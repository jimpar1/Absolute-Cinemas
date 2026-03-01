"""Tests for bootstrap_accounts management command."""

import pytest
from io import StringIO
from django.core.management import call_command
from django.contrib.auth.models import User, Group


@pytest.mark.django_db
class TestBootstrapAccountsCommand:
    """Tests for the bootstrap_accounts command."""

    def test_command_creates_admin_user(self):
        """Test bootstrap_accounts creates admin superuser."""
        assert not User.objects.filter(username='admin').exists()

        call_command('bootstrap_accounts')

        admin = User.objects.get(username='admin')
        assert admin.is_superuser
        assert admin.is_staff
        assert admin.email == 'admin@cinema.local'

    def test_command_creates_staff_user(self):
        """Test bootstrap_accounts creates staff user."""
        assert not User.objects.filter(username='staff').exists()

        call_command('bootstrap_accounts')

        staff = User.objects.get(username='staff')
        assert not staff.is_superuser
        assert staff.is_staff
        assert staff.email == 'staff@cinema.local'

    def test_command_creates_cinema_staff_group(self):
        """Test bootstrap_accounts creates Cinema Staff group."""
        assert not Group.objects.filter(name='Cinema Staff').exists()

        call_command('bootstrap_accounts')

        group = Group.objects.get(name='Cinema Staff')
        assert group is not None

        # Verify permissions were set
        perms = group.permissions.all()
        assert perms.count() > 0

        # Check for specific permissions
        perm_codenames = set(p.codename for p in perms)
        assert 'view_movie' in perm_codenames
        assert 'add_movie' in perm_codenames
        assert 'change_screening' in perm_codenames
        assert 'view_booking' in perm_codenames
        assert 'change_booking' in perm_codenames

    def test_command_assigns_staff_to_cinema_staff_group(self):
        """Test staff user is assigned to Cinema Staff group."""
        call_command('bootstrap_accounts')

        staff = User.objects.get(username='staff')
        groups = staff.groups.all()

        assert groups.count() >= 1
        assert Group.objects.get(name='Cinema Staff') in groups

    def test_command_is_idempotent(self):
        """Test running command twice doesn't duplicate data."""
        # Run first time
        call_command('bootstrap_accounts')
        initial_admin_count = User.objects.filter(username='admin').count()
        initial_staff_count = User.objects.filter(username='staff').count()
        initial_group_count = Group.objects.filter(name='Cinema Staff').count()

        # Run second time
        call_command('bootstrap_accounts')

        # Counts should remain the same
        assert User.objects.filter(username='admin').count() == initial_admin_count
        assert User.objects.filter(username='staff').count() == initial_staff_count
        assert Group.objects.filter(name='Cinema Staff').count() == initial_group_count

    def test_command_updates_existing_admin_email(self):
        """Test command updates existing admin user's email."""
        # Create admin with old email
        User.objects.create_user(
            username='admin',
            email='old@example.com',
            password='oldpass'
        )

        # Run command
        call_command('bootstrap_accounts')

        admin = User.objects.get(username='admin')
        assert admin.email == 'admin@cinema.local'

    def test_command_updates_existing_admin_to_superuser(self):
        """Test command promotes existing admin to superuser."""
        # Create non-superuser admin
        User.objects.create_user(
            username='admin',
            email='admin@cinema.local',
            password='pass',
            is_staff=False,
            is_superuser=False
        )

        call_command('bootstrap_accounts')

        admin = User.objects.get(username='admin')
        assert admin.is_superuser
        assert admin.is_staff

    def test_command_with_custom_admin_username(self):
        """Test command with --admin-username argument."""
        call_command('bootstrap_accounts', '--admin-username=myadmin')

        admin = User.objects.get(username='myadmin')
        assert admin.is_superuser

    def test_command_with_custom_admin_email(self):
        """Test command with --admin-email argument."""
        call_command('bootstrap_accounts', '--admin-email=custom@example.com')

        admin = User.objects.get(username='admin')
        assert admin.email == 'custom@example.com'

    def test_command_with_custom_staff_username(self):
        """Test command with --staff-username argument."""
        call_command('bootstrap_accounts', '--staff-username=mystaff')

        staff = User.objects.get(username='mystaff')
        assert staff.is_staff
        assert not staff.is_superuser

    def test_command_with_custom_staff_email(self):
        """Test command with --staff-email argument."""
        call_command('bootstrap_accounts', '--staff-email=staffuser@example.com')

        staff = User.objects.get(username='staff')
        assert staff.email == 'staffuser@example.com'

    def test_command_sets_admin_password(self):
        """Test command sets admin password correctly."""
        call_command('bootstrap_accounts', '--admin-password=TestPassword123')

        admin = User.objects.get(username='admin')
        assert admin.check_password('TestPassword123')

    def test_command_sets_staff_password(self):
        """Test command sets staff password correctly."""
        call_command('bootstrap_accounts', '--staff-password=StaffPass456')

        staff = User.objects.get(username='staff')
        assert staff.check_password('StaffPass456')

    def test_command_uses_default_admin_password_when_not_provided(self):
        """Test command uses default admin password when not provided."""
        call_command('bootstrap_accounts')

        admin = User.objects.get(username='admin')
        assert admin.check_password('Admin123!')

    def test_command_uses_default_staff_password_when_not_provided(self):
        """Test command uses default staff password when not provided."""
        call_command('bootstrap_accounts')

        staff = User.objects.get(username='staff')
        assert staff.check_password('staff')

    def test_command_output_shows_success_message(self):
        """Test command outputs success message."""
        out = StringIO()
        call_command('bootstrap_accounts', stdout=out)

        output = out.getvalue()
        assert 'OK' in output
        assert 'admin' in output
        assert 'staff' in output
        assert 'superuser' in output

    def test_command_output_warns_about_default_passwords(self):
        """Test command warns when using default passwords."""
        out = StringIO()
        call_command('bootstrap_accounts', stdout=out)

        output = out.getvalue()
        # Should contain warnings about default passwords
        assert 'ADMIN_PASSWORD' in output or 'Admin123!' in output
        assert 'STAFF_PASSWORD' in output or 'default staff' in output

    def test_cinema_staff_group_permissions_are_correct(self):
        """Test Cinema Staff group has correct permissions."""
        call_command('bootstrap_accounts')

        group = Group.objects.get(name='Cinema Staff')
        perm_codenames = set(p.codename for p in group.permissions.all())

        # Movie permissions (full CRUD)
        assert 'add_movie' in perm_codenames
        assert 'change_movie' in perm_codenames
        assert 'delete_movie' in perm_codenames
        assert 'view_movie' in perm_codenames

        # MovieHall permissions (full CRUD)
        assert 'add_moviehall' in perm_codenames
        assert 'change_moviehall' in perm_codenames
        assert 'delete_moviehall' in perm_codenames
        assert 'view_moviehall' in perm_codenames

        # Screening permissions (full CRUD)
        assert 'add_screening' in perm_codenames
        assert 'change_screening' in perm_codenames
        assert 'delete_screening' in perm_codenames
        assert 'view_screening' in perm_codenames

        # Booking permissions (view and change only, no add/delete)
        assert 'view_booking' in perm_codenames
        assert 'change_booking' in perm_codenames
        assert 'add_booking' not in perm_codenames  # Staff should not create bookings
        assert 'delete_booking' not in perm_codenames  # Staff should not delete bookings
