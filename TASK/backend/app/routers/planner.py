"""Router modul AI Planner.

Endpoint:
- POST /api/planner/chat      — orkestrator satu pintu untuk frontend chat
- POST /api/planner/extract   — Prompt A: ekstraksi pesan user
- POST /api/planner/respond   — Prompt B: balasan klarifikasi/konfirmasi
- POST /api/planner/confirm   — eksekusi/penolakan pending action
- GET  /api/planner/pending   — pending actions yang menunggu konfirmasi
- GET  /api/planner/reminders — reminder aktif user (untuk list view)
"""

from datetime import datetime
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException, Query

from app.config import get_settings
from app.schemas.planner import (
    ActionResult,
    CalendarResponse,
    ChatHistoryResponse,
    ChatRequest,
    ChatResponse,
    ConfirmRequest,
    ConfirmResponse,
    ExtractRequest,
    ExtractResponse,
    PendingListResponse,
    ReminderItem,
    ReminderPatchRequest,
    RemindersResponse,
    RespondRequest,
    RespondResponse,
)
from app.services import (
    calendar_service,
    gemini_conversational,
    gemini_extractor,
    supabase_service,
)
from app.services.intent_classifier import classify_confirmation_intent

router = APIRouter(prefix="/api/planner", tags=["planner"])

_NO_ACTION_REPLY = (
    "Hmm, aku belum menangkap ada reminder dari pesan itu. "
    "Coba ceritakan mau diingatkan soal apa dan kapan ya."
)


# ---------------------------------------------------------------------------
# Helper internal — dipakai lintas endpoint
# ---------------------------------------------------------------------------


def _resolve_user_id(user_id: UUID | None) -> str:
    """Mode personal: request tanpa user_id memakai DEFAULT_USER_ID dari .env."""
    if user_id is not None:
        return str(user_id)
    default = get_settings().default_user_id
    if not default:
        raise HTTPException(
            status_code=500,
            detail="DEFAULT_USER_ID belum diisi di backend/.env "
            "(UUID user pemilik di Supabase auth.users)",
        )
    return default


def _run_extraction(user_id: str, message: str) -> ExtractResponse:
    """Alur Fase 2: Prompt A -> chat_logs -> staging pending_actions."""
    now = datetime.now(ZoneInfo(get_settings().app_timezone))

    # 1. Context reminder aktif untuk matching update/delete (PRD §10)
    active_reminders = supabase_service.fetch_active_reminders(user_id)

    # 2. Prompt A — Extraction via Gemini structured output
    try:
        result = gemini_extractor.extract_actions(message, active_reminders, now)
    except gemini_extractor.GeminiRateLimitError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except gemini_extractor.GeminiExtractionError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    # 3. Audit trail: pesan user + extracted_json mentah ke chat_logs (PRD §7.3)
    chat_log_id = supabase_service.insert_chat_log(
        user_id, "user", message, result.model_dump(mode="json")
    )

    # 4. Staging: hanya action tanpa ambiguitas yang masuk pending_actions,
    #    menunggu konfirmasi eksplisit user (PRD §9)
    actions_out: list[ActionResult] = []
    for action in result.actions:
        needs_clarification = bool(action.ambiguous_fields)
        pending_action_id = None
        if not needs_clarification:
            pending_action_id = supabase_service.insert_pending_action(
                user_id, chat_log_id, action.model_dump(mode="json")
            )
        actions_out.append(
            ActionResult(
                **action.model_dump(),
                needs_clarification=needs_clarification,
                pending_action_id=pending_action_id,
            )
        )

    return ExtractResponse(chat_log_id=chat_log_id, actions=actions_out)


def _generate_reply(actions: list[dict]) -> str:
    """Router Prompt B (PRD §6.1): ambigu → klarifikasi, lengkap → konfirmasi."""
    if not actions:
        return _NO_ACTION_REPLY
    has_ambiguous = any(a.get("ambiguous_fields") for a in actions)
    mode = "clarification" if has_ambiguous else "confirmation"
    return gemini_conversational.generate_reply(mode, actions)


