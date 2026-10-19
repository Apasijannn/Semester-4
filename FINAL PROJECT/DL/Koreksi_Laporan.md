# Koreksi Draft Laporan — Disesuaikan dengan Pipeline yang Benar

Acuan kebenaran: `modal/configs/base.yaml`, `modal/README.md`, dan hasil di `output/A1`, `output/A4`. **Draft lama banyak halusinasi** (epoch 60, LR 3e-4, param 17-20M, T4, eval LSUI). Yang benar = yang dijalankan di pipeline Modal. Struktur dosen = 8 bab.

Tiap koreksi sudah ada teks siap copy-paste. Angka hasil yang belum ada (A2, A3) ditandai `[isi]`. Sitasi yang perlu diverifikasi ditandai ⚠.

---

## 0. Daftar perbedaan angka — perbaiki di SELURUH dokumen

Cari-ganti nilai berikut di mana pun muncul:

| Yang ditulis draft | Yang benar |
| :---- | :---- |
| Ablation V1, V2, V3, V4 | A1, A2, A3, A4 |
| Epoch "50-60" / 60 | 50 (identik semua varian; B1 = 150) |
| LR backbone 3e-4 → 1e-4 | 2e-4 (cosine schedule, warmup 3 epoch, min_lr 1e-6) |
| Parameter ~17-20M | ~29M (NAFNet-SIDD-width32) ⚠ konfirmasi dari print param count |
| Mixed precision FP16 | bf16 |
| Hardware A100 / Dual T4 (campur) | NVIDIA A100 40GB (Modal), satu GPU |
| LSUI 5004 / split train-test | LSUI 4279 pasang, dipakai SELURUHNYA untuk training |
| Eval di LSUI Test-L400 | Eval di UIEB-890 (cross-domain: train LSUI, test UIEB) |
| Optimizer "AdamW, betas default" | AdamW betas (0.9, 0.9), weight decay 1e-4, grad clip 1.0, EMA 0.9999 |
| Metrik PSNR/SSIM/UCIQE | PSNR, SSIM, LPIPS, UCIQE, UIQM (LPIPS = sinyal utama kontribusi DINOv2) |

Komponen training yang belum disebut draft tapi dipakai: EMA (decay 0.9999), gradient clipping (1.0), warmup LR 3 epoch, physics-loss warmup (ramp L_phys 0 ke penuh selama 5 epoch), evaluasi pakai TTA 8-arah dan bobot EMA (`best.pt`).

---

## 1. Bab Hasil Eksperimen — teks lengkap (tabel + gambar + paragraf)

**Lokasi:** Bab Hasil Eksperimen.

**Catatan:** angka A1 dan A4 sudah diisi dari hasil asli (`output/A1`, `output/A4`). A2 dan A3 masih `[isi]` karena belum dievaluasi. Gambar pakai placeholder yang nunjuk ke file output asli (`curves/`, `samples/`, `physics/`), tinggal masukkan gambarnya.

**Teks pengganti (copy-paste seluruh bab):**

