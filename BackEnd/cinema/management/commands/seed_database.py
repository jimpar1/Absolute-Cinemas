import time

from django.core.management.base import BaseCommand
from cinema.models import MovieHall, HallPhoto, Movie
from cinema.tmdb_service import get_movie_details


class Command(BaseCommand):
    help = "Seed database with halls and movies (idempotent - safe to run multiple times)"

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

    HALL_PHOTOS = {
        'Αίθουσα 1': [
            ('halls/hall1/hall1.webp', 1),
            ('halls/hall1/hall1_2.webp', 2),
            ('halls/hall1/hall1_3.webp', 3),
        ],
        'Αίθουσα 2': [
            ('halls/hall3/hall3_1.webp', 1),
            ('halls/hall3/hall3_2.webp', 2),
            ('halls/hall3/hall3_3.webp', 3),
            ('halls/hall3/hall3_4.webp', 4),
            ('halls/hall3/hall3_5.webp', 5),
        ],
    }

    LEGENDARY_MOVIES = [
        (238, 'now_playing'),    # The Godfather
        (278, 'now_playing'),    # The Shawshank Redemption
        (155, 'now_playing'),    # The Dark Knight
        (680, 'now_playing'),    # Pulp Fiction
        (424, 'now_playing'),    # Schindler's List
        (157336, 'now_playing'), # Interstellar
        (27205, 'upcoming'),     # Inception
        (603, 'upcoming'),       # The Matrix
        (98, 'upcoming'),        # Gladiator
        (129, 'upcoming'),       # Spirited Away
    ]

    def _get_director(self, credits):
        crew = credits.get('crew', []) if isinstance(credits, dict) else []
        for member in crew:
            if member.get('job') == 'Director':
                return member.get('name', 'Unknown')
        return 'Unknown'

    def _import_movie(self, tmdb_id, status):
        details = get_movie_details(tmdb_id)
        if not details:
            self.stdout.write(self.style.ERROR(f"   ❌ TMDB ID {tmdb_id}: Could not fetch details."))
            return False

        title = details.get('title', '')
        if Movie.objects.filter(title=title).exists():
            self.stdout.write(self.style.WARNING(f"   ⏩ {title} already exists, skipping."))
            return True

        from decimal import Decimal
        movie_data = {
            'title': title,
            'description': details.get('overview', ''),
            'duration': details.get('runtime', 0) or 120,
            'genre': ', '.join([g['name'] for g in details.get('genres', [])]) or 'Unknown',
            'director': self._get_director(details.get('credits', {})),
            'release_year': int(details.get('release_date', '0000')[:4]) if details.get('release_date') else 2000,
            'rating': Decimal(str(round(details.get('vote_average', 0), 1))),
            'status': status,
            'poster_url': f"https://image.tmdb.org/t/p/w500{details.get('poster_path', '')}" if details.get('poster_path') else None,
        }

        videos = details.get('videos', {}).get('results', [])
        for video in videos:
            if video.get('type') == 'Trailer' and video.get('site') == 'YouTube':
                movie_data['trailer_url'] = f"https://www.youtube.com/watch?v={video['key']}"
                break

        images = details.get('images', {}).get('backdrops', [])
        shots = [f"https://image.tmdb.org/t/p/original{img['file_path']}" for img in images[:5]]
        movie_data['shots'] = shots if shots else None

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
        self.stdout.write(self.style.SUCCESS(f"   ✅ {title} ({movie_data['release_year']}) — {status}"))
        return True

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("\n🏛️  Creating cinema halls..."))
        halls_created = 0
        for hall_data in self.HALLS:
            name = hall_data.pop('name')
            hall, created = MovieHall.objects.get_or_create(name=name, defaults=hall_data)
            if created:
                self.stdout.write(self.style.SUCCESS(f"   ✅ {hall.name} — {hall.capacity} seats"))
                halls_created += 1
            else:
                self.stdout.write(self.style.WARNING(f"   ⏩ {hall.name} already exists, skipping."))

        self.stdout.write(self.style.SUCCESS("\n🖼️  Attaching hall photos..."))
        for hall_name, photos in self.HALL_PHOTOS.items():
            try:
                hall = MovieHall.objects.get(name=hall_name)
            except MovieHall.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"   ⚠️  Hall '{hall_name}' not found, skipping photos."))
                continue
            for path, order in photos:
                _, created = HallPhoto.objects.get_or_create(hall=hall, image=path, defaults={'order': order})
                if created:
                    self.stdout.write(self.style.SUCCESS(f"   ✅ {hall_name} — {path}"))
                else:
                    self.stdout.write(self.style.WARNING(f"   ⏩ {path} already exists, skipping."))

        self.stdout.write(self.style.SUCCESS("\n🎥 Importing legendary movies from TMDB..."))
        movies_imported = 0
        for tmdb_id, status in self.LEGENDARY_MOVIES:
            if self._import_movie(tmdb_id, status):
                movies_imported += 1
            time.sleep(0.3)

        self.stdout.write(self.style.SUCCESS(f"\n{'=' * 60}"))
        self.stdout.write(self.style.SUCCESS(f"🎉 Seed complete!"))
        self.stdout.write(self.style.SUCCESS(f"   Halls: {MovieHall.objects.count()} (new: {halls_created})"))
        self.stdout.write(self.style.SUCCESS(f"   Movies: {Movie.objects.count()} (new: {movies_imported})"))
        self.stdout.write(self.style.SUCCESS(f"{'=' * 60}"))
