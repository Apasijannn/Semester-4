"""Akses database Supabase untuk modul AI Planner.

Memakai service role key (server-side, bypass RLS) — user_id dipercaya dari
request untuk v1; nantinya diganti verifikasi JWT Supabase Auth.
"""

from functools import lru_cache

from supabase import Client, create_client

from app.config import get_settings


@lru_cache
def _client() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def fetch_active_reminders(user_id: str, limit: int = 20) -> list[dict]:
    """Reminder aktif user sebagai context matching update/delete (PRD §10)."""
    res = (
        _client()
        .table("reminders")
        .select("id, title, category, scheduled_at, recurrence, recurrence_days")
        .eq("user_id", user_id)
        .eq("status", "active")
        .order("scheduled_at", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data or []


def insert_chat_log(
    user_id: str, role: str, message: str, extracted_json: dict | None = None
) -> str:
    """Simpan satu baris percakapan (user/assistant) untuk audit (PRD §7.3)."""
    res = (
        _client()
        .table("chat_logs")
        .insert(
            {
                "user_id": user_id,
                "role": role,
                "message": message,
                "extracted_json": extracted_json,
            }
        )
        .execute()
    )
    return res.data[0]["id"]


def list_chat_history(user_id: str, limit: int, before: str | None) -> list[dict]:
    """Riwayat chat untuk UI, terbaru-dulu dengan cursor `before` (created_at).

    Hanya kolom ringan (tanpa extracted_json). Mengambil limit+1 baris supaya
    pemanggil bisa mendeteksi has_more tanpa query count terpisah.
    """
    query = (
        _client()
        .table("chat_logs")
        .select("id, role, message, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit + 1)
    )
    if before:
        query = query.lt("created_at", before)
    res = query.execute()
    return res.data or []


def get_chat_log(chat_log_id: str) -> dict | None:
    res = (
        _client()
        .table("chat_logs")
        .select("*")
        .eq("id", chat_log_id)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def insert_pending_action(user_id: str, chat_log_id: str, action: dict) -> str:
    """Masukkan action ke staging area menunggu konfirmasi user (PRD §7.4/§9)."""
    res = (
        _client()
        .table("pending_actions")
        .insert(
            {
                "user_id": user_id,
                "action_type": action["type"],
                "target_id": action["target_id"],
                "payload": action,
                "confirmation_text": action["confirmation_text"],
                "status": "waiting_confirmation",
                "chat_log_id": chat_log_id,
            }
        )
        .execute()
    )
    return res.data[0]["id"]


def get_pending_action(pending_action_id: str) -> dict | None:
    res = (
        _client()
        .table("pending_actions")
        .select("*")
        .eq("id", pending_action_id)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def list_waiting_pending_actions(user_id: str) -> list[dict]:
    """Pending actions user yang masih menunggu konfirmasi (untuk restore UI)."""
    res = (
        _client()
        .table("pending_actions")
        .select(
            "id, user_id, action_type, target_id, payload, "
            "confirmation_text, chat_log_id, created_at"
        )
        .eq("user_id", user_id)
        .eq("status", "waiting_confirmation")
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


def set_pending_action_status(pending_action_id: str, status: str) -> None:
    _client().table("pending_actions").update({"status": status}).eq(
        "id", pending_action_id
    ).execute()


# ---------------------------------------------------------------------------
# Apply pending action -> reminders (hanya dipanggil setelah user confirm)
# ---------------------------------------------------------------------------

# Field payload extraction yang boleh diterapkan ke tabel reminders
_REMINDER_FIELDS = ("title", "category", "scheduled_at", "recurrence", "recurrence_days")


def create_reminder(user_id: str, payload: dict, source_chat_log_id: str | None) -> dict:
    row = {
        "user_id": user_id,
        "title": payload["title"],
        "category": payload.get("category") or "general",
        "scheduled_at": payload.get("scheduled_at"),
        "recurrence": payload.get("recurrence") or "none",
        "recurrence_days": payload.get("recurrence_days"),
        "status": "active",
        "source_chat_log_id": source_chat_log_id,
    }
    res = _client().table("reminders").insert(row).execute()
    return res.data[0]


def update_reminder(user_id: str, reminder_id: str, payload: dict) -> dict | None:
    """Terapkan field non-null dari payload; None berarti tidak diubah.

    Return None jika reminder tidak ditemukan / bukan milik user.
    """
    fields = {k: payload[k] for k in _REMINDER_FIELDS if payload.get(k) is not None}
    if not fields:
        return get_reminder(user_id, reminder_id)
    res = (
        _client()
        .table("reminders")
        .update(fields)
        .eq("id", reminder_id)
        .eq("user_id", user_id)
        .execute()
    )
    return res.data[0] if res.data else None


def cancel_reminder(user_id: str, reminder_id: str) -> dict | None:
    """Soft delete: status -> 'cancelled', row tetap ada untuk audit."""
    res = (
        _client()
        .table("reminders")
        .update({"status": "cancelled"})
        .eq("id", reminder_id)
        .eq("user_id", user_id)
        .execute()
    )
    return res.data[0] if res.data else None


def list_active_reminders(user_id: str) -> list[dict]:
    """Semua reminder aktif user, urut jadwal terdekat (untuk list view UI)."""
    res = (
        _client()
        .table("reminders")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "active")
        .order("scheduled_at", desc=False)
        .execute()
    )
    return res.data or []


def patch_reminder(user_id: str, reminder_id: str, fields: dict) -> dict | None:
    """Edit langsung dari UI kalender — bypass pending_actions (bukan via AI).

    Return None jika reminder tidak ditemukan / bukan milik user.
    """
    res = (
        _client()
        .table("reminders")
        .update(fields)
        .eq("id", reminder_id)
        .eq("user_id", user_id)
        .execute()
    )
    return res.data[0] if res.data else None


def get_reminder(user_id: str, reminder_id: str) -> dict | None:
    res = (
        _client()
        .table("reminders")
        .select("*")
        .eq("id", reminder_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None
