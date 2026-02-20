"""
Αρχείο models.py - Ορισμός των μοντέλων της εφαρμογής cinema
Models file - Definition of cinema application models

Περιέχει τα μοντέλα:
- Customer (Profile): Προφίλ πελάτη (επέκταση Django User)
- Movie (Ταινία): Αποθηκεύει πληροφορίες για τις ταινίες
- Screening (Προβολή): Αποθηκεύει πληροφορίες για τις προβολές ταινιών
- Booking (Κράτηση): Αποθηκεύει πληροφορίες για τις κρατήσεις θέσεων
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta


class Customer(models.Model):
    """
    Μοντέλο Customer (Προφίλ Πελάτη)
    Επέκταση του Django User model με επιπλέον πληροφορίες πελάτη.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='customer_profile',
        verbose_name="Χρήστης"
    )
    phone = models.CharField(
        max_length=20,
        verbose_name="Τηλέφωνο",
        blank=True
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Ημερομηνία Δημιουργίας"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Ημερομηνία Ενημέρωσης"
    )

    class Meta:
        verbose_name = "Πελάτης"
        verbose_name_plural = "Πελάτες"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username}"

    @property
    def email(self):
        return self.user.email

    @property
    def full_name(self):
        return self.user.get_full_name() or self.user.username


