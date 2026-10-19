"""Klasifikasi intent balasan konfirmasi user (PRD §9 poin 4).

Sengaja keyword matching sederhana, BUKAN LLM call — deterministik, gratis
(hemat kuota Gemini free tier), dan tegas membedakan "ya" (konfirmasi) vs
"ya, tapi..." (koreksi).

Kontrak pemakaian: fungsi ini hanya dipanggil ketika user PUNYA pending_action
berstatus waiting_confirmation. Hasil "unclear" berarti pesan diperlakukan
sebagai pesan baru → proses ulang lewat extraction (Fase 2) dengan context
pending_actions yang belum confirmed.

Heuristik (urutan penting):
1. Ada penanda koreksi/permintaan baru ("tapi", "bukan", "maksudnya", "ganti",
   "lupa", dst) → unclear, biar extraction yang memproses ulang.
2. Pesan panjang (> 6 kata) → unclear; balasan konfirmasi murni itu pendek.
3. Ada frasa penolakan ("gajadi", "batal", "jangan", dst) → reject.
4. SEMUA kata termasuk kosakata setuju ("ya", "oke", "gas", dst) → confirm.
5. Selain itu → unclear.
"""

import re
from typing import Literal

Intent = Literal["confirm", "reject", "unclear"]

# Penanda koreksi atau permintaan baru → bukan jawaban konfirmasi murni
_CORRECTION_TOKENS = {
    "tapi", "tp", "bukan", "salah", "maksudku", "maksudnya", "maksud",
    "harusnya", "seharusnya", "ganti", "ubah", "eh", "revisi",
    "lupa", "ingetin", "ingatkan",
}

# Frasa penolakan total (dicek sebagai substring dengan batas kata)
_REJECT_PHRASES = (
    "gajadi", "ga jadi", "gak jadi", "nggak jadi", "enggak jadi", "tidak jadi",
    "batal", "batalin", "batalkan", "cancel",
    "jangan", "tolak", "skip",
    "gausah", "ga usah", "gak usah", "nggak usah", "tidak usah",
    "no", "tidak", "gak", "nggak", "engga", "enggak",
)

# Kosakata setuju — confirm hanya jika SEMUA kata pesan ada di sini
_CONFIRM_WORDS = {
    "ya", "iya", "iyaa", "yaa", "y", "yup", "yes", "yoi",
    "betul", "bener", "benar", "setuju", "boleh",
    "oke", "ok", "okay", "okee", "okeh", "sip", "siap", "mantap",
    "gas", "gaskeun", "lanjut", "lanjutkan",
    "simpan", "save", "confirm", "konfirmasi",
    "deh", "aja", "dong", "banget",  # partikel penegas: "oke deh", "gas aja"
}


def classify_confirmation_intent(text: str) -> Intent:
    normalized = re.sub(r"[^\w\s]", " ", text.lower())
    normalized = " ".join(normalized.split())
    if not normalized:
        return "unclear"

    words = normalized.split()

    # 1. koreksi / permintaan baru → serahkan ke extraction
    if set(words) & _CORRECTION_TOKENS:
        return "unclear"

    # 2. pesan panjang hampir pasti bukan jawaban ya/tidak murni
    if len(words) > 6:
        return "unclear"

    # 3. penolakan menang atas kata setuju ("ya udah batal aja" → reject)
    padded = f" {normalized} "
    if any(f" {phrase} " in padded for phrase in _REJECT_PHRASES):
        return "reject"

    # 4. konfirmasi hanya jika seluruh kata adalah kosakata setuju
    if set(words) <= _CONFIRM_WORDS:
        return "confirm"

    return "unclear"
