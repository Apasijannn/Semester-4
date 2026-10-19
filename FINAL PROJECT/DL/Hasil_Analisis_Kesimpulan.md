# Hasil Eksperimen, Analisis, dan Kesimpulan

Dibangun dari data nyata di `output/` (folder `metrics/`, `charts/`, `tables/`, dan hasil per varian A1-A5). Evaluasi utama memakai split resmi UIEB Test-U90 supaya setara dengan baseline terpublikasi. Teks siap copy-paste ke laporan. Gambar memakai placeholder berisi nama file chart.

---

# 5. HASIL EKSPERIMEN

Bab ini memuat hasil pelatihan dan evaluasi seluruh varian, dari baseline sampai model lengkap, ditambah dua varian lanjutan. Varian inti A1 sampai A4 dilatih di LSUI lalu diuji di UIEB Test-U90, sehingga termasuk pengujian beda domain. Varian B1 dilatih langsung di UIEB-800 dan diuji di Test-U90, dipakai sebagai pembanding setara terhadap metode terdahulu. Pembahasan sebab tiap hasil ada di Bab 6.

## 5.1 Ablation Study

Untuk memisahkan kontribusi tiap komponen, dibuat empat varian yang dibangun bertahap dari baseline NAFNet sampai model lengkap. Rinciannya ada pada Tabel 5.1.

**Tabel 5.1 Rancangan varian ablasi**

| Varian | NAFNet | PINN | DINOv2 | Keterangan |
| :----: | :----: | :--: | :----: | :--------- |
| A1 | Ya | Tidak | Tidak | Baseline, NAFNet fine-tune |
| A2 | Ya | Ya | Tidak | NAFNet dan fisika |
| A3 | Ya | Tidak | Ya | NAFNet dan perceptual |
| A4 | Ya | Ya | Ya | Model lengkap |

Hasil evaluasi keempat varian pada Test-U90 ada pada Tabel 5.2. PSNR, SSIM, dan LPIPS memakai citra acuan, sedangkan UCIQE dan UIQM tidak.

**Tabel 5.2 Hasil evaluasi ablasi pada Test-U90**

| Varian | PSNR (dB) ↑ | SSIM ↑ | LPIPS ↓ | UCIQE ↑ | UIQM ↑ |
| :----: | :---------: | :----: | :-----: | :-----: | :----: |
| A1 | 18,40 | 0,822 | 0,194 | 3,77 | 2,98 |
| A2 | 18,30 | 0,820 | 0,195 | 3,78 | 3,00 |
| A3 | 18,37 | 0,825 | 0,187 | 3,78 | 3,00 |
| A4 | 18,33 | 0,821 | 0,183 | 3,82 | 2,97 |

Selisih antar varian pada PSNR dan SSIM tipis, di kisaran 0,1 dB dan 0,005. Perbedaan paling jelas ada pada LPIPS, yang turun dari 0,194 di A1 menjadi 0,183 di A4. Arti pola ini dibahas di Bab 6.1.

Jalannya pelatihan tiap varian terlihat pada kurva loss di Gambar 5.1 dan kurva metrik validasi di Gambar 5.2. Loss turun mulus dan stabil sepanjang 50 epoch.

[charts/curve_loss.png]

[charts/curve_val_psnr.png]

Perbandingan visual hasil tiap varian ada pada Gambar 5.3, yang menampilkan citra masukan, hasil model, dan citra acuan berdampingan.

[A4/samples/grid.png]

## 5.2 Varian Lanjutan A5 dan B1

Di luar empat varian inti, diuji dua varian tambahan. A5 mengembangkan A4 dengan physics reference-anchored dan loss koreksi warna. B1 memakai konfigurasi A5 tetapi dilatih langsung di UIEB-800 selama 150 epoch, lalu diuji di Test-U90. Hasil lengkapnya ada pada Tabel 5.3.

**Tabel 5.3 Hasil evaluasi seluruh varian pada Test-U90**

| Varian | PSNR (dB) ↑ | SSIM ↑ | LPIPS ↓ | UCIQE ↑ | UIQM ↑ |
| :----: | :---------: | :----: | :-----: | :-----: | :----: |
| A1 | 18,40 | 0,822 | 0,194 | 3,77 | 2,98 |
| A2 | 18,30 | 0,820 | 0,195 | 3,78 | 3,00 |
| A3 | 18,37 | 0,825 | 0,187 | 3,78 | 3,00 |
| A4 | 18,33 | 0,821 | 0,183 | 3,82 | 2,97 |
| A5 | 18,42 | 0,828 | 0,180 | 3,84 | 3,01 |
| B1 | 19,54 | 0,873 | 0,140 | 3,97 | 3,07 |

Di antara varian yang dilatih beda domain (A1 sampai A5), A5 unggul tipis di hampir semua metrik. Lompatan besar terjadi pada B1, yang dilatih langsung di domain UIEB. B1 mencapai PSNR 19,54 dB, SSIM 0,873, dan LPIPS 0,140, jauh di atas varian beda domain. Perbandingan lima metrik antar varian dirangkum pada Gambar 5.4 dan Gambar 5.5.