class MovieHall(models.Model):
    """
    Μοντέλο MovieHall (Αίθουσα Κινηματογράφου)
    Αποθηκεύει πληροφορίες για κάθε αίθουσα προβολής.
    """
    name = models.CharField(max_length=100, unique=True, verbose_name="Όνομα Αίθουσας")
    capacity = models.IntegerField(validators=[MinValueValidator(1)], verbose_name="Συνολική Χωρητικότητα (Υπολογίζεται αυτόματα)", blank=True, default=1)
    left_section_capacity = models.IntegerField(validators=[MinValueValidator(0)], default=0, verbose_name="Χωρητικότητα Αριστερού Τμήματος (Πλατεία)")
    middle_section_capacity = models.IntegerField(validators=[MinValueValidator(0)], default=0, verbose_name="Χωρητικότητα Μεσαίου Τμήματος (Πλατεία)")
    right_section_capacity = models.IntegerField(validators=[MinValueValidator(0)], default=0, verbose_name="Χωρητικότητα Δεξιού Τμήματος (Πλατεία)")
    balcony_left_capacity = models.IntegerField(validators=[MinValueValidator(0)], default=0, verbose_name="Χωρητικότητα Αριστερού Τμήματος (Εξώστης)")
    balcony_middle_capacity = models.IntegerField(validators=[MinValueValidator(0)], default=0, verbose_name="Χωρητικότητα Μεσαίου Τμήματος (Εξώστης)")
    balcony_right_capacity = models.IntegerField(validators=[MinValueValidator(0)], default=0, verbose_name="Χωρητικότητα Δεξιού Τμήματος (Εξώστης)")
    # Seats per row overrides (0 = auto-calculate)
    left_seats_per_row = models.IntegerField(validators=[MinValueValidator(0)], default=0, verbose_name="Θέσεις/Σειρά Αριστερά (Πλατεία)", help_text="0 = αυτόματος υπολογισμός")
    middle_seats_per_row = models.IntegerField(validators=[MinValueValidator(0)], default=0, verbose_name="Θέσεις/Σειρά Μεσαία (Πλατεία)", help_text="0 = αυτόματος υπολογισμός")
    right_seats_per_row = models.IntegerField(validators=[MinValueValidator(0)], default=0, verbose_name="Θέσεις/Σειρά Δεξιά (Πλατεία)", help_text="0 = αυτόματος υπολογισμός")
    balcony_left_seats_per_row = models.IntegerField(validators=[MinValueValidator(0)], default=0, verbose_name="Θέσεις/Σειρά Αριστερά (Εξώστης)", help_text="0 = αυτόματος υπολογισμός")
    balcony_middle_seats_per_row = models.IntegerField(validators=[MinValueValidator(0)], default=0, verbose_name="Θέσεις/Σειρά Μεσαία (Εξώστης)", help_text="0 = αυτόματος υπολογισμός")
    balcony_right_seats_per_row = models.IntegerField(validators=[MinValueValidator(0)], default=0, verbose_name="Θέσεις/Σειρά Δεξιά (Εξώστης)", help_text="0 = αυτόματος υπολογισμός")
    layout = models.JSONField(
        verbose_name="Διάταξη Αίθουσας",
        blank=True,
        null=True,
        help_text="JSON με τη διάταξη των θέσεων. Αν δεν δοθεί, δημιουργείται αυτόματα."
    )

    class Meta:
        verbose_name = "Αίθουσα Κινηματογράφου"
        verbose_name_plural = "Αίθουσες Κινηματογράφου"
        ordering = ['name']

    def save(self, *args, **kwargs):
        regenerate = False
        if self.pk:
            old_self = MovieHall.objects.filter(pk=self.pk).first()
            if old_self:
                if (old_self.left_section_capacity != self.left_section_capacity or
                    old_self.middle_section_capacity != self.middle_section_capacity or
                    old_self.right_section_capacity != self.right_section_capacity or
                    old_self.balcony_left_capacity != self.balcony_left_capacity or
                    old_self.balcony_middle_capacity != self.balcony_middle_capacity or
                    old_self.balcony_right_capacity != self.balcony_right_capacity or
                    old_self.left_seats_per_row != self.left_seats_per_row or
                    old_self.middle_seats_per_row != self.middle_seats_per_row or
                    old_self.right_seats_per_row != self.right_seats_per_row or
                    old_self.balcony_left_seats_per_row != self.balcony_left_seats_per_row or
                    old_self.balcony_middle_seats_per_row != self.balcony_middle_seats_per_row or
                    old_self.balcony_right_seats_per_row != self.balcony_right_seats_per_row):
                    regenerate = True

        # Fallback for old records that had capacity but no sections
        if self.capacity > 0 and self.left_section_capacity == 0 and self.middle_section_capacity == 0 and self.right_section_capacity == 0 and self.balcony_left_capacity == 0 and self.balcony_middle_capacity == 0 and self.balcony_right_capacity == 0:
            self.middle_section_capacity = self.capacity

        self.capacity = (
            self.left_section_capacity + self.middle_section_capacity + self.right_section_capacity +
            self.balcony_left_capacity + self.balcony_middle_capacity + self.balcony_right_capacity
        )
        if self.capacity == 0:
            self.capacity = 1 # Avoid validation errors if someone enters 0 everywhere
            
        if (not self.layout or regenerate) and self.capacity > 0:
            import math
            from string import ascii_uppercase
            
            target_ratio = 1.5
            tiers_data = []
            
            # --- Main Tier ---
            # Left Section
            left_seats_per_row = self.left_seats_per_row  # admin override
            if self.left_section_capacity > 0 and left_seats_per_row == 0:
                left_seats_per_row = max(2, int(math.sqrt(self.left_section_capacity * target_ratio)))
            left_rows = math.ceil(self.left_section_capacity / left_seats_per_row) if left_seats_per_row > 0 else 0
            
            # Middle Section
            middle_seats_per_row = self.middle_seats_per_row  # admin override
            if self.middle_section_capacity > 0 and middle_seats_per_row == 0:
                middle_seats_per_row = max(3, int(math.sqrt(self.middle_section_capacity * target_ratio)))
            middle_rows = math.ceil(self.middle_section_capacity / middle_seats_per_row) if middle_seats_per_row > 0 else 0
            
            # Right Section
            right_seats_per_row = self.right_seats_per_row  # admin override
            if self.right_section_capacity > 0 and right_seats_per_row == 0:
                right_seats_per_row = max(2, int(math.sqrt(self.right_section_capacity * target_ratio)))
            right_rows = math.ceil(self.right_section_capacity / right_seats_per_row) if right_seats_per_row > 0 else 0
            
            main_num_rows = max(left_rows, middle_rows, right_rows)
            
            main_rows = []
            for i in range(main_num_rows):
                if i < 26:
                    main_rows.append(ascii_uppercase[i])
                else:
                    main_rows.append(f"{ascii_uppercase[i//26 - 1]}{ascii_uppercase[i%26]}")
            
            main_middle_start = left_seats_per_row + 1
            main_right_start = main_middle_start + middle_seats_per_row

            tiers_data.append({
                "name": "Main",
                "rows": main_rows,
                "sections": {
                    "left": {
                        "enabled": self.left_section_capacity > 0, 
                        "seatsPerRow": left_seats_per_row, 
                        "startSeat": 1,
                        "maxSeats": self.left_section_capacity
                    },
                    "middle": {
                        "enabled": self.middle_section_capacity > 0, 
                        "seatsPerRow": middle_seats_per_row, 
                        "startSeat": main_middle_start,
                        "maxSeats": self.middle_section_capacity
                    },
                    "right": {
                        "enabled": self.right_section_capacity > 0, 
                        "seatsPerRow": right_seats_per_row, 
                        "startSeat": main_right_start,
                        "maxSeats": self.right_section_capacity
                    }
                }
            })
            
            # --- Balcony Tier ---
            b_left_seats = self.balcony_left_seats_per_row  # admin override
            if self.balcony_left_capacity > 0 and b_left_seats == 0:
                b_left_seats = max(2, int(math.sqrt(self.balcony_left_capacity * target_ratio)))
            b_left_rows = math.ceil(self.balcony_left_capacity / b_left_seats) if b_left_seats > 0 else 0
            
            b_mid_seats = self.balcony_middle_seats_per_row  # admin override
            if self.balcony_middle_capacity > 0 and b_mid_seats == 0:
                b_mid_seats = max(3, int(math.sqrt(self.balcony_middle_capacity * target_ratio)))
            b_mid_rows = math.ceil(self.balcony_middle_capacity / b_mid_seats) if b_mid_seats > 0 else 0
            
            b_right_seats = self.balcony_right_seats_per_row  # admin override
            if self.balcony_right_capacity > 0 and b_right_seats == 0:
                b_right_seats = max(2, int(math.sqrt(self.balcony_right_capacity * target_ratio)))
            b_right_rows = math.ceil(self.balcony_right_capacity / b_right_seats) if b_right_seats > 0 else 0
            
            b_num_rows = max(b_left_rows, b_mid_rows, b_right_rows)
            
            if b_num_rows > 0:
                b_rows = []
                for i in range(main_num_rows, main_num_rows + b_num_rows):
                    if i < 26:
                        b_rows.append(ascii_uppercase[i])
                    else:
                        b_rows.append(f"{ascii_uppercase[i//26 - 1]}{ascii_uppercase[i%26]}")
                
                b_middle_start = b_left_seats + 1
                b_right_start = b_middle_start + b_mid_seats

                tiers_data.append({
                    "name": "Balcony",
                    "rows": b_rows,
                    "sections": {
                        "left": {
                            "enabled": self.balcony_left_capacity > 0, 
                            "seatsPerRow": b_left_seats, 
                            "startSeat": 1,
                            "maxSeats": self.balcony_left_capacity
                        },
                        "middle": {
                            "enabled": self.balcony_middle_capacity > 0, 
                            "seatsPerRow": b_mid_seats, 
                            "startSeat": b_middle_start,
                            "maxSeats": self.balcony_middle_capacity
                        },
                        "right": {
                            "enabled": self.balcony_right_capacity > 0, 
                            "seatsPerRow": b_right_seats, 
                            "startSeat": b_right_start,
                            "maxSeats": self.balcony_right_capacity
                        }
                    }
                })

            self.layout = {
                "hallName": self.name,
                "tiers": tiers_data
            }
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.capacity} seats)"