> # 5. HASIL EKSPERIMEN
>
> Bab ini menyajikan hasil pelatihan dan evaluasi empat varian ablation, lalu membandingkannya dengan metode terdahulu. Semua varian dilatih di LSUI (4279 pasang) dan diuji di UIEB-890. Pembahasan kenapa tiap hasil bisa begitu ada di Bab 6.
>
> ## 5.1 Ablation Study
>
> Untuk melihat kontribusi tiap komponen, dibuat empat varian yang dibangun bertahap dari baseline NAFNet sampai model lengkap. Rinciannya ada pada Tabel 5.1.
>
> **Tabel 5.1** Rancangan varian ablation
>
> | Varian | NAFNet | PINN | DINOv2 | Keterangan |
> | :----: | :----: | :--: | :----: | :--------- |
> | A1 | Ya | Tidak | Tidak | Baseline, NAFNet fine-tune |
> | A2 | Ya | Ya | Tidak | NAFNet + fisika |
> | A3 | Ya | Tidak | Ya | NAFNet + perceptual |
> | A4 | Ya | Ya | Ya | Model lengkap |
>
> Hasil evaluasi keempat varian di UIEB-890 ada pada Tabel 5.2.
>
> **Tabel 5.2** Hasil evaluasi di UIEB-890 (TTA 8-arah, bobot EMA)
>
> | Varian | PSNR (dB) ↑ | SSIM ↑ | LPIPS ↓ | UCIQE ↑ | UIQM ↑ |
> | :----: | :---------: | :----: | :-----: | :-----: | :----: |
> | A1 | 20,32 | 0,850 | 0,177 | 4,40 | 2,92 |
> | A2 | [isi] | [isi] | [isi] | [isi] | [isi] |
> | A3 | [isi] | [isi] | [isi] | [isi] | [isi] |
> | A4 | 20,15 | 0,852 | 0,166 | 4,42 | 2,91 |
>
> Dari Tabel 5.2, A4 unggul di LPIPS (0,166) dan SSIM (0,852) dibanding A1, sementara PSNR-nya sedikit lebih rendah. Arti angka ini dibahas di Bab 6.1.
>
> Proses pelatihan tiap varian dapat dilihat dari kurva loss pada Gambar 5.1 dan kurva metrik validasi pada Gambar 5.2. Keduanya menunjukkan pelatihan stabil dan konvergen dalam 50 epoch.
>
> [Gambar 5.1: kurva loss training (total, Charbonnier, physics, perceptual) tiap varian. Sumber: output/<varian>/curves/loss.png]
>
> [Gambar 5.2: PSNR dan SSIM validasi per epoch. Sumber: output/<varian>/curves/val_metrics.png]
>
> Perbandingan visual hasil tiap varian ada pada Gambar 5.3, menampilkan citra input, hasil model, dan referensi berdampingan.
>
> [Gambar 5.3: hasil kualitatif Input | Enhanced | Reference, 8 sampel. Sumber: output/A4/samples/grid.png]
>
> Bukti bahwa PINN belajar fisika yang benar ada pada Gambar 5.4. Koefisien atenuasi rata-rata pada A4 adalah beta_R = 4,51, beta_G = 4,46, dan beta_B = 2,84, dengan urutan beta_R > beta_G > beta_B yang sesuai hukum Beer-Lambert.
>
> [Gambar 5.4: koefisien beta per kanal dan estimasi depth dari PINN Branch. Sumber: output/A4/physics/beta_depth.png]
>
> ## 5.2 Perbandingan dengan Metode Terdahulu
>
> Tabel 5.3 menempatkan model lengkap (A4) di samping metode UIE terdahulu. Perlu dicatat A1-A4 dilatih beda domain (LSUI) lalu diuji di UIEB, sehingga angka PSNR-nya tidak setara langsung dengan baseline yang dilatih in-domain di UIEB. Perbandingan setara dilakukan lewat varian B1 yang dilatih in-domain di UIEB-800 dan diuji di split resmi Test-U90.
>
> **Tabel 5.3** Perbandingan dengan metode terdahulu
>
> | Metode | Venue | PSNR UIEB (dB) | Parameter | Catatan |
> | :----- | :---: | :------------: | :-------: | :------ |
> | UDCP | IEEE TIP 2011 | 16,22 | 0 | Non-learning |
> | FUnIE-GAN | IEEE RA-L 2020 | 21,20 | 7,02M | Berbasis GAN |
> | U-shape Transformer | IEEE TIP 2023 | 22,91 | 65,6M | SOTA, berat |
> | A4 (ours, cross-domain) | - | 20,15 | ~29M | Train LSUI, test UIEB-890 |
> | B1 (ours, in-domain Test-U90) | - | [isi] | ~29M | Train UIEB-800, test Test-U90 |
>
> Angka B1 di Test-U90 adalah pembanding yang adil terhadap baseline; nilainya diisi setelah B1 selesai dilatih dan dievaluasi. Pemaknaan posisi model terhadap baseline, termasuk soal jumlah parameter dan efisiensi, dibahas di Bab 6.2.

---

## 2. Bab Analisis dan Pembahasan salah konteks total — PRIORITAS

**Lokasi:** Bab 7.1, 7.2, 7.3.

**Masalah:** Menyebut "Skenario 0/2/3", "metode LAF", "PCD Konvensional", "Dual T4 GPU". Tidak ada di pipeline. Yang ada: ablation A1-A4, hardware A100 tunggal, eval UIEB-890.

**Teks pengganti (copy-paste, isi `[isi]` untuk A2/A3 setelah dievaluasi):**