def _execute_decision(pending: dict, decision: str) -> ConfirmResponse:
    """Terapkan keputusan user atas satu pending action (status sudah
    dipastikan 'waiting_confirmation' oleh pemanggil)."""
    user_id = pending["user_id"]

    if decision == "reject":
        supabase_service.set_pending_action_status(pending["id"], "rejected")
        reply = "Oke, dibatalkan ya. Tidak ada yang disimpan."
        supabase_service.insert_chat_log(user_id, "assistant", reply)
        return ConfirmResponse(reply_text=reply, status="rejected")

    # decision == "confirm": apply payload ke reminders sesuai action_type.
    # Status pending baru diubah SETELAH apply sukses, supaya kegagalan di
    # tengah tidak meninggalkan pending 'confirmed' tanpa efek (PRD §7.4).
    payload = pending.get("payload") or {}
    action_type = pending["action_type"]

    if action_type == "create":
        reminder = supabase_service.create_reminder(
            user_id, payload, pending.get("chat_log_id")
        )
    else:  # update / delete butuh target
        target_id = pending.get("target_id")
        if not target_id:
            raise HTTPException(
                status_code=422,
                detail=f"pending action '{action_type}' tidak punya target_id",
            )
        if action_type == "update":
            reminder = supabase_service.update_reminder(user_id, target_id, payload)
        else:  # delete → soft delete (status 'cancelled'), bukan hard delete
            reminder = supabase_service.cancel_reminder(user_id, target_id)
        if reminder is None:
            raise HTTPException(
                status_code=404, detail="reminder target tidak ditemukan"
            )

    supabase_service.set_pending_action_status(pending["id"], "confirmed")

    reply = gemini_conversational.generate_reply(
        "acknowledgement", [{**payload, "type": action_type}]
    )
    supabase_service.insert_chat_log(user_id, "assistant", reply)
    return ConfirmResponse(
        reply_text=reply, status="confirmed", reminder_id=reminder["id"]
    )


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    """Orkestrator satu pintu (PRD §6.1 + §9).

    Jika user punya pending action yang menunggu konfirmasi, pesan
    diklasifikasi dulu dengan keyword matching (bukan LLM):
    - confirm/reject → eksekusi/tolak pending TERBARU
    - unclear → diperlakukan sebagai pesan baru → extraction ulang
    """
    user_id = _resolve_user_id(req.user_id)

    waiting = supabase_service.list_waiting_pending_actions(user_id)
    if waiting:
        intent = classify_confirmation_intent(req.message)
        if intent != "unclear":
            supabase_service.insert_chat_log(user_id, "user", req.message)
            result = _execute_decision(waiting[0], intent)
            return ChatResponse(reply_text=result.reply_text, intent=intent)

    extraction = _run_extraction(user_id, req.message)
    action_dicts = [
        a.model_dump(mode="json", exclude={"needs_clarification", "pending_action_id"})
        for a in extraction.actions
    ]
    reply = _generate_reply(action_dicts)
    supabase_service.insert_chat_log(user_id, "assistant", reply)
    return ChatResponse(
        reply_text=reply,
        intent="extract",
        chat_log_id=extraction.chat_log_id,
        actions=extraction.actions,
    )


@router.post("/extract", response_model=ExtractResponse)
def extract_planner_actions(req: ExtractRequest) -> ExtractResponse:
    return _run_extraction(_resolve_user_id(req.user_id), req.message)


@router.post("/respond", response_model=RespondResponse)
def respond(req: RespondRequest) -> RespondResponse:
    """Prompt B — pilih mode klarifikasi/konfirmasi dari hasil extraction.

    Mode acknowledgement TIDAK lewat sini; ia dipicu oleh /confirm setelah
    data benar-benar ter-apply (PRD §8.2: Prompt B tidak memicu eksekusi DB).
    """
    if req.chat_log_id is not None:
        chat_log = supabase_service.get_chat_log(str(req.chat_log_id))
        if chat_log is None:
            raise HTTPException(status_code=404, detail="chat_log tidak ditemukan")
        user_id = chat_log["user_id"]
        extracted = chat_log.get("extracted_json") or {}
        actions = extracted.get("actions") or []
    else:
        user_id = _resolve_user_id(req.user_id)
        actions = [a.model_dump(mode="json") for a in req.actions]

    reply = _generate_reply(actions)
    supabase_service.insert_chat_log(user_id, "assistant", reply)
    return RespondResponse(reply_text=reply)