class Movie(models.Model):
    """
    Μοντέλο Movie (Ταινία)
    Αποθηκεύει πληροφορίες για κάθε ταινία που προβάλλεται στο σινεμά.
    """
    title = models.CharField(
        max_length=200,
        verbose_name="Τίτλος"
    )
    description = models.TextField(
        verbose_name="Περιγραφή",
        blank=True
    )
    duration = models.IntegerField(
        verbose_name="Διάρκεια (λεπτά)",
        validators=[MinValueValidator(1)]
    )
    genre = models.CharField(
        max_length=100,
        verbose_name="Είδος"
    )
    director = models.CharField(
        max_length=200,
        verbose_name="Σκηνοθέτης"
    )
    release_year = models.IntegerField(
        verbose_name="Έτος Κυκλοφορίας",
        validators=[MinValueValidator(1900), MaxValueValidator(2100)]
    )
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        verbose_name="Βαθμολογία",
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)]
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('upcoming', 'Upcoming'),
            ('now_playing', 'Now Playing'),
        ],
        default='upcoming',
        verbose_name="Status"
    )
    poster_url = models.URLField(
        verbose_name="URL Αφίσας",
        blank=True,
        null=True
    )
    trailer_url = models.URLField(
        verbose_name="URL Trailer",
        blank=True,
        null=True
    )
    shots = models.JSONField(
        verbose_name="Φωτογραφίες Ταινίας",
        blank=True,
        null=True
    )
    actors = models.JSONField(
        verbose_name="Ηθοποιοί",
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Ημερομηνία Δημιουργίας"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Ημερομηνία Ενημέρωσης"
    )

    @property
    def computed_status(self):
        """
        Automatically compute status based on screenings.
        If the movie has any screening within the current week (Mon-Sun) → 'now_playing'
        Otherwise → 'upcoming'
        """
        now = timezone.now()
        # Monday of current week at midnight
        week_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        # Sunday end of current week
        week_end = week_start + timedelta(days=7)

        has_screening_this_week = self.screenings.filter(
            start_time__gte=week_start,
            start_time__lt=week_end
        ).exists()

        return 'now_playing' if has_screening_this_week else 'upcoming'

    class Meta:
        verbose_name = "Ταινία"
        verbose_name_plural = "Ταινίες"
        ordering = ['-created_at']  # Ταξινόμηση με βάση την ημερομηνία δημιουργίας (πιο πρόσφατες πρώτα)

    def __str__(self):
        return f"{self.title} ({self.release_year})"