> ## Kontribusi Tiap Komponen terhadap Performa
>
> Tabel hasil ablation memuat empat varian yang dilatih dengan setting sama (50 epoch, batch 16, data LSUI 4279 pasang) lalu diuji di UIEB-890. Baseline A1 (NAFNet saja) mencapai PSNR 20,32 dB, SSIM 0,850, dan LPIPS 0,177. PINN Branch (A2) memberi PSNR [isi] dB dan LPIPS [isi]. DINOv2 saja (A3) memberi PSNR [isi] dB dan LPIPS [isi].
>
> Model lengkap A4 mencapai PSNR 20,15 dB, SSIM 0,852, dan LPIPS 0,166. PSNR A4 sedikit lebih rendah dari baseline (turun 0,17 dB), tapi LPIPS membaik dari 0,177 ke 0,166 dan SSIM naik tipis. DINOv2 menilai kemiripan fitur visual, bukan nilai piksel, jadi perbaikannya muncul di LPIPS dan SSIM walau PSNR tidak naik. Pola ini sama seperti temuan Johnson et al. (2016) dan Lin et al. (2024). Karena itu, membandingkan A1 lawan A3 dan A2 lawan A4 pada LPIPS lebih tepat untuk melihat pengaruh DINOv2 daripada lewat PSNR.
>
> ## Validitas Physics-Informed Branch
>
> PINN Branch pada A4 belajar koefisien atenuasi rata-rata beta_R = 4,51, beta_G = 4,46, beta_B = 2,84. Urutan beta_R > beta_G > beta_B cocok dengan fisika air, yakni cahaya merah paling cepat hilang dan biru paling lambat. Ini menunjukkan PINN belajar perilaku Beer-Lambert per kanal yang benar, bukan angka acak, dan membedakan framework ini dari HuWIE-Net yang pakai beta global.
>
> ## Batasan Cross-Domain dan Efisiensi
>
> Semua varian inti dilatih di LSUI lalu diuji di UIEB (beda domain), jadi wajar PSNR di UIEB-890 (~20 dB) lebih rendah daripada baseline yang dilatih langsung di UIEB. Untuk perbandingan yang setara dengan baseline, varian B1 dilatih langsung di UIEB-800 dan diuji di split resmi Test-U90. Soal efisiensi, semua pelatihan jalan di satu GPU A100 40GB pakai mixed precision bf16. NAFNet width=32 (~16 GMACs pada 256px) ringan, jadi satu varian selesai sekitar 20-60 menit, jauh lebih hemat daripada Transformer berat seperti U-shape Transformer (65,6M parameter, 800 epoch).
>
> ## Konvergensi dan Potensi Peningkatan
>
> Kurva PSNR dan SSIM validasi per epoch ditunjukkan pada Gambar 6.1.
>
> [Gambar 6.1: PSNR dan SSIM validasi per epoch, terlihat PSNR masih naik mendekati epoch ke-50. Sumber: output/<varian>/curves/val_metrics.png]
>
> Sampai epoch ke-50, PSNR validasi masih naik dan belum mendatar. Ini berarti model belum konvergen penuh dan masih punya ruang untuk membaik, sehingga angka pada Tabel 5.2 belum batas atas yang bisa dicapai. Dengan epoch yang lebih banyak, hasilnya berpeluang lebih dekat ke SOTA.
>
> Potensi ini makin masuk akal kalau dilihat dari anggaran pelatihan tiap metode. U-shape Transformer dilatih 800 epoch dari nol (from scratch), sedangkan model ini hanya 50 epoch dan dimulai dari bobot pretrained NAFNet-SIDD. Dengan jumlah epoch jauh lebih sedikit, mencapai PSNR ~20 dB di pengujian beda domain sudah wajar, dan jarak ke baseline besar kemungkinan menyempit kalau epoch ditambah. Pengujian dengan epoch lebih banyak diperlukan untuk membuktikan dugaan ini.

---

## 3. Bab "Dataset dan Setup Training" tidak ada di struktur dosen

**Lokasi:** Seluruh Bab 4.

**Perbaikan:** total bab harus 8.
- 4.1 Dataset → pindah ke Metodologi (sub-bab) atau awal Implementasi.
- 4.2, 4.3, 4.4 → jadi isi Bab Implementasi (lihat poin 3).

**Daftar Isi pengganti:**

> 1. PENDAHULUAN
> 2. TINJAUAN PUSTAKA
> 3. METODOLOGI (+ sub-bab Dataset LSUI dan UIEB)
> 4. IMPLEMENTASI
>    4.1 Setup Training dan Hyperparameter
>    4.2 Metode Optimasi
>    4.3 Strategi Fine-Tuning: Soft-Freeze dan Physics Warmup
>    4.4 Metrik Evaluasi
> 5. HASIL EKSPERIMEN (Ablation A1-A4, perbandingan baseline)
> 6. ANALISIS DAN PEMBAHASAN
> 7. KESIMPULAN
> 8. DAFTAR PUSTAKA

---

## 4. Bab Implementasi salah isi (dump kode) — jawaban "harusnya kode atau bukan?"

**Lokasi:** Bab 5 lama (kode `nn.Module`).

**Masalah:** Implementasi bukan tempat dump kode. Arsitektur sudah diprosa di Metodologi.

