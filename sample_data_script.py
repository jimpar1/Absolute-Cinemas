"""
Παράδειγμα Script για Εισαγωγή Δεδομένων Πελατών
Example Script for Importing Customer Booking Data

Χρησιμοποίησε αυτό το script για να προσθέσεις δεδομένα στη MySQL database.
Use this script to add sample data to the MySQL database.

Εκτέλεση / Run:
    python sample_data_script.py
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cinema_backend.settings')
django.setup()

from cinema.models import Movie, MovieHall, Screening, Booking
from datetime import datetime, timedelta
from django.utils import timezone


def create_sample_bookings():
    """
    Δημιουργεί δείγμα κρατήσεων με στοιχεία πελατών
    Creates sample bookings with customer data
    """
    
    print("🎬 Δημιουργία δείγματος δεδομένων...")
    print("Creating sample data...\n")
    
    # Έλεγχος αν υπάρχουν ταινίες και προβολές
    movies = Movie.objects.all()
    screenings = Screening.objects.all()
    
    if not movies.exists():
        print("⚠️  Δεν υπάρχουν ταινίες. Δημιούργησε πρώτα ταινίες!")
        print("No movies found. Please create movies first!")
        return
    
    if not screenings.exists():
        print("⚠️  Δεν υπάρχουν προβολές. Δημιούργησε πρώτα προβολές!")
        print("No screenings found. Please create screenings first!")
        return
    
    # Παραδείγματα κρατήσεων
    sample_bookings = [
        {
            'screening': screenings[0],
            'customer_name': 'Γιώργος Παπαδόπουλος',
            'customer_email': 'george.p@example.com',
            'customer_phone': '6912345678',
            'seats_booked': 2,
            'seat_numbers': 'A5, A6',
            'status': 'confirmed'
        },
        {
            'screening': screenings[0],
            'customer_name': 'Μαρία Κωνσταντίνου',
            'customer_email': 'maria.k@example.com',
            'customer_phone': '6987654321',
            'seats_booked': 3,
            'seat_numbers': 'B10, B11, B12',
            'status': 'confirmed'
        },
        {
            'screening': screenings[0] if len(screenings) > 0 else None,
            'customer_name': 'Νίκος Ιωαννίδης',
            'customer_email': 'nikos.i@example.com',
            'customer_phone': '6945678901',
            'seats_booked': 1,
            'seat_numbers': 'C15',
            'status': 'pending'
        },
        {
            'screening': screenings[1] if len(screenings) > 1 else screenings[0],
            'customer_name': 'Ελένη Δημητρίου',
            'customer_email': 'eleni.d@example.com',
            'customer_phone': '6923456789',
            'seats_booked': 4,
            'seat_numbers': 'D1, D2, D3, D4',
            'status': 'confirmed'
        },
        {
            'screening': screenings[1] if len(screenings) > 1 else screenings[0],
            'customer_name': 'Κώστας Αντωνίου',
            'customer_email': 'kostas.a@example.com',
            'customer_phone': '',  # Χωρίς τηλέφωνο
            'seats_booked': 2,
            'seat_numbers': 'E8, E9',
            'status': 'confirmed'
        },
    ]
    
    # Δημιουργία κρατήσεων
    created_count = 0
    for booking_data in sample_bookings:
        try:
            booking = Booking.objects.create(**booking_data)
            created_count += 1
            print(f"✅ Κράτηση #{booking.id}: {booking.customer_name} - {booking.seats_booked} θέσεις")
            print(f"   Θέσεις: {booking.seat_numbers} | Τιμή: €{booking.total_price}")
        except Exception as e:
            print(f"❌ Σφάλμα: {e}")
    
    print(f"\n🎉 Δημιουργήθηκαν {created_count} κρατήσεις επιτυχώς!")
    print(f"Successfully created {created_count} bookings!")
    
    # Εμφάνιση στατιστικών
    print("\n📊 Στατιστικά:")
    print(f"   Συνολικές κρατήσεις: {Booking.objects.count()}")
    print(f"   Επιβεβαιωμένες: {Booking.objects.filter(status='confirmed').count()}")
    print(f"   Εκκρεμείς: {Booking.objects.filter(status='pending').count()}")
    total_revenue = sum(b.total_price for b in Booking.objects.filter(status='confirmed'))
    print(f"   Συνολικά έσοδα: €{total_revenue}")


def view_all_bookings():
    """
    Εμφανίζει όλες τις κρατήσεις
    Display all bookings
    """
    bookings = Booking.objects.all().order_by('-booking_date')
    
    print("\n" + "="*80)
    print("📋 ΟΛΕΣ ΟΙ ΚΡΑΤΗΣΕΙΣ / ALL BOOKINGS")
    print("="*80 + "\n")
    
    for booking in bookings:
        print(f"ID: {booking.id}")
        print(f"   Πελάτης: {booking.customer_name}")
        print(f"   Email: {booking.customer_email}")
        print(f"   Τηλέφωνο: {booking.customer_phone or 'N/A'}")
        print(f"   Προβολή: {booking.screening}")
        print(f"   Θέσεις: {booking.seats_booked} ({booking.seat_numbers or 'N/A'})")
        print(f"   Τιμή: €{booking.total_price}")
        print(f"   Κατάσταση: {booking.status}")
        print(f"   Ημερομηνία: {booking.booking_date.strftime('%Y-%m-%d %H:%M')}")
        print("-" * 80)


def create_sample_movies_and_screenings():
    """
    Δημιουργεί δείγμα ταινιών, αιθουσών και προβολών αν δεν υπάρχουν
    Creates sample movies, halls and screenings if they don't exist
    """
    
    # Δημιουργία αίθουσας αν δεν υπάρχει
    hall, created = MovieHall.objects.get_or_create(
        name="Αίθουσα 1",
        defaults={'capacity': 100}
    )
    if created:
        print(f"✅ Δημιουργήθηκε αίθουσα: {hall.name}")
    
    # Δημιουργία ταινίας αν δεν υπάρχει
    if not Movie.objects.exists():
        movie = Movie.objects.create(
            title="Avatar: The Way of Water",
            description="Ο Jake Sully ζει με τη νέα του οικογένεια που σχημάτισε στον πλανήτη Πανδώρα.",
            duration=192,
            genre="Sci-Fi/Adventure",
            director="James Cameron",
            release_year=2022,
            rating=7.8,
            status='now_playing',
            poster_url="https://image.tmdb.org/t/p/w500/example.jpg"
        )
        print(f"✅ Δημιουργήθηκε ταινία: {movie.title}")
        
        # Δημιουργία προβολής
        screening = Screening.objects.create(
            movie=movie,
            hall=hall,
            start_time=timezone.now() + timedelta(days=1, hours=18),
            price=12.00
        )
        print(f"✅ Δημιουργήθηκε προβολή: {screening}")


if __name__ == '__main__':
    print("\n" + "="*80)
    print("🎬 CINEMA BOOKING - SAMPLE DATA SCRIPT")
    print("="*80 + "\n")
    
    # Δημιουργία βασικών δεδομένων αν χρειάζεται
    create_sample_movies_and_screenings()
    
    # Δημιουργία κρατήσεων
    create_sample_bookings()
    
    # Εμφάνιση όλων των κρατήσεων
    view_all_bookings()
    
    print("\n✨ Ολοκληρώθηκε!")
    print("Done!\n")