class Screening(models.Model):
    """
    Μοντέλο Screening (Προβολή)
    Αποθηκεύει πληροφορίες για τις προβολές των ταινιών.
    """
    movie = models.ForeignKey(
        Movie,
        on_delete=models.CASCADE,
        related_name='screenings',
        verbose_name="Ταινία"
    )
    hall = models.ForeignKey(
        MovieHall,
        on_delete=models.CASCADE,
        related_name='screenings',
        verbose_name="Αίθουσα"
    )
    start_time = models.DateTimeField(
        verbose_name="Ώρα Έναρξης"
    )
    price = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        verbose_name="Τιμή Εισιτηρίου",
        validators=[MinValueValidator(0)],
        default=0
    )
    available_seats = models.IntegerField(
        verbose_name="Διαθέσιμες Θέσεις",
        validators=[MinValueValidator(0)]
    )

    @property
    def end_time(self):
        if self.start_time is None:
            return None
        return self.start_time + timedelta(minutes=self.movie.duration)

    @property
    def total_seats(self):
        return self.hall.capacity

    def clean(self):
        if not self.start_time:
            raise ValidationError({"start_time": "Start time is required."})
        if not self.end_time:
            raise ValidationError({"end_time": "End time is required."})
        if self.start_time.minute not in [0, 30]:
            raise ValidationError({"start_time": "Start time must be on the hour or half-hour."})
        if self.end_time <= self.start_time:
            raise ValidationError({"end_time": "End time must be after start time."})

        # Validate for overlapping screenings in the same hall
        end_time = self.end_time
        overlapping_screenings = Screening.objects.filter(
            hall=self.hall,
            start_time__lt=end_time,
        ).exclude(pk=self.pk)

        for screening in overlapping_screenings:
            if screening.end_time > self.start_time:
                raise ValidationError(
                    f"There is already a screening in hall {self.hall.name} that overlaps with this time."
                )

    def save(self, *args, **kwargs):
        if self.pk is None:  # Set available_seats only on creation
            self.available_seats = self.hall.capacity
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Προβολή"
        verbose_name_plural = "Προβολές"
        ordering = ['start_time']

    def __str__(self):
        return f"{self.movie.title} at {self.hall.name} on {self.start_time.strftime('%Y-%m-%d %H:%M')}"