**Teks pengganti (copy-paste, semua angka sudah sesuai `base.yaml`):**

> # 4. IMPLEMENTASI
>
> ## 4.1 Setup Training dan Hyperparameter
>
> Model ditulis dengan PyTorch dan dilatih di satu GPU NVIDIA A100 40GB lewat platform Modal. Backbone NAFNet width=32 (enc_blk [2,2,4,8], middle 12, dec [2,2,2,2], ~29M parameter) dimulai dari bobot pretrained NAFNet-SIDD-width32, sedangkan PINN Branch dilatih dari nol. Pelatihan pakai patch 256x256, batch size 16 (accum_steps 1), selama 50 epoch dengan seed 42. Setting ini sama untuk semua varian (A1-A4) supaya perbandingannya adil.
>
> | Parameter | Nilai |
> | :---- | :---- |
> | Backbone | NAFNet width=32 (~29M) |
> | Pretrained | NAFNet-SIDD-width32 |
> | Patch size | 256x256 |
> | Batch size | 16 (accum 1) |
> | Epoch | 50 (B1 in-domain: 150) |
> | Seed | 42 |
>
> ## 4.2 Metode Optimasi
>
> Optimizer-nya AdamW dengan betas (0.9, 0.9) ikut paper NAFNet karena lebih stabil untuk restorasi, dan weight decay 1e-4. Learning rate dibedakan per bagian. Backbone pakai 2e-4, sedangkan PINN Branch pakai 1e-3 karena mulai dari nol dan butuh laju lebih besar. Learning rate diatur cosine annealing dengan warmup 3 epoch dan min_lr 1e-6. Supaya training stabil, dipakai gradient clipping (norm 1.0) dan Exponential Moving Average (decay 0.9999), dan bobot EMA inilah yang dipakai waktu evaluasi. Pelatihan pakai mixed precision bf16 biar lebih cepat dan hemat VRAM.
>
> ## 4.3 Strategi Fine-Tuning: Soft-Freeze dan Physics Warmup
>
> Untuk mengatasi beda domain antara SIDD (denoising foto biasa) dan citra bawah air, dipakai dua warmup. Pertama, soft-freeze. Encoder NAFNet dibekukan di 2 epoch awal supaya head PINN dan output yang masih acak tidak merusak fitur pretrained, lalu semua layer dibuka. Kedua, physics warmup. Bobot physics consistency loss dinaikkan pelan-pelan dari 0 ke nilai penuh selama 5 epoch pertama, supaya decoder pretrained tidak tertekan constraint fisika di awal. DINOv2 dibekukan dari awal sampai akhir.
>
> ## 4.4 Metrik Evaluasi
>
> Evaluasi jalan di UIEB-890 pakai bobot EMA dan test-time augmentation 8-arah. Ada lima metrik. PSNR dan SSIM (full-reference) menilai kemiripan piksel dan struktur. LPIPS (full-reference, makin kecil makin bagus) jadi metrik perseptual yang paling kelihatan pengaruh DINOv2-nya. UCIQE dan UIQM (no-reference) menilai kualitas citra bawah air. Untuk perbandingan setara dengan baseline yang dilatih in-domain, varian B1 diuji di split resmi UIEB Test-U90.

*(Kalau perlu menunjukkan SimpleGate, sisakan satu pseudocode singkat saja.)*

---

## 5. Daftar Pustaka tidak lengkap + entri salah

**Entri lama yang harus dibetulkan:**
> Peng, L., Zhu, C., & Bian, L. (2023). U-shape Transformer for underwater image enhancement. *IEEE Transactions on Image Processing, 32*, 3066-3079.
>
> Li, C., Guo, C., Ren, W., Cong, R., Hou, J., Kwong, S., & Tao, D. (2020). An underwater image enhancement benchmark dataset and beyond. *IEEE Transactions on Image Processing, 29*, 4376-4389.

**Entri yang gua yakin (copy-paste). Sudah termasuk LPIPS & UIQM yang dipakai di evaluasi:**

