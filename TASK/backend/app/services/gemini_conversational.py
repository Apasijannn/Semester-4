"""Service layer Prompt B — Conversational (PRD §8.2).

Menerima output Prompt A (actions terstruktur, BUKAN raw chat) dan menghasilkan
balasan natural bahasa Indonesia dalam salah satu dari 3 mode:
clarification / confirmation / acknowledgement. Mode DIPILIH oleh layer
aplikasi (router), bukan oleh LLM.

Aturan PRD: Prompt B tidak pernah memicu eksekusi database — hanya teks.
Sengaja TANPA retry: jika Gemini gagal (rate limit free tier dsb), langsung
jatuh ke template deterministik supaya alur chat tidak pernah macet dan
kuota tidak terbakar untuk teks non-kritis.
"""

import json
import logging
from typing import Literal

from google.genai import errors, types

from app.config import get_settings
from app.services.gemini_client import get_client

logger = logging.getLogger(__name__)

ReplyMode = Literal["clarification", "confirmation", "acknowledgement"]

_SYSTEM_PROMPT = """Kamu adalah Karsa, asisten personal berbahasa Indonesia yang ramah,
santai tapi sopan, dan RINGKAS. Kamu menerima hasil ekstraksi terstruktur
(bukan chat mentah) dan tugasmu HANYA menyusun teks balasan — kamu tidak
pernah mengeksekusi apa pun ke database.

Mode balasan (diberikan di awal pesan):
- clarification: ada field ambigu. Ajukan pertanyaan spesifik HANYA untuk
  field yang tercantum di ambiguous_fields, maksimal satu pertanyaan ringkas
  per action. Jangan menanyakan field yang sudah jelas, jangan menanyakan
  semua field sekaligus kalau cuma satu yang ambigu.
- confirmation: semua field sudah jelas. Sampaikan isi confirmation_text
  (boleh diparafrase tipis, jangan mengubah fakta jam/hari/judul), lalu minta
  persetujuan eksplisit user, misal "Konfirmasi ya?".
- acknowledgement: aksi sudah berhasil diterapkan ke database. Satu kalimat
  singkat bahwa data sudah tersimpan (create) / diubah (update) /
  dibatalkan (delete).

Balas dalam 1-3 kalimat, tanpa markdown, tanpa emoji."""

# Pertanyaan template per field ambigu — dipakai fallback mode clarification
_FIELD_QUESTIONS = {
    "scheduled_at": "jam berapa tepatnya?",
    "target_id": "reminder yang mana yang kamu maksud?",
    "recurrence": "diulang tiap kapan (harian/mingguan/bulanan)?",
    "recurrence_days": "hari apa saja?",
    "category": "ini soal kesehatan, keuangan, atau tugas?",
    "title": "judulnya apa?",
}

_ACK_VERBS = {
    "create": "sudah tersimpan",
    "update": "sudah diperbarui",
    "delete": "sudah dibatalkan",
}


def generate_reply(mode: ReplyMode, actions: list[dict]) -> str:
    """Hasilkan balasan natural via Gemini; fallback ke template jika gagal."""
    settings = get_settings()
    contents = (
        f"MODE: {mode}\n"
        f"ACTIONS:\n{json.dumps(actions, ensure_ascii=False, default=str)}"
    )
    try:
        response = get_client().models.generate_content(
            model=settings.gemini_model,
            contents=contents,
            # Tanpa max_output_tokens: model thinking (Gemini 3+) memakai
            # budget token untuk reasoning dulu — cap kecil bikin jawaban
            # terpotong/kacau. Balasan Prompt B memang pendek secara alami.
            config=types.GenerateContentConfig(
                system_instruction=_SYSTEM_PROMPT,
                temperature=0.7,  # boleh lebih luwes daripada Prompt A
            ),
        )
        text = (response.text or "").strip()
        if text:
            return text
        logger.warning("Prompt B: respons kosong, pakai template fallback")
    except errors.APIError as exc:
        logger.warning("Prompt B gagal (%s), pakai template fallback", exc)
    return fallback_reply(mode, actions)


def fallback_reply(mode: ReplyMode, actions: list[dict]) -> str:
    """Balasan deterministik tanpa LLM — dijamin selalu menghasilkan teks."""
    if mode == "clarification":
        lines = []
        for action in actions:
            fields = action.get("ambiguous_fields") or []
            if not fields:
                continue
            questions = " dan ".join(
                _FIELD_QUESTIONS.get(f, f"detail '{f}'-nya gimana?") for f in fields
            )
            lines.append(f"Untuk '{action.get('title', 'reminder ini')}', {questions}")
        return "\n".join(lines) or "Boleh dijelaskan lagi detailnya?"

    if mode == "confirmation":
        texts = [
            action.get("confirmation_text") or action.get("title", "aksi ini")
            for action in actions
            if not action.get("ambiguous_fields")
        ]
        if len(texts) == 1:
            return f"Oke: {texts[0]}. Konfirmasi ya?"
        bullets = "\n".join(f"- {t}" for t in texts)
        return f"Oke, aku mau melakukan ini:\n{bullets}\nKonfirmasi ya?"

    # acknowledgement — dipanggil per satu action yang baru di-apply
    action = actions[0] if actions else {}
    verb = _ACK_VERBS.get(action.get("type", "create"), "sudah diproses")
    title = action.get("title")
    return f"Sip, reminder '{title}' {verb}." if title else f"Sip, {verb}."