class Booking(models.Model):
    """
    Μοντέλο Booking (Κράτηση)
    Αποθηκεύει πληροφορίες για τις κρατήσεις θέσεων από τους πελάτες.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='bookings',
        verbose_name="Χρήστης",
        null=True,
        blank=True,
        help_text="Ο συνδεδεμένος χρήστης που έκανε την κράτηση (προαιρετικό για guest bookings)"
    )
    screening = models.ForeignKey(
        Screening,
        on_delete=models.CASCADE,
        related_name='bookings',
        verbose_name="Προβολή"
    )
    customer_name = models.CharField(
        max_length=200,
        verbose_name="Όνομα Πελάτη"
    )
    customer_email = models.EmailField(
        verbose_name="Email Πελάτη"
    )
    customer_phone = models.CharField(
        max_length=20,
        verbose_name="Τηλέφωνο Πελάτη",
        blank=True
    )
    seats_booked = models.IntegerField(
        verbose_name="Αριθμός Θέσεων",
        validators=[MinValueValidator(1)]
    )
    seat_numbers = models.CharField(
        max_length=500,
        verbose_name="Αριθμοί Θέσεων",
        blank=True,
        help_text="Οι αριθμοί των θέσεων που κρατήθηκαν (π.χ. A1, A2, B5)"
    )
    total_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        verbose_name="Συνολική Τιμή",
        validators=[MinValueValidator(0)]
    )
    booking_date = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Ημερομηνία Κράτησης"
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('confirmed', 'Επιβεβαιωμένη'),
            ('cancelled', 'Ακυρωμένη'),
            ('pending', 'Εκκρεμής'),
        ],
        default='pending',
        verbose_name="Κατάσταση"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Ημερομηνία Δημιουργίας"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Ημερομηνία Ενημέρωσης"
    )

    class Meta:
        verbose_name = "Κράτηση"
        verbose_name_plural = "Κρατήσεις"
        ordering = ['-booking_date']  # Ταξινόμηση με βάση την ημερομηνία κράτησης (πιο πρόσφατες πρώτα)

    def __str__(self):
        return f"Κράτηση #{self.id} - {self.customer_name} - {self.screening}"

    def save(self, *args, **kwargs):
        """
        Override της save μεθόδου για να υπολογίσουμε αυτόματα τη συνολική τιμή
        και να ενημερώσουμε τις διαθέσιμες θέσεις της προβολής.
        """
        # Υπολογισμός συνολικής τιμής
        if not self.pk:  # Calculate price only on creation
            self.total_price = self.screening.price * self.seats_booked

        # Έλεγχος αν υπάρχουν διαθέσιμες θέσεις (μόνο για νέες κρατήσεις)
        if not self.pk:  # Νέα κράτηση
            if self.seats_booked > self.screening.available_seats:
                raise ValueError("Δεν υπάρχουν αρκετές διαθέσιμες θέσεις")
            # Μείωση διαθέσιμων θέσεων
            self.screening.available_seats -= self.seats_booked
            self.screening.save()

        super().save(*args, **kwargs)

class SeatLock(models.Model):
    """
    Μοντέλο SeatLock (Προσωρινή Δέσμευση)
    Αποθηκεύει προσωρινά τις θέσεις που έχουν επιλεγεί από ένα χρήστη.
    """
    screening = models.ForeignKey(
        Screening,
        on_delete=models.CASCADE,
        related_name='seat_locks',
        verbose_name="Προβολή"
    )
    seat_number = models.CharField(
        max_length=10,
        verbose_name="Αριθμός Θέσης"
    )
    session_id = models.CharField(
        max_length=100,
        verbose_name="Session ID"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Ημερομηνία Δημιουργίας"
    )

    class Meta:
        verbose_name = "Προσωρινή Δέσμευση"
        verbose_name_plural = "Προσωρινές Δεσμεύσεις"
        unique_together = ['screening', 'seat_number']

    @property
    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=10)

    def __str__(self):
        return f"Lock: {self.seat_number} for {self.screening.movie.title} (Session: {self.session_id})"

