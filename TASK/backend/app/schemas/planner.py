"""Pydantic models untuk Prompt A — Extraction (PRD §8.1).

ExtractedAction / ExtractionResult dipakai untuk DUA hal sekaligus:
1. responseSchema Gemini (structured output mode) — bentuknya harus persis
   skema di PRD §8.1, semua field selalu ada meskipun null.
2. Validasi ulang di backend sebelum hasil masuk ke pending_actions (PRD §14).
"""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class ExtractedAction(BaseModel):
    """Satu aksi hasil ekstraksi dari pesan user."""

    type: Literal["create", "update", "delete"]
    target_id: Optional[str] = None
    title: str
    category: Literal["health", "finance", "task", "general"] = "general"
    scheduled_at: Optional[str] = None  # ISO8601; null jika waktu ambigu
    recurrence: Literal["none", "daily", "weekly", "monthly"] = "none"
    recurrence_days: Optional[list[int]] = None  # ISO weekday 1=Senin..7=Minggu
    ambiguous_fields: list[str] = Field(default_factory=list)
    confirmation_text: Optional[str] = None  # hanya terisi jika tidak ambigu


class ExtractionResult(BaseModel):
    """Output lengkap Prompt A — dipakai sebagai responseSchema Gemini."""

    actions: list[ExtractedAction] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Request/response API
# ---------------------------------------------------------------------------


class ExtractRequest(BaseModel):
    # null → backend memakai DEFAULT_USER_ID (mode personal single-user)
    user_id: Optional[UUID] = None
    message: str = Field(min_length=1, max_length=4000)


class ActionResult(ExtractedAction):
    """ExtractedAction + status pemrosesan di sisi backend."""

    needs_clarification: bool
    # Terisi hanya jika action sudah masuk staging pending_actions
    pending_action_id: Optional[UUID] = None


class ExtractResponse(BaseModel):
    chat_log_id: UUID
    actions: list[ActionResult]


# ---------------------------------------------------------------------------
# Prompt B — /respond
# ---------------------------------------------------------------------------


class RespondRequest(BaseModel):
    """Sumber actions: chat_log_id (ambil extracted_json dari DB) ATAU
    kirim langsung actions hasil /extract (wajib disertai user_id)."""

    chat_log_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    actions: Optional[list[ExtractedAction]] = None

    @model_validator(mode="after")
    def _validate_source(self) -> "RespondRequest":
        if self.chat_log_id is None and not self.actions:
            raise ValueError("isi chat_log_id atau actions")
        return self


class RespondResponse(BaseModel):
    reply_text: str


# ---------------------------------------------------------------------------
# Konfirmasi — /confirm
# ---------------------------------------------------------------------------


class ConfirmRequest(BaseModel):
    """decision sudah diklasifikasi eksplisit di frontend (tombol) atau lewat
    classify_confirmation_intent() — endpoint ini tidak menerima raw text."""

    pending_action_id: UUID
    decision: Literal["confirm", "reject"]


class ConfirmResponse(BaseModel):
    reply_text: str
    status: Literal["confirmed", "rejected"]
    # id reminder yang dibuat/diubah/dibatalkan (null jika rejected)
    reminder_id: Optional[UUID] = None


# ---------------------------------------------------------------------------
# Daftar pending — GET /pending
# ---------------------------------------------------------------------------


class PendingActionItem(BaseModel):
    id: UUID
    action_type: Literal["create", "update", "delete"]
    target_id: Optional[UUID] = None
    payload: dict
    confirmation_text: Optional[str] = None
    chat_log_id: UUID
    created_at: datetime


class PendingListResponse(BaseModel):
    pending_actions: list[PendingActionItem]


# ---------------------------------------------------------------------------
# Daftar reminder aktif — GET /reminders (untuk ReminderListView frontend)
# ---------------------------------------------------------------------------


class ReminderItem(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    category: Literal["health", "finance", "task", "general"]
    scheduled_at: Optional[datetime] = None
    recurrence: Literal["none", "daily", "weekly", "monthly"]
    recurrence_days: Optional[list[int]] = None
    status: str
    routine_id: Optional[UUID] = None
    created_at: datetime


class RemindersResponse(BaseModel):
    reminders: list[ReminderItem]


# ---------------------------------------------------------------------------
# Chat orchestrator — POST /chat (satu pintu untuk frontend)
# ---------------------------------------------------------------------------


class ChatRequest(BaseModel):
    # null → backend memakai DEFAULT_USER_ID (mode personal single-user)
    user_id: Optional[UUID] = None
    message: str = Field(min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    reply_text: str
    # bagaimana pesan diproses: balasan konfirmasi/penolakan pending,
    # atau pesan baru yang lewat jalur extraction
    intent: Literal["confirm", "reject", "extract"]
    chat_log_id: Optional[UUID] = None
    actions: list[ActionResult] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Riwayat chat — GET /history (pagination cursor, tanpa extracted_json)
# ---------------------------------------------------------------------------


class ChatHistoryMessage(BaseModel):
    id: UUID
    role: Literal["user", "assistant"]
    message: str
    created_at: datetime


class ChatHistoryResponse(BaseModel):
    # urut ascending (lama → baru), siap render langsung
    messages: list[ChatHistoryMessage]
    has_more: bool


# ---------------------------------------------------------------------------
# Kalender — GET /calendar (recurring di-expand jadi occurrence per tanggal)
# ---------------------------------------------------------------------------


class CalendarOccurrence(BaseModel):
    date: str  # YYYY-MM-DD dalam timezone aplikasi
    scheduled_at: datetime  # waktu lengkap occurrence ini
    reminder_id: UUID
    title: str
    description: Optional[str] = None
    category: Literal["health", "finance", "task", "general"]
    recurrence: Literal["none", "daily", "weekly", "monthly"]
    recurrence_days: Optional[list[int]] = None
    status: str


class CalendarResponse(BaseModel):
    month: str  # YYYY-MM yang diminta
    occurrences: list[CalendarOccurrence]  # urut waktu ascending


# ---------------------------------------------------------------------------
# Edit langsung dari kalender — PATCH /reminders/{id} (bypass pending_actions,
# karena user mengedit manual di UI, bukan lewat AI extraction)
# ---------------------------------------------------------------------------


class ReminderPatchRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1)
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    category: Optional[Literal["health", "finance", "task", "general"]] = None
    recurrence: Optional[Literal["none", "daily", "weekly", "monthly"]] = None
    recurrence_days: Optional[list[int]] = None
    # 'done' = tandai selesai; 'cancelled' = soft delete (sama seperti chat)
    status: Optional[Literal["active", "done", "skipped", "cancelled"]] = None
