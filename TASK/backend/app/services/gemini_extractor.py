"""Service layer Prompt A — Extraction (PRD §8.1).

Memanggil Gemini API dengan structured output mode (response_schema dari
Pydantic model), BUKAN sekadar instruksi "balas dengan JSON" di prompt.
Retry sederhana max 1x untuk rate limit / output tidak sesuai schema.
"""

import json
import time
from datetime import datetime

from google.genai import errors, types
from pydantic import ValidationError

from app.config import get_settings
from app.schemas.planner import ExtractionResult
from app.services.gemini_client import get_client

_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

# 429 = rate limit free tier; 500/503 = error sementara di sisi Gemini
_RETRYABLE_STATUS = {429, 500, 503}


class GeminiExtractionError(Exception):
    """Gagal mendapatkan hasil extraction valid dari Gemini."""


class GeminiRateLimitError(GeminiExtractionError):
    """Masih kena rate limit Gemini setelah retry."""


def _system_prompt(now: datetime, active_reminders: list[dict]) -> str:
    reminders_json = (
        json.dumps(active_reminders, ensure_ascii=False, default=str)
        if active_reminders
        else "(tidak ada reminder aktif)"
    )
    return f"""Kamu adalah mesin ekstraksi (Prompt A) untuk modul AI Planner aplikasi Karsa.
Tugasmu SATU-SATUNYA: mengubah satu pesan user menjadi array aksi terstruktur
(create/update/delete reminder) sesuai schema. Kamu bukan chatbot — jangan
menyapa, jangan menjelaskan, jangan menghasilkan teks apa pun di luar JSON.

KONTEKS WAKTU SAAT INI:
- Sekarang: {now.isoformat()} ({_HARI[now.weekday()]}, zona waktu {now.tzname()})
- Gunakan ini HANYA untuk menghitung tanggal relatif yang jamnya eksplisit,
  misal "besok jam 6 pagi" -> tanggal besok pukul 06:00 dalam ISO8601 lengkap.

REMINDER AKTIF USER (context untuk matching update/delete):
{reminders_json}

ATURAN WAJIB:
1. DILARANG mengisi nilai default hasil tebakan. Jika jam tidak disebut
   eksplisit ("besok pagi", "nanti sore", "minggu depan"), maka
   scheduled_at = null dan "scheduled_at" wajib masuk ambiguous_fields.
   Jangan pernah memilih jam sendiri.
2. target_id hanya boleh diisi jika pesan user cocok secara JELAS dengan tepat
   satu reminder aktif pada daftar di atas (pakai id dari daftar). Jika ada
   lebih dari satu kandidat yang mungkin cocok, target_id = null dan
   "target_id" masuk ambiguous_fields — jangan menebak. Untuk type "create",
   target_id selalu null.
3. confirmation_text hanya diisi jika ambiguous_fields KOSONG: satu kalimat
   ringkas bahasa Indonesia yang mendeskripsikan aksi, contoh:
   "Buat reminder 'Olahraga' tiap hari jam 06.00". Jika ambiguous_fields
   tidak kosong, confirmation_text = null.
4. recurrence_days memakai ISO weekday (1=Senin ... 7=Minggu) dan hanya diisi
   saat recurrence = "weekly"; selain itu null.
5. category dipilih dari isi pesan (olahraga/obat -> health, bayar/tagihan ->
   finance, tugas/deadline -> task); jika tidak jelas gunakan "general".
6. Satu pesan bisa berisi beberapa aksi -> hasilkan satu elemen "actions"
   per aksi.
7. Output HANYA JSON valid sesuai schema, tanpa markdown atau teks tambahan.
   Semua field harus selalu ada meskipun nilainya null."""


def _normalize(result: ExtractionResult) -> ExtractionResult:
    """Validasi ulang aturan PRD di backend, jangan percaya LLM (PRD §14)."""
    for action in result.actions:
        if action.ambiguous_fields:
            # aturan (c): confirmation_text hanya saat tidak ada ambiguitas
            action.confirmation_text = None
        if action.type == "create":
            action.target_id = None
        if action.recurrence != "weekly":
            action.recurrence_days = None
    return result


def extract_actions(
    message: str, active_reminders: list[dict], now: datetime
) -> ExtractionResult:
    """Jalankan Prompt A. Raise GeminiExtractionError jika tetap gagal setelah retry."""
    settings = get_settings()
    config = types.GenerateContentConfig(
        system_instruction=_system_prompt(now, active_reminders),
        temperature=settings.gemini_temperature,
        response_mime_type="application/json",
        response_schema=ExtractionResult,
    )

    last_error: Exception | None = None
    for attempt in range(2):  # 1 percobaan + max 1 retry
        try:
            response = get_client().models.generate_content(
                model=settings.gemini_model,
                contents=message,
                config=config,
            )
            result = response.parsed
            if not isinstance(result, ExtractionResult):
                # fallback: SDK gagal parse otomatis, validasi manual dari teks
                result = ExtractionResult.model_validate_json(response.text or "")
            return _normalize(result)
        except errors.APIError as exc:
            last_error = exc
            if exc.code not in _RETRYABLE_STATUS:
                raise GeminiExtractionError(
                    f"Gemini API error {exc.code}: {exc.message}"
                ) from exc
            if attempt == 0:
                time.sleep(2)  # jeda singkat, free tier rate limit per menit
        except (ValidationError, ValueError) as exc:
            # output tidak sesuai schema -> coba sekali lagi
            last_error = exc

    if isinstance(last_error, errors.APIError) and last_error.code == 429:
        raise GeminiRateLimitError(
            "Gemini free tier sedang rate-limited. Coba lagi beberapa saat lagi."
        ) from last_error
    raise GeminiExtractionError(
        "Gemini tidak menghasilkan output sesuai schema setelah 1x retry."
    ) from last_error
