# PRD: Karsa — Modul AI Planner (Conversational Reminder & Routine Assistant)

**Versi:** 1.0
**Tanggal:** 11 Juli 2026
**Status:** Draft untuk development

---

## 1. Latar Belakang

Karsa adalah aplikasi personal assistant dengan beberapa modul (Dashboard, Health Manager, Finance Manager, Task Manager, Skincare AI Assistant). Modul **AI Planner** menambahkan cara baru untuk mengelola reminder dan rutinitas harian: user cukup chat dengan bahasa natural, lalu AI mengekstrak, merapikan, dan menjadwalkan sebagai reminder/routine terstruktur — mirip Notion, tapi input sepenuhnya lewat percakapan.

## 2. Tujuan Produk

- User dapat membuat, mengubah, dan menghapus reminder/routine hanya lewat chat, tanpa perlu mengisi form manual.
- AI merapikan input tidak terstruktur (bahasa sehari-hari, campur waktu/kategori) menjadi data terjadwal yang konsisten.
- Semua perubahan data (create/update/delete) **wajib dikonfirmasi user** sebelum dieksekusi — tidak ada aksi otomatis tanpa persetujuan.

## 3. Non-Tujuan (Out of Scope untuk v1)

- Tidak membangun kalender visual drag-and-drop (cukup list/tabel terjadwal).
- Tidak ada notifikasi push real-time di v1 (opsional Telegram bot menyusul).
- Tidak menangani voice input.
- Tidak ada multi-user/shared routine (kolaborasi) di v1.

## 4. User Persona

**Zhan** — mahasiswa & developer yang punya banyak aktivitas (kuliah, project, olahraga, rutinitas pribadi), ingin mencatat semua itu tanpa friksi membuka form Notion setiap kali, cukup lewat chat singkat.

## 5. User Stories

| # | Sebagai user, saya ingin... | Supaya... |
|---|---|---|
| 1 | Chat "besok olahraga jam 6 pagi" | otomatis dibuatkan reminder tanpa isi form |
| 2 | Chat "tiap hari senin rabu jumat les jam 4 sore" | dibuatkan reminder recurring dengan hari spesifik |
| 3 | Diberi konfirmasi sebelum data tersimpan | tidak ada reminder salah yang ke-save tanpa sadar |
| 4 | Ditanya balik kalau waktu tidak jelas ("nanti sore") | tidak ada asumsi waktu yang salah dari AI |
| 5 | Bisa update reminder lewat chat ("ubah jam meeting jadi jam 11") | tidak perlu cari & edit manual di UI |
| 6 | Bisa hapus reminder lewat chat | pengelolaan tetap satu pintu (chat) |
| 7 | Melihat daftar reminder/routine aktif dalam tampilan terstruktur | tetap ada overview meski input via chat |

## 6. Arsitektur Solusi

### 6.1 Alur Umum

```
User message
    │
    ▼
[Prompt A — Extraction]  (Gemini, structured output)
    │  → JSON actions (create/update/delete) + ambiguous_fields + confirmation_text
    ▼
Router:
    - ada ambiguous_fields?  → [Prompt B: Klarifikasi] → tanya balik user
    - semua field lengkap?   → [Prompt B: Konfirmasi] → tampilkan confirmation_text, tunggu approve
    ▼
User approve ("ya"/"betul")
    │
    ▼
Eksekusi ke database (reminders / routines)
    │
    ▼
[Prompt B: Acknowledgement] → konfirmasi ke user bahwa data tersimpan
```

### 6.2 Dua-Tahap Prompt (alasan pemisahan)

Extraction dan percakapan dipisah supaya:
- Extraction bisa pakai *structured output* / low temperature → hasil JSON stabil dan mudah divalidasi.
- Conversational reply tetap natural tanpa risiko merusak parsing JSON.
- Keduanya bisa ditest terpisah (extraction: unit test terhadap skema; conversational: uji kualitatif nada bicara).

## 7. Struktur Data (Supabase / PostgreSQL)

### 7.1 `reminders`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK | |
| title | text | |
| description | text, nullable | |
| category | enum: health, finance, task, general | |
| scheduled_at | timestamp | waktu spesifik pertama |
| recurrence | enum: none, daily, weekly, monthly | default `none` |
| recurrence_days | int[], nullable | untuk weekly, misal `[1,3,5]` = Senin/Rabu/Jumat |
| status | enum: active, done, skipped, cancelled | |
| routine_id | uuid, FK → routines, nullable | |
| source_chat_log_id | uuid, FK → chat_logs | audit trail asal pembuatan |
| created_at, updated_at | timestamp | |

