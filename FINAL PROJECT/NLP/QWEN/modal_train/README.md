# Training BioMistral & Qwen di Modal Labs — Tutorial Lengkap

Fine-tune (QLoRA) 2 model untuk Indonesian Medical QA di **Modal Labs** (1 GPU A100).
Ikuti dari atas ke bawah. Dua script terpisah, satu per model.

> **Tidak perlu HF token.** BioMistral & Qwen2.5 itu model **public** — langsung
> didownload tanpa login/lisensi.

> **Semua bug umum sudah dibereskan** di dalam tiap script (precision bf16, argumen TRL,
> memory/fragmentasi). Tinggal jalanin. Kalau tetap error, lihat **Troubleshooting**.

> **Modal itu BERBAYAR.** A100-40GB ~$2–4/jam. 7B 1 epoch (subset 15000) ~1–2 jam →
> ~$3–6 per model. Akun baru biasanya dapat kredit gratis ($30). Pantau pemakaian.

---

## Isi folder ini

| File | Untuk |
|---|---|
| `modal_qwen.py` | training Qwen2.5-7B-Instruct |
| `modal_biomistral.py` | training BioMistral-7B-DARE |
| `README.md` | tutorial ini |

Cara kerja Modal: kamu **tidak** buka notebook. Kamu jalankan perintah dari **terminal
lokal** (`modal run ...`); Modal menyewa GPU di cloud, menjalankan script-mu di sana, dan
mengembalikan log ke terminalmu.

---

## Yang disiapkan

1. Akun Modal (gratis daftar).
2. File data `train.jsonl`.
3. Python + terminal di komputermu.

---

## STEP 1 — Pasang Modal CLI + login

Di terminal (folder ini):

```bash
pip install modal
modal token new
```

`modal token new` membuka browser untuk login/daftar. Setelah ok, CLI terhubung.

> **Windows:** pakai **PowerShell**, jangan git-bash (git-bash merusak path saat upload).

## STEP 2 — Upload data ke Modal Volume

Volume = storage cloud Modal yang persist antar-run.

```powershell
modal volume create medqa-data
modal volume put medqa-data train.jsonl /train.jsonl
```

> Ganti `train.jsonl` dengan path file datamu kalau beda lokasi.

Cek terupload:

```powershell
modal volume ls medqa-data
```

Harus muncul `train.jsonl`. (Script membaca dari `/data/train.jsonl`.)

## STEP 3 — Jalankan training

Satu script per model. Pertama kali Modal build image (di-cache), sewa A100, jalan:

```powershell
modal run modal_qwen.py --subset 15000
modal run modal_biomistral.py --subset 15000
```

- `--subset`: jumlah baris dipakai (acak, seed 42). **Uji cepat dulu**: `--subset 500`.

> **Windows — wajib prefix `PYTHONUTF8=1`** biar tidak error `charmap codec '✓'`:
> ```powershell
> $env:PYTHONUTF8=1; modal run modal_qwen.py --subset 15000
> ```
> (sekali set permanen: `setx PYTHONUTF8 1` lalu buka ulang terminal)

Log training (loss tiap 20 step, progress bar) **stream langsung ke terminalmu**.

## STEP 4 — Pantau progress

Saat jalan akan terlihat:

```
{'loss': 1.66, 'grad_norm': 0.45, 'learning_rate': 1.4e-4, 'epoch': 0.39}
39%|███▉      | 180/460 [36:45<1:00:36, 12.99s/it]
```

- **loss harus turun** (mulai ~1.8, makin lama makin kecil; akhir bisa <1.0).
- Tiap 200 step ada `eval_loss`.

Mantau juga lewat **web**: buka URL run yang tercetak di awal, atau modal.com → **Apps**.
Atau dari terminal lain:

```powershell
modal app logs <app-id>
```

## STEP 5 — Ambil adapter hasil

Output di Volume `medqa-output`, folder `qwen-id-lora` / `biomistral-id-lora`.

```powershell
modal volume get medqa-output /qwen-id-lora ./
modal volume get medqa-output /biomistral-id-lora ./
```

Tiap folder berisi adapter LoRA (~100–200 MB): `adapter_model.safetensors`,
`adapter_config.json`, file tokenizer. Inilah yang dipakai untuk RAG / inference.

---

## Resume kalau putus

Checkpoint disimpan ke Volume tiap 200 step. Kalau job mati/dihentikan, **jalankan
perintah yang sama lagi** — script otomatis lanjut dari checkpoint terakhir di Volume.
Modal auto-commit volume saat container berhenti, jadi checkpoint selamat walau crash.

---

## Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| `charmap codec can't encode '✓'` | console Windows bukan UTF-8 | prefix `$env:PYTHONUTF8=1;` sebelum `modal run` |
| File nyasar ke `C:` di volume | `modal volume put` dijalankan di git-bash (path ke-mangle) | jalankan dari **PowerShell** |
| `FileNotFoundError /data/train.jsonl` | data belum diupload / nama beda | STEP 2 ulang; `modal volume ls medqa-data` pastikan ada `train.jsonl` |
| `CUDA out of memory` | spike memory / fragmentasi | sudah dimitigasi (`expandable_segments`). Kalau masih: turunkan `per_device_train_batch_size` 4→2 di script model-nya |
| `modal: command not found` | CLI belum kepasang | `pip install modal` |
| Build image lama | normal sekali di awal | image di-cache, run berikutnya cepat |

> Error precision (`BFloat16`/`fp16`) dan argumen `max_seq_length` yang dulu bikin gagal
> **sudah dibereskan** di tiap script.

---

## Catatan

- Keduanya: 1 epoch, subset 15000 (acak seed 42), LoRA r=16, LR 2e-4, seq 1536,
  effective batch 32 — **resep sama** supaya perbandingan antar model adil.
- Estimasi: ~1–2 jam per model di A100-40GB.
- GPU lebih murah: ganti `gpu="A100-40GB"` di script model jadi `gpu="A10G"` (24GB, lebih
  murah; cukup untuk 7B tapi lebih mepet). A100 lebih aman.
- Uji cepat dulu: `--subset 500` (~5–10 menit). Kalau lewat step 20 (muncul loss) dan
  selesai → jalankan full `--subset 15000`.
