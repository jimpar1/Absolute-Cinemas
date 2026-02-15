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
    capacity = models.IntegerField(validators=[MinValueValidator(1)], verbose_name="Χωρητικότητα")

    class Meta:
        verbose_name = "Αίθουσα Κινηματογράφου"
        verbose_name_plural = "Αίθουσες Κινηματογράφου"
        ordering = ['name']

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