### 7.2 `routines`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK | |
| name | text | misal "Rutinitas Pagi" |
| description | text, nullable | |
| created_at | timestamp | |

### 7.3 `chat_logs`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK | |
| role | enum: user, assistant | |
| message | text | |
| extracted_json | jsonb, nullable | hasil mentah dari Prompt A, untuk debug/audit |
| created_at | timestamp | |

### 7.4 `pending_actions` (staging area — wajib konfirmasi)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK | |
| action_type | enum: create, update, delete | |
| target_id | uuid, nullable | FK → reminders, diisi kalau update/delete |
| payload | jsonb | hasil extraction lengkap yang akan diterapkan |
| confirmation_text | text | kalimat ringkas yang ditampilkan ke user |
| status | enum: waiting_confirmation, confirmed, rejected, expired | |
| chat_log_id | uuid, FK → chat_logs | |
| created_at | timestamp | |

**Prinsip kunci:** tidak ada baris masuk/berubah di `reminders` sampai `pending_actions.status = confirmed`.

## 8. Spesifikasi Prompt

### 8.1 Prompt A — Extraction

**Tugas tunggal:** ubah 1 pesan user (+ context reminder aktif) menjadi array aksi terstruktur.

**Input ke prompt:**
- Pesan user saat ini
- Ringkasan reminder aktif user (id, title, scheduled_at, recurrence) — untuk keperluan matching update/delete
- Tanggal & waktu saat ini (agar "besok", "nanti sore" bisa dihitung relatif, tapi tetap masuk `ambiguous_fields` jika tidak eksplisit)

**Output (structured output / responseSchema Gemini):**

```json
{
  "actions": [
    {
      "type": "create | update | delete",
      "target_id": "string | null",
      "title": "string",
      "category": "health | finance | task | general",
      "scheduled_at": "ISO8601 | null",
      "recurrence": "none | daily | weekly | monthly",
      "recurrence_days": [1,3,5] ,
      "ambiguous_fields": ["scheduled_at"],
      "confirmation_text": "Buat reminder 'Olahraga' tiap hari jam 6 pagi"
    }
  ]
}
```

**Aturan:**
- Field wajib selalu ada di output meskipun null, supaya parsing di sisi aplikasi konsisten.
- `ambiguous_fields` diisi kalau ada elemen yang tidak eksplisit dari chat (waktu relatif tanpa jam pasti, kategori tidak jelas, dsb) — AI **tidak boleh** menebak default.
- `confirmation_text` hanya diisi kalau `ambiguous_fields` kosong (semua field jelas).
- Temperature rendah (disarankan 0–0.3) untuk stabilitas format.

### 8.2 Prompt B — Conversational

Menerima output Prompt A (bukan raw chat), lalu memilih salah satu dari 3 mode respons:

1. **Klarifikasi** — jika ada `ambiguous_fields`. Tanya balik spesifik ke field yang kurang jelas, satu pertanyaan per aksi.
   > "Jam berapa nih maksudnya olahraga besok pagi?"

2. **Konfirmasi** — jika semua field lengkap. Tampilkan `confirmation_text`, minta approve eksplisit.
   > "Oke, aku mau buat reminder 'Olahraga' tiap hari jam 6 pagi. Konfirmasi ya?"

3. **Acknowledgement** — setelah user approve dan data berhasil masuk ke `reminders`.
   > "Sip, reminder olahraga tiap hari jam 6 pagi sudah tersimpan."

**Aturan:** Prompt B tidak pernah memicu eksekusi database secara langsung — hanya menghasilkan teks balasan. Eksekusi dipicu oleh layer aplikasi setelah mendeteksi konfirmasi eksplisit dari user (bukan LLM yang menentukan "sudah dikonfirmasi").

## 9. Alur Konfirmasi (Detail)