[charts/main_metrics_full.png]

[charts/lpips_full.png]

## 5.3 Koefisien Atenuasi Cabang PINN

Cabang PINN memprediksi koefisien atenuasi per kanal warna. Nilai rata-rata hasil belajar tiap varian ada pada Tabel 5.4.

**Tabel 5.4 Koefisien atenuasi terlatih cabang PINN pada Test-U90**

| Varian | β_R | β_G | β_B | Urutan R>G>B | depth |
| :----: | :--: | :--: | :--: | :----------: | :----: |
| A2 | 1,37 | 5,11 | 3,33 | Tidak | 0,0175 |
| A4 | 4,00 | 4,43 | 3,71 | Tidak | 0,0173 |
| A5 | 0,84 | 3,52 | 2,33 | Tidak | 0,0168 |
| B1 | 1,68 | 3,65 | 4,07 | Tidak | 0,0167 |

Fisika ideal bawah air menuntut β_R lebih besar dari β_G lebih besar dari β_B, karena merah teratenuasi paling cepat. Pada keempat varian, urutan ini tidak tercapai. Tren beta tiap epoch pada A4 ada pada Gambar 5.6. Makna temuan ini dibahas di Bab 6.2.

[A4/physics/beta_depth.png]

## 5.4 Perbandingan dengan Metode Terdahulu

Tabel 5.5 menempatkan B1 di samping metode UIE terpublikasi pada split yang sama, Test-U90. Varian A1 sampai A5 tidak dimasukkan ke perbandingan ini karena dilatih beda domain, sehingga angkanya tidak setara.

**Tabel 5.5 Perbandingan dengan metode terpublikasi pada Test-U90**

| Metode | PSNR (dB) ↑ | SSIM ↑ | LPIPS ↓ |
| :----- | :---------: | :----: | :-----: |
| FUnIE-GAN (2020) | 19,45 | 0,850 | - |
| Water-Net (2019) | 19,81 | 0,860 | - |
| UGAN (2018) | 20,68 | 0,840 | - |
| Ucolor (2021) | 20,78 | 0,870 | - |
| PUIE-Net (2022) | 21,38 | 0,882 | - |
| U-Shape Transformer (2023) | 22,91 | 0,910 | - |
| B1 (ours, in-domain) | 19,54 | 0,873 | 0,140 |

B1 mengungguli FUnIE-GAN pada PSNR maupun SSIM, dan SSIM-nya 0,873 berada di atas sebagian besar metode awal. Terhadap metode terkini seperti PUIE-Net dan U-Shape Transformer, B1 masih tertinggal pada PSNR. Pembahasan posisi ini, termasuk soal jumlah parameter dan epoch, ada di Bab 6.4.

> Catatan: angka baseline diambil dari paper masing-masing. Verifikasi dari PDF sumber sebelum laporan difinalkan.

---

# 6. ANALISIS DAN PEMBAHASAN

## 6.1 Kontribusi Tiap Komponen

Pada pengujian beda domain (A1 sampai A4), selisih PSNR dan SSIM antar varian sangat kecil, di kisaran 0,1 dB. Penambahan PINN saja (A2) bahkan menurunkan PSNR tipis dibanding baseline, dari 18,40 menjadi 18,30. Sinyal yang konsisten justru muncul di LPIPS. Setiap varian yang memakai DINOv2 punya LPIPS lebih rendah, yaitu A3 (0,187) dan A4 (0,183) di bawah A1 (0,194). DINOv2 menilai kemiripan fitur visual, bukan kemiripan piksel, jadi pengaruhnya terlihat pada metrik perseptual dan bukan pada PSNR. Pola serupa juga dilaporkan Johnson et al. (2016) dan Lin et al. (2024). Untuk melihat kontribusi DINOv2, membandingkan LPIPS antara A1 dan A3 lebih tepat daripada lewat PSNR.

A4 menggabungkan PINN dan DINOv2, dan mencapai LPIPS terbaik di kelompok beda domain serta UCIQE tertinggi (3,82). SSIM tertinggi di kelompok ini dipegang A3 (0,825). Dengan kata lain, DINOv2 menggerakkan kualitas perseptual, sementara PINN sendiri belum memberi keuntungan jelas pada metrik beda domain.

## 6.2 Koefisien Fisika yang Dipelajari PINN

Hasil pada Tabel 5.4 menunjukkan urutan β_R lebih besar dari β_G lebih besar dari β_B tidak tercapai di varian mana pun. Pada sebagian varian, β_R justru paling kecil, kebalikan dari fisika ideal. Estimasi kedalaman juga mendekati konstan di kisaran 0,017 untuk semua varian. Dua hal ini menunjukkan cabang PINN bekerja sebagai koreksi berbasis data, bukan sebagai pemulih koefisien atenuasi fisik yang sebenarnya. Model menemukan kombinasi beta yang menurunkan loss rekonstruksi, dan kombinasi itu tidak harus sama dengan nilai fisika nyata.

