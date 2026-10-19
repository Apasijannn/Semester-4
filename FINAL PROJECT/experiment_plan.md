# Rencana Eksperimen

## Dataset

| Dataset | Fungsi | Jumlah |
|---|---|---|
| LSUI | Training | 4.279 pasang |
| UIEB | Evaluasi (semua eksperimen) | 890 pasang |

Semua model dievaluasi pada UIEB agar hasil bisa dibandingkan secara adil.

---

## Studi Ablasi

Tujuan: membuktikan kontribusi tiap komponen arsitektur.

| Kode | Model | Komponen |
|---|---|---|
| A1 | Restormer only | Backbone saja, loss = Charbonnier |
| A2 | Restormer + PINN | + cabang Beer-Lambert (estimasi transmitansi) |
| A3 | Restormer + DINOv2 | + perceptual loss DINOv2 (tanpa PINN) |
| A4 | Restormer + PINN + DINOv2 | Model penuh (RestormerPINN) |

Metrik: **PSNR** dan **SSIM** pada UIEB test set.

---

## Perbandingan dengan Metode Lain

Angka diambil dari paper yang sudah diuji pada UIEB. **Tidak perlu melatih ulang.**

> ⚠️ **Perhatian split:** Beberapa paper pakai Test-U90 (90 gambar dari UIEB), bukan full 890. Pastikan angka yang dikutip pakai split yang sama. Kolom "Sumber" menunjukkan dari paper mana angkanya diambil.

### Metode Klasik / Awal

| Metode | Tahun | PSNR | SSIM | Sumber angka | PDF |
|---|---|---|---|---|---|
| WaterGAN | 2017 | — | — | cek paper | `paper/Paper Referensi/WaterGAN_...pdf` |
| UWCNN | 2018 | — | — | cek paper | `paper/UWCNN_2018.pdf` |
| Water-Net | 2020 | 19.81 | 0.860 | U-Shape paper (Test-U90) | `paper/Paper Referensi/An_Underwater_...pdf` |
| FUnIE-GAN | 2020 | 19.45 | 0.850 | U-Shape paper (Test-U90) | — *(tidak download, cite dari U-Shape)* |
| UGAN | 2020 | 20.68 | 0.840 | U-Shape paper (Test-U90) | — *(cite dari U-Shape)* |

### Metode Modern

| Metode | Tahun | PSNR | SSIM | Sumber angka | PDF |
|---|---|---|---|---|---|
| Ucolor | 2021 | 20.78 | 0.870 | U-Shape paper (Test-U90) | `paper/Ucolor_2021.pdf` |
| U-Shape Transformer | 2023 | 22.91 | 0.910 | paper sendiri (Test-U90) | `paper/Paper Referensi/U-Shape_Transformer_...pdf` |
| PUIE-Net | 2022 | ~21.38 | ~0.882 | cek paper | `paper/PUIE-Net_ECCV2022.pdf` |
| MuLA-GAN | 2023 | 25.59 | 0.893 | emergentmind leaderboard | `paper/MuLA-GAN_2023.pdf` |
| DGNet | 2023 | 25.62 | 0.929 | emergentmind leaderboard | `paper/DGNet_2023.pdf` |
| Mamba-UIE | 2024 | 27.13 | 0.930 | emergentmind leaderboard | `paper/Mamba-UIE_2024.pdf` |
| HUWIE-Net | 2025 | — | — | cek paper | `paper/Paper Referensi/Joint_Optimization_...pdf` |
| **RestormerPINN (ours)** | 2025 | — | — | — | — |

> Angka bertanda `~` atau `—` perlu dicek langsung dari PDF. Prioritas verifikasi: UWCNN, WaterGAN, PUIE-Net, HUWIE-Net.

---

## Urutan Pengerjaan

1. Latih A1 → A4 pada LSUI, evaluasi tiap model pada UIEB
2. Catat PSNR & SSIM untuk tabel ablasi
3. Verifikasi angka benchmark dari PDF (lihat kolom "Sumber angka" di atas)
4. Susun tabel perbandingan final