1. Extraction menghasilkan aksi lengkap → disimpan ke `pending_actions` dengan status `waiting_confirmation`.
2. Prompt B tampilkan `confirmation_text`.
3. User balas:
   - **Konfirmasi positif** ("ya", "betul", "gas", "oke") → aplikasi update `pending_actions.status = confirmed` → apply payload ke `reminders`/`routines` → trigger Prompt B mode Acknowledgement.
   - **Koreksi** ("bukan jam 6, jam 7") → pesan baru diproses ulang lewat Prompt A dengan context `pending_actions` yang belum confirmed, hasilkan revisi confirmation_text baru.
   - **Penolakan** ("gajadi", "batal") → `pending_actions.status = rejected`, tidak ada perubahan ke `reminders`.
4. Deteksi intent konfirmasi/penolakan sebaiknya **tidak** murni mengandalkan LLM freeform — gunakan klasifikasi sederhana (keyword matching atau small classification call) supaya tidak ambigu antara "ya" (konfirmasi) vs "ya, tapi..." (koreksi).

## 10. Matching untuk Update/Delete

Karena Gemini free tier tidak punya akses langsung ke database, proses matching dilakukan di layer aplikasi:
1. Sebelum memanggil Prompt A, aplikasi ambil daftar reminder aktif user (misal 20 terbaru/relevan) dan sisipkan sebagai context.
2. Prompt A mengisi `target_id` berdasarkan context tersebut jika user merujuk ke reminder existing.
3. Jika AI tidak yakin reminder mana yang dimaksud (lebih dari satu kandidat cocok), masukkan ke `ambiguous_fields` dan biarkan Prompt B menanyakan mana yang dimaksud.

## 11. Kriteria Sukses (Acceptance Criteria)

- [ ] User dapat membuat reminder single & recurring hanya lewat chat.
- [ ] Tidak ada data tersimpan ke `reminders` tanpa `pending_actions.status = confirmed`.
- [ ] Waktu ambigu selalu memicu pertanyaan balik, tidak pernah diisi default oleh AI.
- [ ] Update dan delete reminder existing bisa dilakukan via chat dengan matching yang akurat terhadap reminder aktif.
- [ ] Semua chat & hasil extraction tersimpan di `chat_logs` untuk audit/debug.
- [ ] UI menampilkan reminder/routine aktif dalam bentuk list/tabel terjadwal (bukan hanya riwayat chat).

## 12. Metrik Evaluasi (Development)

- **Extraction accuracy**: persentase pesan uji coba yang menghasilkan JSON valid sesuai skema (target >95%).
- **False default rate**: jumlah kasus AI mengisi `scheduled_at` tanpa dasar eksplisit dari chat (target: 0, karena wajib klarifikasi).
- **Confirmation friction**: rata-rata jumlah turn percakapan sebelum satu reminder berhasil confirmed (target ≤2 turn untuk kasus jelas).

## 13. Tech Stack

| Layer | Teknologi |
|---|---|
| LLM | Gemini API (free tier), structured output / function calling |
| Backend | FastAPI (konsisten dengan modul Karsa lain) |
| Database | Supabase (PostgreSQL) |
| Frontend | React + Vite + Tailwind |

## 14. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Gemini free tier rate limit | Batasi extraction call per pesan (1x per user message), cache context reminder aktif |
| JSON output tidak konsisten dari LLM | Gunakan `responseSchema` Gemini (structured output mode), validasi ulang di backend sebelum masuk `pending_actions` |
| Salah matching target_id saat update/delete | Selalu minta konfirmasi eksplisit + tampilkan title/waktu reminder yang akan diubah di `confirmation_text` |
| User mengetik banyak aksi dalam satu chat | Prompt A mendukung array `actions`, tiap aksi dapat `pending_actions` terpisah, dikonfirmasi satu per satu atau sekaligus (keputusan UX menyusul) |

## 15. Pertanyaan Terbuka (untuk fase berikutnya)

- Apakah konfirmasi multi-aksi dalam satu pesan dilakukan sekaligus (satu tombol "confirm all") atau satu per satu?
- Apakah perlu batas waktu `expired` untuk `pending_actions` yang tidak dikonfirmasi (misal auto-reject setelah 24 jam)?
- Bentuk UI untuk menampilkan `routine_id` grouping — apakah perlu tampilan terpisah dari reminder biasa?

---

*Dokumen ini adalah scoping awal untuk development Fase 1 modul AI Planner Karsa. Detail implementasi teknis (prompt final, schema Gemini, endpoint API) akan di-breakdown di tahap Claude Code development.*
