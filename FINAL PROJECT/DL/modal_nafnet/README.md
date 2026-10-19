# NAFNet-PINN — UIE Ablation Pipeline

Underwater image enhancement: **NAFNet backbone + Beer-Lambert PINN branch +
DINOv2 perceptual loss**. Ablation study 4 varian, train di Modal A100 40GB,
output lengkap untuk laporan penelitian.

Backbone = official **NAFNet SIDD-width32** (ECCV 2022), pretrained denoising
checkpoint di-fine-tune ke domain underwater. ~29M params, compute murah (~16 GMACs
@256px) → training cepat dan stabil.

| Variant | PINN | DINOv2 | Arti |
|---|---|---|---|
| A1 | — | — | NAFNet baseline |
| A2 | ✓ | — | + physics (Beer-Lambert) |
| A3 | — | ✓ | + perceptual (DINOv2) |
| A4 | ✓ | ✓ | full model |

Semua varian: epoch identik (50), batch identik (16), training set identik (LSUI 4279 pairs) → ablation adil.

**Optimisasi training:** AdamW (betas 0.9/0.9, ala NAFNet paper — lebih stabil) +
cosine LR schedule + warmup 3 epoch + EMA + gradient clipping + bf16 mixed precision.
Encoder pretrained di-freeze 2 epoch awal (soft warmup) supaya head PINN/output yang
random tidak merusak fitur pretrained, lalu full fine-tune.

---

## Prasyarat

