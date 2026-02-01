"""
Αρχείο apps.py - Ρυθμίσεις εφαρμογής cinema
Apps file - Cinema application configuration

Ορίζει τη διαμόρφωση της εφαρμογής cinema.
"""

from django.apps import AppConfig


class CinemaConfig(AppConfig):
    """
    Διαμόρφωση εφαρμογής cinema
    Cinema application configuration
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cinema'
    verbose_name = 'Διαχείριση Σινεμά'  # Όνομα που θα εμφανίζεται στο admin

