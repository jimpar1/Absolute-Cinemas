"""
MovieHall model — represents a cinema auditorium with a configurable
seating layout (main floor + balcony, left / middle / right sections).

The ``save()`` method auto-generates a JSON ``layout`` describing each
tier's rows and sections. The layout is consumed by the frontend to
render a 3D seat selection grid.
"""

import math
from string import ascii_uppercase

from django.db import models
from django.core.validators import MinValueValidator


class MovieHall(models.Model):
    """Cinema hall with auto-generated seating layout."""

    name = models.CharField(max_length=100, unique=True, verbose_name="Hall Name")
    capacity = models.IntegerField(
        validators=[MinValueValidator(1)],
        verbose_name="Total Capacity (auto-calculated)",
        blank=True, default=1
    )

    # ── Main-floor section capacities ──
    left_section_capacity = models.IntegerField(
        validators=[MinValueValidator(0)], default=0,
        verbose_name="Left Section Capacity (Main)"
    )
    middle_section_capacity = models.IntegerField(
        validators=[MinValueValidator(0)], default=0,
        verbose_name="Middle Section Capacity (Main)"
    )
    right_section_capacity = models.IntegerField(
        validators=[MinValueValidator(0)], default=0,
        verbose_name="Right Section Capacity (Main)"
    )

    # ── Balcony section capacities ──
    balcony_left_capacity = models.IntegerField(
        validators=[MinValueValidator(0)], default=0,
        verbose_name="Left Section Capacity (Balcony)"
    )
    balcony_middle_capacity = models.IntegerField(
        validators=[MinValueValidator(0)], default=0,
        verbose_name="Middle Section Capacity (Balcony)"
    )
    balcony_right_capacity = models.IntegerField(
        validators=[MinValueValidator(0)], default=0,
        verbose_name="Right Section Capacity (Balcony)"
    )

    # ── Seats-per-row overrides (0 = auto-calculate) ──
    left_seats_per_row = models.IntegerField(
        validators=[MinValueValidator(0)], default=0,
        verbose_name="Seats/Row Left (Main)",
        help_text="0 = auto-calculate"
    )
    middle_seats_per_row = models.IntegerField(
        validators=[MinValueValidator(0)], default=0,
        verbose_name="Seats/Row Middle (Main)",
        help_text="0 = auto-calculate"
    )
    right_seats_per_row = models.IntegerField(
        validators=[MinValueValidator(0)], default=0,
        verbose_name="Seats/Row Right (Main)",
        help_text="0 = auto-calculate"
    )
    balcony_left_seats_per_row = models.IntegerField(
        validators=[MinValueValidator(0)], default=0,
        verbose_name="Seats/Row Left (Balcony)",
        help_text="0 = auto-calculate"
    )
    balcony_middle_seats_per_row = models.IntegerField(
        validators=[MinValueValidator(0)], default=0,
        verbose_name="Seats/Row Middle (Balcony)",
        help_text="0 = auto-calculate"
    )
    balcony_right_seats_per_row = models.IntegerField(
        validators=[MinValueValidator(0)], default=0,
        verbose_name="Seats/Row Right (Balcony)",
        help_text="0 = auto-calculate"
    )

    layout = models.JSONField(
        verbose_name="Hall Layout",
        blank=True, null=True,
        help_text="JSON seat layout. Auto-generated if blank."
    )

    class Meta:
        verbose_name = "Cinema Hall"
        verbose_name_plural = "Cinema Halls"
        ordering = ['name']

    # ─────────────────────── helpers ───────────────────────

    @staticmethod
    def _row_label(index):
        """Convert a 0-based index to a spreadsheet-style label (A–Z, AA, AB …)."""
        if index < 26:
            return ascii_uppercase[index]
        return f"{ascii_uppercase[index // 26 - 1]}{ascii_uppercase[index % 26]}"

    @staticmethod
    def _section_seats_per_row(capacity, override, min_seats=2):
        """
        Determine the seats-per-row for a section.
        Uses the admin override if non-zero, otherwise auto-calculates.
        """
        if capacity <= 0:
            return 0
        if override > 0:
            return override
        return max(min_seats, int(math.sqrt(capacity * 1.5)))

    def _build_tier(self, tier_name, left_cap, mid_cap, right_cap,
                    left_spr, mid_spr, right_spr, row_offset=0):
        """
        Build a single tier dict (Main or Balcony).
        Returns None if the tier has zero total capacity.
        """
        l_spr = self._section_seats_per_row(left_cap, left_spr, min_seats=2)
        m_spr = self._section_seats_per_row(mid_cap, mid_spr, min_seats=3)
        r_spr = self._section_seats_per_row(right_cap, right_spr, min_seats=2)

        l_rows = math.ceil(left_cap / l_spr) if l_spr > 0 else 0
        m_rows = math.ceil(mid_cap / m_spr) if m_spr > 0 else 0
        r_rows = math.ceil(right_cap / r_spr) if r_spr > 0 else 0

        num_rows = max(l_rows, m_rows, r_rows)
        if num_rows == 0:
            return None, 0

        rows = [self._row_label(row_offset + i) for i in range(num_rows)]
        mid_start = l_spr + 1
        right_start = mid_start + m_spr

        tier = {
            "name": tier_name,
            "rows": rows,
            "sections": {
                "left": {"enabled": left_cap > 0, "seatsPerRow": l_spr, "startSeat": 1, "maxSeats": left_cap},
                "middle": {"enabled": mid_cap > 0, "seatsPerRow": m_spr, "startSeat": mid_start, "maxSeats": mid_cap},
                "right": {"enabled": right_cap > 0, "seatsPerRow": r_spr, "startSeat": right_start, "maxSeats": right_cap},
            }
        }
        return tier, num_rows

    def _needs_layout_regeneration(self):
        """Check if any capacity/seats-per-row field changed since last save."""
        if not self.pk:
            return True
        old = MovieHall.objects.filter(pk=self.pk).first()
        if not old:
            return True
        fields = [
            'left_section_capacity', 'middle_section_capacity', 'right_section_capacity',
            'balcony_left_capacity', 'balcony_middle_capacity', 'balcony_right_capacity',
            'left_seats_per_row', 'middle_seats_per_row', 'right_seats_per_row',
            'balcony_left_seats_per_row', 'balcony_middle_seats_per_row', 'balcony_right_seats_per_row',
        ]
        return any(getattr(old, f) != getattr(self, f) for f in fields)

    # ─────────────────────── save ───────────────────────

    def save(self, *args, **kwargs):
        """
        Recalculate total capacity and (re)generate the layout JSON
        whenever capacity fields change.
        """
        regenerate = self._needs_layout_regeneration()

        # Legacy fallback: if only total capacity is set, put it all in the middle
        if (self.capacity > 0 and
                self.left_section_capacity == 0 and self.middle_section_capacity == 0 and
                self.right_section_capacity == 0 and self.balcony_left_capacity == 0 and
                self.balcony_middle_capacity == 0 and self.balcony_right_capacity == 0):
            self.middle_section_capacity = self.capacity

        self.capacity = (
            self.left_section_capacity + self.middle_section_capacity + self.right_section_capacity +
            self.balcony_left_capacity + self.balcony_middle_capacity + self.balcony_right_capacity
        )
        if self.capacity == 0:
            self.capacity = 1

        if (not self.layout or regenerate) and self.capacity > 0:
            tiers = []

            main_tier, main_rows = self._build_tier(
                "Main",
                self.left_section_capacity, self.middle_section_capacity, self.right_section_capacity,
                self.left_seats_per_row, self.middle_seats_per_row, self.right_seats_per_row,
            )
            if main_tier:
                tiers.append(main_tier)

            balcony_tier, _ = self._build_tier(
                "Balcony",
                self.balcony_left_capacity, self.balcony_middle_capacity, self.balcony_right_capacity,
                self.balcony_left_seats_per_row, self.balcony_middle_seats_per_row, self.balcony_right_seats_per_row,
                row_offset=main_rows,
            )
            if balcony_tier:
                tiers.append(balcony_tier)

            self.layout = {"hallName": self.name, "tiers": tiers}

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.capacity} seats)"
