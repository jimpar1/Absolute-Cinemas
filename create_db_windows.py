"""
Cinema Database Setup Script — Windows
Uses PyMySQL as the MySQL driver.

Run:
    python create_db_windows.py
"""

import os
import sys
import time

# =============================================================================
# MySQL Driver: PyMySQL (pure Python, works on Windows without C compiler)
# =============================================================================

import pymysql
pymysql.install_as_MySQLdb()
pymysql.version_info = (2, 2, 1, "final", 0)  # Satisfy Django 5 version check
import MySQLdb  # type: ignore[import-not-found]

# =============================================================================
# STEP 1: Create MySQL Database
# =============================================================================

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
DB_PORT = int(os.environ.get('DB_PORT', '3306'))
DB_NAME = os.environ.get('DB_NAME', 'cinema_db')

print("=" * 60)
print("🎬 ABSOLUTE CINEMA — Database Setup (Windows)")
print("=" * 60)

try:
    connection = MySQLdb.connect(
        host=DB_HOST, user=DB_USER, password=DB_PASSWORD, port=DB_PORT
    )
    cursor = connection.cursor()

    cursor.execute(f"DROP DATABASE IF EXISTS {DB_NAME}")
    print(f"🗑️  Dropped database '{DB_NAME}' (if existed).")
    cursor.execute(f"CREATE DATABASE {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    print(f"✅ Database '{DB_NAME}' created.")

    cursor.close()
    connection.close()
except MySQLdb.Error as e:
    print(f"❌ Database error: {e}")
    sys.exit(1)

# =============================================================================
# STEP 2: Setup Django & Run Migrations
# =============================================================================

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cinema_backend.settings')

import django
django.setup()

from django.core.management import call_command

print("\n📦 Running migrations...")
call_command('migrate', verbosity=0)
print("✅ Migrations applied.")

# =============================================================================
# STEP 3: Create Users (Admin + Regular)
# =============================================================================

from django.contrib.auth.models import User
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from cinema.models import Customer

print("\n👤 Creating users...")

# Admin superuser
if not User.objects.filter(username='admin').exists():
    admin_user = User.objects.create_superuser(
        username='admin',
        email='admin@absolutecinema.gr',
        password='admin',
        first_name='Admin',
        last_name='User'
    )
    print(f"   ✅ Superuser: admin / admin")
else:
    print(f"   ⏩ Superuser 'admin' already exists, skipping.")

# Regular user
if not User.objects.filter(username='user').exists():
    regular_user = User.objects.create_user(
        username='user',
        email='user@absolutecinema.gr',
        password='user',
        first_name='Γιώργος',
        last_name='Παπαδόπουλος'
    )
    Customer.objects.get_or_create(user=regular_user, defaults={'phone': '6912345678'})
    print(f"   ✅ Regular user: user / user")
else:
    print(f"   ⏩ User 'user' already exists, skipping.")

# Staff user (limited admin access via group permissions)
if not User.objects.filter(username='staff').exists():
    staff_user = User.objects.create_user(
        username='staff',
        email='staff@absolutecinema.gr',
        password='staff',
        first_name='Staff',
        last_name='User'
    )
    staff_user.is_staff = True
    staff_user.is_superuser = False
    staff_user.save()

    staff_group, _ = Group.objects.get_or_create(name='Cinema Staff')
    desired = {
        'movie': ['add', 'change', 'delete', 'view'],
        'moviehall': ['add', 'change', 'delete', 'view'],
        'screening': ['add', 'change', 'delete', 'view'],
        'booking': ['view', 'change'],
    }
    perms = []
    for model, actions in desired.items():
        ct = ContentType.objects.get(app_label='cinema', model=model)
        for action in actions:
            perms.append(Permission.objects.get(content_type=ct, codename=f'{action}_{model}'))
    staff_group.permissions.set(perms)
    staff_user.groups.add(staff_group)

    print(f"   ✅ Staff user: staff / staff (limited via 'Cinema Staff' group)")
else:
    print(f"   ⏩ User 'staff' already exists, skipping.")

# =============================================================================
# STEP 4: Create Cinema Halls
# =============================================================================

from cinema.models import MovieHall

HALLS = [
    {
        'name': 'Αίθουσα 1',
        'left_section_capacity': 15,
        'middle_section_capacity': 50,
        'right_section_capacity': 15,
        'balcony_left_capacity': 0,
        'balcony_middle_capacity': 24,
        'balcony_right_capacity': 0,
        'left_seats_per_row': 3,
        'middle_seats_per_row': 10,
        'right_seats_per_row': 3,
    },
    {
        'name': 'Αίθουσα 2',
        'left_section_capacity': 10,
        'middle_section_capacity': 60,
        'right_section_capacity': 10,
        'balcony_left_capacity': 0,
        'balcony_middle_capacity': 0,
        'balcony_right_capacity': 0,
        'left_seats_per_row': 2,
        'middle_seats_per_row': 12,
        'right_seats_per_row': 2,
    },
    {
        'name': 'Αίθουσα 3',
        'left_section_capacity': 20,
        'middle_section_capacity': 40,
        'right_section_capacity': 20,
        'balcony_left_capacity': 0,
        'balcony_middle_capacity': 16,
        'balcony_right_capacity': 0,
        'left_seats_per_row': 4,
        'middle_seats_per_row': 8,
        'right_seats_per_row': 4,
    },
]

print("\n🏛️  Creating cinema halls...")
for hall_data in HALLS:
    name = hall_data.pop('name')
    hall, created = MovieHall.objects.get_or_create(name=name, defaults=hall_data)
    if created:
        print(f"   ✅ {hall.name} — {hall.capacity} seats")
    else:
        print(f"   ⏩ {hall.name} already exists, skipping.")

# =============================================================================
# STEP 4b: Attach hall photos
# =============================================================================

from cinema.models import HallPhoto

HALL_PHOTOS = {
    'Αίθουσα 1': [
        ('halls/hall1/hall1.webp',   1),
        ('halls/hall1/hall1_2.webp', 2),
        ('halls/hall1/hall1_3.webp', 3),
    ],
    'Αίθουσα 2': [
        ('halls/hall2/hall2_2.webp', 1),
        ('halls/hall2/hall2_3.webp', 2),
        ('halls/hall2/hall2_4.webp', 3),
    ],
    'Αίθουσα 3': [
        ('halls/hall3/hall3_1.webp', 1),
        ('halls/hall3/hall3_2.webp', 2),
        ('halls/hall3/hall3_3.webp', 3),
        ('halls/hall3/hall3_4.webp', 4),
        ('halls/hall3/hall3_5.webp', 5),
    ],
}

print("\n🖼️  Attaching hall photos...")
for hall_name, photos in HALL_PHOTOS.items():
    try:
        hall = MovieHall.objects.get(name=hall_name)
    except MovieHall.DoesNotExist:
        print(f"   ⚠️  Hall '{hall_name}' not found, skipping photos.")
        continue
    for path, order in photos:
        _, created = HallPhoto.objects.get_or_create(hall=hall, image=path, defaults={'order': order})
        if created:
            print(f"   ✅ {hall_name} — {path}")
        else:
            print(f"   ⏩ {path} already exists, skipping.")

# =============================================================================
# STEP 5: Import Legendary Movies from TMDB
# =============================================================================

from cinema.models import Movie
from cinema.tmdb_service import get_movie_details
from decimal import Decimal

# (TMDB ID, desired status)
LEGENDARY_MOVIES = [
    (238,    'now_playing'),   # The Godfather — Crime/Drama
    (278,    'now_playing'),   # The Shawshank Redemption — Drama
    (155,    'now_playing'),   # The Dark Knight — Action
    (680,    'now_playing'),   # Pulp Fiction — Crime
    (424,    'now_playing'),   # Schindler's List — Drama/History
    (157336, 'now_playing'),   # Interstellar — Sci-Fi
    (27205,  'upcoming'),      # Inception — Sci-Fi/Action
    (603,    'upcoming'),      # The Matrix — Sci-Fi/Action
    (98,     'upcoming'),      # Gladiator — Action/Drama
    (129,    'upcoming'),      # Spirited Away — Animation
]


def _get_director(credits):
    """Extract director name from TMDB credits."""
    crew = credits.get('crew', []) if isinstance(credits, dict) else []
    for member in crew:
        if member.get('job') == 'Director':
            return member.get('name', 'Unknown')
    return 'Unknown'


def import_movie(tmdb_id, status):
    """Import a single movie from TMDB by ID."""
    details = get_movie_details(tmdb_id)
    if not details:
        print(f"   ❌ TMDB ID {tmdb_id}: Could not fetch details.")
        return False

    title = details.get('title', '')
    if Movie.objects.filter(title=title).exists():
        print(f"   ⏩ {title} already exists, skipping.")
        return True

    # Build movie data (same logic as admin add_from_tmdb_view)
    movie_data = {
        'title': title,
        'description': details.get('overview', ''),
        'duration': details.get('runtime', 0) or 120,
        'genre': ', '.join([g['name'] for g in details.get('genres', [])]) or 'Unknown',
        'director': _get_director(details.get('credits', {})),
        'release_year': int(details.get('release_date', '0000')[:4]) if details.get('release_date') else 2000,
        'rating': Decimal(str(round(details.get('vote_average', 0), 1))),
        'status': status,
        'poster_url': f"https://image.tmdb.org/t/p/w500{details.get('poster_path', '')}" if details.get('poster_path') else None,
    }

    # Trailer
    videos = details.get('videos', {}).get('results', [])
    for video in videos:
        if video.get('type') == 'Trailer' and video.get('site') == 'YouTube':
            movie_data['trailer_url'] = f"https://www.youtube.com/watch?v={video['key']}"
            break

    # Scene shots
    images = details.get('images', {}).get('backdrops', [])
    shots = [f"https://image.tmdb.org/t/p/original{img['file_path']}" for img in images[:5]]
    movie_data['shots'] = shots if shots else None

    # Actors
    cast = details.get('credits', {}).get('cast', [])
    actors = [
        {
            'name': a['name'],
            'character': a.get('character', ''),
            'profile_path': f"https://image.tmdb.org/t/p/w500{a['profile_path']}" if a.get('profile_path') else None
        }
        for a in cast[:10]
    ]
    movie_data['actors'] = actors if actors else None

    Movie.objects.create(**movie_data)
    print(f"   ✅ {title} ({movie_data['release_year']}) — {status}")
    return True


print("\n🎥 Importing legendary movies from TMDB...")
success = 0
for tmdb_id, status in LEGENDARY_MOVIES:
    if import_movie(tmdb_id, status):
        success += 1
    time.sleep(0.3)  # Be kind to TMDB API

print(f"\n{'=' * 60}")
print(f"🎉 Setup complete!")
print(f"   Users: {User.objects.count()} (admin + regular)")
print(f"   Halls: {MovieHall.objects.count()}")
print(f"   Movies: {Movie.objects.count()} ({success} imported)")
print(f"{'=' * 60}")