- Python ≥ 3.9 di mesin lokal
- Akun [Modal](https://modal.com) (gratis, butuh kartu kredit untuk GPU)
- Akun [Kaggle](https://www.kaggle.com) (gratis)

---

## Langkah 0 — Setup satu kali (~15 menit)

### 0.1 Install Modal

```bash
pip install modal
```

Verifikasi:
```bash
modal --version
```

### 0.2 Login ke Modal

```bash
modal token new
```

Perintah ini membuka browser. Klik **"Allow"** di halaman Modal. Selesai kalau terminal
menampilkan `Web authentication finished successfully!`.

### 0.3 Dapatkan Kaggle API key

1. Buka [kaggle.com](https://www.kaggle.com) → klik foto profil di pojok kanan atas → **Settings**
2. Scroll ke bagian **API** → klik **Create New Token**
3. File `kaggle.json` otomatis ter-download. Buka file itu — isinya seperti ini:
   ```json
   {"username": "namakamu", "key": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
   ```
4. Catat `username` dan `key` dari file tersebut.

### 0.4 Buat Modal secret untuk Kaggle

Ganti `<username>` dan `<key>` dengan nilai dari `kaggle.json` tadi:

```bash
modal secret create kaggle-secret KAGGLE_USERNAME=<username> KAGGLE_KEY=<key>
```

Verifikasi berhasil:
```bash
modal secret list
```
Harus muncul `kaggle-secret` di daftar.

### 0.5 Accept rules dataset Kaggle di browser

Kaggle API butuh persetujuan rules sebelum bisa download. Buka ketiga link ini di browser,
login, dan klik tombol **"I Understand and Accept"** (atau **"Access Dataset"**) di masing-masing:

- [LSUI Dataset](https://www.kaggle.com/datasets/cbhavik/lsui-dataset)
- [UIEB Dataset Raw](https://www.kaggle.com/datasets/larjeck/uieb-dataset-raw)
- [UIEB Dataset Reference](https://www.kaggle.com/datasets/larjeck/uieb-dataset-reference)

> Kalau step ini dilewati, `download.py` akan gagal dengan error `403 Forbidden`.

### 0.6 Masuk ke folder pipeline

Semua perintah `modal run` harus dijalankan dari dalam folder `modal/`:

```bash
cd path/ke/fp/modal
```

---

## Langkah 1 — Download dataset & pretrained (jalankan sekali)

```bash
modal run download.py
```

Script ini otomatis:
- Download LSUI (4279 pasang gambar) dari Kaggle
- Download UIEB raw + reference dari Kaggle
- Download pretrained NAFNet (SIDD-width32, ~117 MB) dari HuggingFace
- Simpan semua ke Volume `uie-vol` di cloud (persisten, tidak hilang kalau koneksi putus)

**Output yang benar di akhir log:**
```
[download] counts: {'lsui_raw': 4279, 'lsui_ref': 4279, 'uieb_raw': 890, 'uieb_ref': 890}
[download] DONE
```

Kalau count tidak sesuai → lihat bagian Troubleshooting di bawah.

Re-run aman: kalau download sudah ada, script skip dan langsung `DONE`.

---

## Langkah 2 — Sanity check (opsional tapi disarankan, ~3–5 menit, murah)

Jalankan 1 epoch untuk memastikan GPU path, checkpoint, dan resume bekerja sebelum commit ke full run:

```bash
modal run train.py --variant A1 --smoke
```

Cek log-nya:
- Muncul `[pretrained] N/N checkpoint tensors loaded` (PINN branch missing = wajar) → pretrained termuat
- Muncul `loss=...` dan `val_psnr=...` → GPU forward/backward bekerja
- Muncul `[data] train=4279 pairs  val=890 pairs` → dataset terbaca

Lalu **jalankan ulang perintah yang sama** untuk tes resume:
```bash
modal run train.py --variant A1 --smoke
```
Harus muncul `[resume] from epoch 1` → crash-safe resume bekerja.

---

## Langkah 3 — Training

### Opsi A: Jalankan satu per satu (disarankan pertama kali)

**Mulai dari A1** — A1 adalah "decoder health probe". Kalau hasil A1 sudah mendekati
reference, berarti pretrained backbone berhasil transfer ke domain underwater.

```bash
modal run train.py --variant A1
```

Tunggu selesai (estimasi ~20–30 menit), lalu lanjut:

```bash
modal run train.py --variant A2
modal run train.py --variant A3
modal run train.py --variant A4
```

### Opsi B: Jalankan semua sekaligus (A1 → A4 sekuensial otomatis)

```bash
modal run train.py --all
```

### Informasi penting

**Auto-resume:** Kalau run terputus (koneksi mati, timeout, dll), cukup jalankan
perintah yang sama — training lanjut dari checkpoint terakhir secara otomatis.

**Estimasi waktu & biaya di A100 40GB** (angka kasar, 50 epoch @ 256px —
verifikasi dari log run pertama):

| Variant | Estimasi waktu | Est. biaya |
|---|---|---|
| A1 (tanpa DINOv2) | ~20–30 menit | ~$1–2 |
| A2 (tanpa DINOv2) | ~20–30 menit | ~$1–2 |
| A3 (ada DINOv2) | ~40–60 menit | ~$2–4 |
| A4 (ada DINOv2) | ~40–60 menit | ~$2–4 |
| **Total** | **~2.5–3.5 jam** | **~$8–12** |

**Ganti num_epochs:** Edit `num_epochs` di `configs/base.yaml`. **Jangan override
per-varian** — harus identik di semua varian agar ablation adil.

**Ganti batch_size:** Kalau OOM (tidak mungkin di A100 40GB, tapi kalau terjadi),
turunkan `batch_size` di `base.yaml` dan naikkan `accum_steps` supaya `batch × accum = 16`.

---

## Langkah 4 — Evaluasi

```bash
modal run evaluate.py --all
```

Script ini:
- Load `best.pt` (EMA weights) tiap varian
- Hitung PSNR, SSIM, LPIPS, UCIQE, UIQM di seluruh UIEB-890 (dengan TTA 8-way)
- Tulis `metrics.json` tiap varian
- Buat tabel ablasi dan tabel perbandingan vs baseline

Estimasi waktu: ~20–30 menit total untuk semua varian.

---

## Langkah 5 — Download hasil ke lokal

```bash
modal volume get uie-vol outputs ./results
```

Semua output tersimpan di `./results/`.

---

## Isi output (untuk laporan)

```
results/
├── ablation_summary.md          ← tabel ablasi (4 varian × semua metrik) → copy ke laporan
├── ablation_summary.csv         ← versi CSV untuk spreadsheet / LaTeX
├── comparison_table.md          ← ours vs baseline yang published
│
├── A1/
│   ├── config_snapshot.yaml     ← config persis yang dipakai (reproducibility)
│   ├── train_log.csv            ← per-epoch: loss, lr, val_psnr, val_ssim
│   ├── train_log.txt            ← full stdout training
│   ├── metrics.json             ← hasil evaluasi final di UIEB-890 (mean ± std)
│   ├── curves/
│   │   ├── loss.png             ← loss curve (total, charbonnier, physics, perceptual)
│   │   └── val_metrics.png      ← PSNR & SSIM per epoch
│   ├── samples/
│   │   └── grid.png             ← Input | Enhanced | Reference (8 gambar)
│   ├── physics/                 ← kosong untuk A1 (tidak ada PINN)
│   └── checkpoints/
│       ├── best.pt              ← model terbaik (EMA)
│       ├── latest.pt            ← checkpoint terakhir (untuk resume)
│       └── epoch_XXXX.pt        ← periodic checkpoint
│
├── A2/  (seperti A1 + physics/beta_depth.png dan beta_depth.csv)
├── A3/  (seperti A1)
└── A4/  (seperti A2)
```

### Mapping ke bagian laporan

| Output | Masuk ke bagian |
|---|---|
| `ablation_summary.md` | Tabel ablasi di bagian Experiment / Results |
| `comparison_table.md` | Tabel perbandingan vs prior work |
| `samples/grid.png` | Qualitative results figure |
| `curves/val_metrics.png` | Convergence plot di bagian Training |
| `curves/loss.png` | Loss curve di bagian Training |
| `physics/beta_depth.png` | Bukti PINN: β_R > β_G > β_B sesuai Beer-Lambert |
| `metrics.json` | Angka untuk isi tabel (PSNR/SSIM/LPIPS) |

**Interpretasi metrik:**
- **LPIPS** (↓ lebih baik): tunjukkan kontribusi DINOv2 — bandingkan A1 vs A3, dan A2 vs A4
- **β ordering (β_R > β_G > β_B)**: tunjukkan PINN belajar fisika air yang benar (merah paling cepat hilang di dalam air)
- **PSNR/SSIM** (↑ lebih baik): metrik rekonstruksi utama
- **UCIQE/UIQM**: perbandingan internal saja (implementasi beda dari paper lain)

---

## Troubleshooting

### Download gagal dengan 403 / HTTP Error

Kaggle rules belum di-accept. Buka ketiga link di Langkah 0.5 dan klik Accept.
Konfirmasi secret benar: `modal secret list` dan `modal secret list kaggle-secret`.

### Pair count mismatch / folder tidak ditemukan

```
[download] counts: {'lsui_raw': 0, ...}
```

Struktur folder dalam zip Kaggle tidak sesuai ekspektasi. Buka `src/assets.py` baris
`RAW_NAMES` dan `REF_NAMES` — tambahkan nama folder yang sesuai. Log error juga
mencetak daftar subfolder yang ditemukan sebagai petunjuk.

### Pretrained tidak termuat

```
[pretrained] WARNING not found at ... — random init
```

Berarti download pretrained gagal di Langkah 1. Jalankan ulang `modal run download.py`.
Kalau tetap gagal, download manual dari HuggingFace lalu upload ke volume:
```bash
modal volume put uie-vol NAFNet-SIDD-width32.pth /vol/pretrained/NAFNet-SIDD-width32.pth
```

Kalau muncul error `N backbone tensors did not load (non-PINN)` saat training mulai,
berarti config `model.*` di `base.yaml` tidak cocok dengan checkpoint — pastikan
`width=32, enc_blk_nums=[2,2,4,8], middle_blk_num=12, dec_blk_nums=[2,2,2,2]`.

### CUDA OOM (tidak terjadi di A100 40GB, tapi kalau terjadi)

Turunkan `batch_size` di `configs/base.yaml` dan naikkan `accum_steps` sesuai:
| batch_size | accum_steps | eff. batch |
|---|---|---|
| 16 | 1 | 16 (default) |
| 8 | 2 | 16 |
| 4 | 4 | 16 |

### Training terputus di tengah jalan

Tidak perlu khawatir. Jalankan ulang perintah yang sama — training lanjut dari
checkpoint terakhir. Pastikan resume berhasil dengan cek log untuk `[resume] from epoch N`.

### Mau cek isi Volume tanpa download semua

```bash
modal volume ls uie-vol
modal volume ls uie-vol outputs
modal volume ls uie-vol outputs/A4
```

---

## Struktur kode (referensi)

```
modal/
├── README.md
├── modal_app.py          ← app, image, volume, secret, remote functions
├── download.py           ← modal run download.py
├── train.py              ← modal run train.py --variant A1|A2|A3|A4|--all
├── evaluate.py           ← modal run evaluate.py --all
├── configs/
│   ├── base.yaml         ← semua hyperparameter shared (edit di sini)
│   ├── A1.yaml           ← hanya: use_pinn: false, use_dino: false
│   ├── A2.yaml           ← hanya: use_pinn: true,  use_dino: false
│   ├── A3.yaml           ← hanya: use_pinn: false, use_dino: true
│   └── A4.yaml           ← hanya: use_pinn: true,  use_dino: true
└── src/
    ├── model.py          ← NAFNetPINN (backbone + PINN branch)
    ├── pretrained.py     ← load checkpoint pretrained
    ├── data.py           ← UIEDataset + DataLoader
    ├── losses.py         ← Charbonnier + physics + DINOv2 perceptual
    ├── metrics.py        ← PSNR/SSIM/LPIPS/UCIQE/UIQM
    ├── trainer.py        ← training loop (EMA, AMP, resume, logging)
    ├── evaluator.py      ← eval loop + ablation/comparison tables
    ├── config.py         ← YAML loader
    └── assets.py         ← dataset folder detection
```
