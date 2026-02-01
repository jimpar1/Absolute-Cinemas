"""
Αρχείο models.py - Ορισμός των μοντέλων της εφαρμογής cinema
Models file - Definition of cinema application models

Περιέχει τα μοντέλα:
- Movie (Ταινία): Αποθηκεύει πληροφορίες για τις ταινίες
- Screening (Προβολή): Αποθηκεύει πληροφορίες για τις προβολές ταινιών
- Booking (Κράτηση): Αποθηκεύει πληροφορίες για τις κρατήσεις θέσεων
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


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
    poster_url = models.URLField(
        verbose_name="URL Αφίσας",
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
    screen_number = models.IntegerField(
        verbose_name="Αριθμός Αίθουσας",
        validators=[MinValueValidator(1)]
    )
    start_time = models.DateTimeField(
        verbose_name="Ώρα Έναρξης"
    )
    end_time = models.DateTimeField(
        verbose_name="Ώρα Λήξης"
    )
    available_seats = models.IntegerField(
        verbose_name="Διαθέσιμες Θέσεις",
        validators=[MinValueValidator(0)]
    )
    total_seats = models.IntegerField(
        verbose_name="Συνολικές Θέσεις",
        validators=[MinValueValidator(1)]
    )
    price = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        verbose_name="Τιμή Εισιτηρίου",
        validators=[MinValueValidator(0)]
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
        verbose_name = "Προβολή"
        verbose_name_plural = "Προβολές"
        ordering = ['start_time']  # Ταξινόμηση με βάση την ώρα έναρξης

    def __str__(self):
        return f"{self.movie.title} - Αίθουσα {self.screen_number} - {self.start_time.strftime('%d/%m/%Y %H:%M')}"

    def save(self, *args, **kwargs):
        """
        Override της save μεθόδου για να βεβαιωθούμε ότι οι διαθέσιμες θέσεις
        δεν ξεπερνούν τις συνολικές θέσεις.
        """
        if self.available_seats > self.total_seats:
            self.available_seats = self.total_seats
        super().save(*args, **kwargs)


class Booking(models.Model):
    """
    Μοντέλο Booking (Κράτηση)
    Αποθηκεύει πληροφορίες για τις κρατήσεις θέσεων από τους πελάτες.
    """
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
        if not self.total_price or self.total_price == 0:
            self.total_price = self.screening.price * self.seats_booked
        
        # Έλεγχος αν υπάρχουν διαθέσιμες θέσεις (μόνο για νέες κρατήσεις)
        if not self.pk:  # Νέα κράτηση
            if self.seats_booked > self.screening.available_seats:
                raise ValueError("Δεν υπάρχουν αρκετές διαθέσιμες θέσεις")
            # Μείωση διαθέσιμων θέσεων
            self.screening.available_seats -= self.seats_booked
            self.screening.save()
        
        super().save(*args, **kwargs)