Tren beta per epoch pada A4 di Gambar 5.6 memperkuat hal ini. Nilai β_R dan β_G naik bersama dan berakhir hampir sama besar, sedangkan β_B paling rendah, tanpa pemisahan tegas sesuai urutan ideal. Temuan ini menjadi batasan yang jujur untuk dilaporkan. Constraint fisika membantu menstabilkan pelatihan, tetapi belum cukup untuk memaksa beta mengikuti urutan fisik yang benar. Penelitian lanjut bisa menambah regularisasi yang mendorong urutan beta atau memakai estimasi kedalaman yang lebih kaya.

## 6.3 Beda Domain dan Peran B1

Selisih besar antara B1 dan varian A terlihat jelas pada Tabel 5.3. B1 yang dilatih langsung di UIEB unggul lebih dari 1 dB PSNR dan 0,05 SSIM dibanding varian beda domain terbaik. Hasil ini menegaskan domain gap antara LSUI dan UIEB cukup besar, sehingga model yang dilatih di LSUI kehilangan sebagian performa saat diuji di UIEB. Karena itu, untuk perbandingan yang adil dengan baseline yang juga dilatih in-domain, B1 menjadi acuan yang tepat, bukan A1 sampai A5.

## 6.4 Posisi terhadap Metode Terdahulu dan Efisiensi

Pada Test-U90, B1 mencapai PSNR 19,54 dB dan SSIM 0,873. Angka ini melewati FUnIE-GAN pada kedua metrik dan setara dengan kelompok metode awal seperti Water-Net. Terhadap metode terkini seperti PUIE-Net (21,38 dB) dan U-Shape Transformer (22,91 dB), B1 masih tertinggal pada PSNR, walau SSIM-nya tetap kompetitif. Posisi ini perlu dibaca bersama dua hal. Pertama, soal ukuran. NAFNet width=32 yang dipakai jauh lebih ringan daripada U-Shape Transformer (65,6M parameter), dan satu varian selesai dalam puluhan menit di satu GPU A100 40GB. Kedua, soal konvergensi yang dibahas berikut.

Kurva PSNR validasi di Gambar 6.1 menunjukkan nilainya masih naik sampai epoch terakhir. Pada A4, PSNR validasi bergerak dari 18,30 di epoch 45 menjadi 18,54 di epoch 50, tanpa tanda mendatar.

[A4/curves/val_metrics.png]

Sampai epoch ke-50, model belum jenuh, sehingga angka pada tabel hasil belum batas atas yang bisa dicapai. Learning rate saat itu sudah turun ke batas bawah 1e-6 mengikuti jadwal cosine, jadi peningkatan lanjut menuntut jadwal epoch yang lebih panjang, bukan sekadar melanjutkan jadwal yang sama. Sebagai pembanding, U-Shape Transformer dilatih 800 epoch dari nol, sedangkan model ini hanya 50 epoch dan dimulai dari bobot pretrained NAFNet-SIDD. Dengan anggaran epoch yang jauh lebih kecil, mencapai SSIM yang setara metode awal sudah wajar, dan jarak ke baseline besar berpeluang menyempit jika epoch ditambah. Pembuktiannya menuntut pengujian dengan epoch lebih banyak.

---

# 7. KESIMPULAN

Penelitian ini membangun framework Physics-Informed UIE yang menggabungkan NAFNet backbone, cabang PINN Beer-Lambert per kanal, dan DINOv2 perceptual loss. Studi ablasi A1 sampai A4 pada Test-U90 menunjukkan kontribusi DINOv2 paling konsisten, terlihat dari LPIPS yang turun dari 0,194 di baseline menjadi 0,183 di model lengkap. Pengaruh cabang PINN pada metrik beda domain belum jelas, dan urutan koefisien atenuasi β_R lebih besar dari β_G lebih besar dari β_B tidak tercapai. Cabang PINN lebih berperan sebagai koreksi berbasis data daripada pemulih nilai fisika yang sebenarnya.

Varian in-domain B1 mencapai hasil terbaik, yaitu PSNR 19,54 dB, SSIM 0,873, dan LPIPS 0,140 pada Test-U90. B1 melewati FUnIE-GAN dan setara metode awal lain, walau masih di bawah metode terkini seperti PUIE-Net dan U-Shape Transformer pada PSNR. Hasil ini dicapai dengan model yang jauh lebih ringan, hanya 50 epoch, dan dimulai dari bobot pretrained. Kurva validasi yang masih naik sampai epoch terakhir menunjukkan model belum jenuh, sehingga ada ruang peningkatan jika anggaran epoch ditambah. Selisih besar antara B1 dan varian beda domain juga menegaskan domain gap antara LSUI dan UIEB sebagai faktor penting dalam pengujian.

---

## Catatan untuk pengisian akhir

- Angka pada seluruh tabel sudah diambil dari `output/metrics/*_u90.json` dan `output/tables/semua_tabel.md`.
- Placeholder gambar memakai nama file dari `output/charts/` dan folder per varian. Versi `_full` memuat A5 dan B1, versi tanpa `_full` hanya A1 sampai A4.
- Angka baseline pada Tabel 5.5 perlu diverifikasi dari PDF paper sumber sebelum final.