@router.post("/confirm", response_model=ConfirmResponse)
def confirm_pending_action(req: ConfirmRequest) -> ConfirmResponse:
    """Eksekusi atau tolak satu pending action.

    decision datang sudah terklasifikasi (tombol frontend, atau hasil
    classify_confirmation_intent untuk balasan chat) — bukan raw text,
    sesuai PRD §9 poin 4.
    """
    pending = supabase_service.get_pending_action(str(req.pending_action_id))
    if pending is None:
        raise HTTPException(status_code=404, detail="pending action tidak ditemukan")
    if pending["status"] != "waiting_confirmation":
        raise HTTPException(
            status_code=409,
            detail=f"pending action sudah berstatus '{pending['status']}'",
        )
    return _execute_decision(pending, req.decision)


@router.get("/pending", response_model=PendingListResponse)
def list_pending_actions(user_id: UUID | None = None) -> PendingListResponse:
    """Pending actions user yang masih 'waiting_confirmation' — untuk
    restore UI konfirmasi saat user reload halaman."""
    rows = supabase_service.list_waiting_pending_actions(_resolve_user_id(user_id))
    return PendingListResponse(pending_actions=rows)


@router.get("/reminders", response_model=RemindersResponse)
def list_active_reminders(user_id: UUID | None = None) -> RemindersResponse:
    """Reminder aktif user untuk ReminderListView (PRD §11: list terjadwal)."""
    rows = supabase_service.list_active_reminders(_resolve_user_id(user_id))
    return RemindersResponse(reminders=rows)


@router.get("/calendar", response_model=CalendarResponse)
def calendar_month(
    month: str = Query(pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    user_id: UUID | None = None,
) -> CalendarResponse:
    """Occurrence semua reminder aktif dalam satu bulan (YYYY-MM).

    Recurring di-expand jadi tanggal aktual di backend (calendar_service),
    supaya frontend tinggal render.
    """
    year, mon = (int(part) for part in month.split("-"))
    rows = supabase_service.list_active_reminders(_resolve_user_id(user_id))
    tz = ZoneInfo(get_settings().app_timezone)
    occurrences = calendar_service.expand_month(rows, year, mon, tz)
    return CalendarResponse(month=month, occurrences=occurrences)


@router.patch("/reminders/{reminder_id}", response_model=ReminderItem)
def patch_reminder(
    reminder_id: UUID,
    req: ReminderPatchRequest,
    user_id: UUID | None = None,
) -> ReminderItem:
    """Edit langsung dari kalender — BYPASS pending_actions (PRD flow konfirmasi
    hanya untuk perubahan via AI; edit manual di UI langsung diterapkan).

    Juga dipakai untuk 'tandai selesai' (status=done) dan hapus
    (status=cancelled, soft delete — konsisten dengan flow chat Fase 3).
    Catatan v1: perubahan pada reminder recurring berlaku untuk SELURUH
    rangkaian (tidak ada exception per-occurrence).
    """
    fields = req.model_dump(exclude_unset=True, mode="json")
    if not fields:
        raise HTTPException(status_code=422, detail="tidak ada field yang diubah")
    # jaga konsistensi: recurrence_days hanya relevan untuk weekly
    if fields.get("recurrence") and fields["recurrence"] != "weekly":
        fields["recurrence_days"] = None

    updated = supabase_service.patch_reminder(
        _resolve_user_id(user_id), str(reminder_id), fields
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="reminder tidak ditemukan")
    return updated


@router.get("/history", response_model=ChatHistoryResponse)
def chat_history(
    user_id: UUID | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    before: datetime | None = None,
) -> ChatHistoryResponse:
    """Riwayat chat dengan pagination cursor.

    Query mengambil terbaru-dulu (descending) supaya halaman pertama selalu
    pesan terkini, lalu dibalik jadi ascending untuk langsung dirender.
    `before` = created_at pesan paling lama yang sudah dimuat ("load more").
    """
    rows = supabase_service.list_chat_history(
        _resolve_user_id(user_id),
        limit,
        before.isoformat() if before else None,
    )
    has_more = len(rows) > limit
    page = rows[:limit]
    page.reverse()  # lama → baru untuk ditampilkan
    return ChatHistoryResponse(messages=page, has_more=has_more)
