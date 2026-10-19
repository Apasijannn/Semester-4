"""Expansion reminder recurring menjadi occurrence per tanggal untuk kalender.

Dihitung di backend (bukan frontend) supaya aturan recurrence satu sumber:
- none    : hanya pada tanggal scheduled_at
- daily   : setiap hari sejak tanggal scheduled_at
- weekly  : hari-hari ISO di recurrence_days (fallback: hari scheduled_at),
            sejak tanggal scheduled_at
- monthly : tanggal (day-of-month) yang sama dengan scheduled_at; bulan yang
            tidak punya tanggal tsb (mis. 31) dilewati

Semua perhitungan memakai timezone aplikasi, karena scheduled_at tersimpan UTC.
"""

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo


def _parse_utc(raw: str) -> datetime:
    return datetime.fromisoformat(raw.replace("Z", "+00:00"))


def _month_bounds(year: int, month: int) -> tuple[date, date]:
    first = date(year, month, 1)
    last = (
        date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    ) - timedelta(days=1)
    return first, last


def _occurs_on(day: date, anchor: date, recurrence: str, days: list[int]) -> bool:
    if recurrence == "none":
        return day == anchor
    if day < anchor:
        return False  # recurring tidak berlaku surut sebelum jadwal pertama
    if recurrence == "daily":
        return True
    if recurrence == "weekly":
        return day.isoweekday() in days
    if recurrence == "monthly":
        return day.day == anchor.day
    return False


def expand_month(
    reminders: list[dict], year: int, month: int, tz: ZoneInfo
) -> list[dict]:
    """Kembalikan occurrence semua reminder pada bulan tsb, urut waktu."""
    first, last = _month_bounds(year, month)
    out: list[dict] = []

    for reminder in reminders:
        raw = reminder.get("scheduled_at")
        if not raw:
            continue  # tanpa jadwal -> tidak tampil di kalender

        anchor_local = _parse_utc(raw).astimezone(tz)
        anchor_date = anchor_local.date()
        recurrence = reminder.get("recurrence") or "none"
        days = reminder.get("recurrence_days") or [anchor_date.isoweekday()]

        day = first
        while day <= last:
            if _occurs_on(day, anchor_date, recurrence, days):
                occurrence_dt = datetime.combine(day, anchor_local.time(), tz)
                out.append(
                    {
                        "date": day.isoformat(),
                        "scheduled_at": occurrence_dt,
                        "reminder_id": reminder["id"],
                        "title": reminder["title"],
                        "description": reminder.get("description"),
                        "category": reminder.get("category") or "general",
                        "recurrence": recurrence,
                        "recurrence_days": reminder.get("recurrence_days"),
                        "status": reminder.get("status") or "active",
                    }
                )
            day += timedelta(days=1)

    out.sort(key=lambda o: o["scheduled_at"])
    return out