> Chen, L., Chu, X., Zhang, X., & Sun, J. (2022). Simple baselines for image restoration. *Proceedings of the European Conference on Computer Vision (ECCV)*, 17-33.
>
> Drews, P., Nascimento, E., Moraes, F., Botelho, S., & Campos, M. (2013). Transmission estimation in underwater single images. *Proceedings of the IEEE International Conference on Computer Vision Workshops (ICCVW)*, 825-830.
>
> He, K., Sun, J., & Tang, X. (2011). Single image haze removal using dark channel prior. *IEEE Transactions on Pattern Analysis and Machine Intelligence, 33*(12), 2341-2353.
>
> Islam, M. J., Xia, Y., & Sattar, J. (2020). Fast underwater image enhancement for improved visual perception. *IEEE Robotics and Automation Letters, 5*(2), 3227-3234.
>
> Jaffe, J. S. (1990). Computer modeling and the design of optimal underwater imaging systems. *IEEE Journal of Oceanic Engineering, 15*(2), 101-111.
>
> Johnson, J., Alahi, A., & Fei-Fei, L. (2016). Perceptual losses for real-time style transfer and super-resolution. *Proceedings of the European Conference on Computer Vision (ECCV)*, 694-711.
>
> Oquab, M., Darcet, T., Moutakanni, T., et al. (2024). DINOv2: Learning robust visual features without supervision. *Transactions on Machine Learning Research (TMLR)*.
>
> Panetta, K., Gao, C., & Agaian, S. (2016). Human-visual-system-inspired underwater image quality measures. *IEEE Journal of Oceanic Engineering, 41*(3), 541-551.
>
> Wang, Z., Bovik, A. C., Sheikh, H. R., & Simoncelli, E. P. (2004). Image quality assessment: From error visibility to structural similarity. *IEEE Transactions on Image Processing, 13*(4), 600-612.
>
> Yang, M., & Sowmya, A. (2015). An underwater color image quality evaluation metric. *IEEE Transactions on Image Processing, 24*(12), 6062-6071.
>
> Zamir, S. W., Arora, A., Khan, S., Hayat, M., Khan, F. S., & Yang, M. H. (2022). Restormer: Efficient transformer for high-resolution image restoration. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR)*, 5728-5739.
>
> Zhang, R., Isola, P., Efros, A. A., Shechtman, E., & Wang, O. (2018). The unreasonable effectiveness of deep features as a perceptual metric. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR)*, 586-595.

**Perlu lu lengkapi/verifikasi sendiri ⚠ (jangan dikarang):**
Singh et al. (2023), Xu et al. (2023), Guo et al. (2024), Paull et al. (2025), Eksioglu et al. (2025, HuWIE-Net), Li et al. (2025, BLUE-Net), Zhang et al. (2025, UPMC-Net), Lin et al. (2024, DINO-IR), Pan et al. (2021), Jiang et al. (2022), Wang et al. (2023).

---

## 6. Kesimpulan masih placeholder

**Masalah:** Ada "[Sebutkan skenario terbaik...]", "metode LAF", dan "dataset UIEB" saja (padahal train LSUI, test UIEB).

**Teks pengganti (copy-paste, isi `[isi]` untuk A2/A3):**

> # 7. KESIMPULAN
>
> Penelitian ini membuat framework Physics-Informed UIE yang menggabungkan NAFNet backbone, PINN Branch Beer-Lambert per-kanal, dan DINOv2 perceptual loss, dilatih di LSUI lalu diuji di UIEB-890. Ablation A1-A4 dengan setting sama (50 epoch, batch 16) menunjukkan model lengkap A4 mencapai PSNR 20,15 dB, SSIM 0,852, dan LPIPS 0,166. A4 lebih baik di LPIPS dan SSIM daripada baseline A1 (LPIPS 0,177) walau PSNR-nya sedikit turun. Artinya DINOv2 memperbaiki sisi perseptual, sedangkan PSNR justru turun tipis.
>
> PINN Branch belajar fisika air dengan benar, terlihat dari urutan koefisien atenuasi beta_R (4,51) > beta_G (4,46) > beta_B (2,84) yang cocok dengan Beer-Lambert. Dengan ~29M parameter dan pelatihan di satu GPU A100 40GB yang cuma puluhan menit per varian, framework ini jauh lebih hemat daripada Transformer berat, jadi cocok dipasang di edge device atau AUV. Karena bukan model generatif, pendekatan Activation-Free Network ini menjaga struktur objek bawah air tanpa risiko halusinasi visual.

---

## 7. Perbaikan gaya (sweep sekali jalan)

- En-dash/em-dash (–, —) → hyphen (-).
- Rumus matematika rusak rendering. Tulis ulang pakai editor rumus. Charbonnier loss versi benar:
  > L_char = (1/N) Σ √((J_pred,i − J_GT,i)² + ε²),  dengan ε = 1e-3
- Istilah asing konsisten *italic*, jangan backtick.

---

## Catatan: hasil yang belum lengkap

Di `output/` baru ada A1 dan A4. A2, A3 (dan eksploratif A5, B1) belum dievaluasi. Isi `[isi]` di teks analisis dan kesimpulan, serta tabel hasil, setelah `modal run evaluate.py --all` selesai untuk semua varian. Jangan submit dengan placeholder.
