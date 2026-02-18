"""
ScreeningAdmin — admin panel config for screenings.
Supports creating weekly-recurring screenings with automatic conflict detection.
"""

from datetime import timedelta
from django.contrib import admin, messages
from django.core.exceptions import ValidationError
from django import forms
from ..models import Screening


class ScreeningAdminForm(forms.ModelForm):
    """
    Custom form adding optional weekly-repetition fields.
    Hidden when editing an existing screening.
    """
    repeat_weekly = forms.BooleanField(
        required=False, label='Repeat weekly',
        help_text='Create this screening at the same time for multiple weeks'
    )
    repeat_weeks = forms.IntegerField(
        required=False, min_value=1, max_value=52, initial=4,
        label='Number of extra weeks',
        help_text='How many additional weeks to repeat (1-52)'
    )

    class Meta:
        model = Screening
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['start_time'].widget.widgets[1].attrs['required'] = True
        if self.instance and self.instance.pk:
            self.fields['repeat_weekly'].widget = forms.HiddenInput()
            self.fields['repeat_weeks'].widget = forms.HiddenInput()

    def clean(self):
        cleaned_data = super().clean()
        if cleaned_data.get('repeat_weekly') and not cleaned_data.get('repeat_weeks'):
            raise forms.ValidationError({'repeat_weeks': 'Specify the number of weeks to repeat.'})
        return cleaned_data


@admin.register(Screening)
class ScreeningAdmin(admin.ModelAdmin):
    """
    Screening admin with weekly repetition support.
    After saving the first screening, copies are created for each
    subsequent week, skipping weeks with hall conflicts.
    """
    form = ScreeningAdminForm
    list_display = ['movie', 'hall', 'start_time', 'end_time', 'available_seats', 'total_seats']
    list_filter = ['hall', 'start_time']
    search_fields = ['movie__title', 'hall__name']
    ordering = ['start_time']
    readonly_fields = ('end_time', 'total_seats', 'available_seats')

    fieldsets = (
        (None, {'fields': ('movie', 'hall', 'start_time', 'price')}),
        ('Computed Fields', {'fields': ('end_time', 'total_seats', 'available_seats')}),
        ('Weekly Repetition', {
            'fields': ('repeat_weekly', 'repeat_weeks'),
            'description': 'Optionally repeat this screening at the same day/time for multiple weeks. '
                           'Weeks with hall conflicts will be automatically skipped.',
        }),
    )

    def save_model(self, request, obj, form, change):
        """Save the screening, then create weekly copies if requested."""
        super().save_model(request, obj, form, change)

        if change:
            return  # repetition only applies to new screenings

        repeat_weekly = form.cleaned_data.get('repeat_weekly', False)
        repeat_weeks = form.cleaned_data.get('repeat_weeks', 0)

        if not repeat_weekly or not repeat_weeks:
            return

        created = 0
        skipped_weeks = []

        for week in range(1, repeat_weeks + 1):
            new_start = obj.start_time + timedelta(weeks=week)
            new_screening = Screening(
                movie=obj.movie, hall=obj.hall,
                start_time=new_start, price=obj.price,
            )
            try:
                new_screening.clean()
                new_screening.save()
                created += 1
            except ValidationError:
                skipped_weeks.append(new_start.strftime('%a %d %b %Y, %H:%M'))

        if created > 0:
            messages.success(
                request,
                f'✅ Created {created} additional weekly screening{"s" if created != 1 else ""}.'
            )
        if skipped_weeks:
            skipped_list = '; '.join(skipped_weeks)
            messages.warning(
                request,
                f'⚠️ Skipped {len(skipped_weeks)} week{"s" if len(skipped_weeks) != 1 else ""} '
                f'due to hall conflicts: {skipped_list}'
            )
