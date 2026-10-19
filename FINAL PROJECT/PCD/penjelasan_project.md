# Laporan Proyek Akhir: Lightweight Adaptive Fusion untuk Underwater Image Enhancement

Laporan ini menyajikan ringkasan komprehensif dari penelitian dan pengembangan algoritma **Lightweight Adaptive Fusion (LAF)**, yang dirancang khusus untuk meningkatkan kualitas citra bawah air secara *real-time* untuk kebutuhan navigasi robotika (AUV/ROV).

---

## 1. Latar Belakang

Eksplorasi bawah laut menggunakan *Autonomous Underwater Vehicles* (AUV) sangat bergantung pada sistem sensor visual untuk melakukan tugas navigasi (*Visual SLAM*) dan deteksi objek. Namun, cahaya yang masuk ke dalam air mengalami penyerapan (*absorption*) dan hamburan (*scattering*). Penyerapan cahaya memiliki panjang gelombang yang bergantung pada warna; warna merah diserap paling cepat, menyebabkan citra bawah laut didominasi oleh warna biru-hijau (color cast). Hamburan cahaya oleh partikel air menyebabkan rendahnya kontras dan gambar yang kabur.

**Identifikasi Masalah (Trade-off):**
Terdapat kesenjangan (*gap*) yang besar dalam literatur *Underwater Image Enhancement* (UIE):
1. **Metode Cepat (Fast Methods):** Menggunakan operasi sederhana seperti pemerataan histogram atau CLAHE global. Metode ini berjalan sangat cepat (>30 FPS) namun sering kali menghasilkan warna yang tidak natural (*over-enhanced*) dan merusak integritas struktural gambar, yang justru membingungkan algoritma *Computer Vision*.
2. **Metode Berkualitas Tinggi (Complex Methods):** Metode fusi multi-skala (seperti *Laplacian-Gaussian Pyramids*) atau *Deep Learning* menghasilkan citra yang sangat jernih dan natural, namun komputasinya sangat berat (< 1 FPS). Hal ini **tidak aplikatif** untuk robotika yang membutuhkan respon latensi rendah.

**Tujuan:**
Penelitian ini mengusulkan algoritma **Lightweight Adaptive Fusion (LAF)** yang bertujuan mencari *Pareto Optimal* (Sweet Spot): Kualitas struktural dan warna yang setara dengan metode kompleks, namun dieksekusi dengan kecepatan *real-time* (>10 FPS) [3].

---

## 2. Metodologi (Lightweight Adaptive Fusion & Baseline)

Penelitian ini membandingkan 4 arsitektur algoritma yang berbeda. Bagian ini akan membahas secara mendetail metode usulan utama, diikuti dengan ketiga metode pembandingnya.

### 2.1. Metode Usulan Utama: Global Lightweight Adaptive Fusion (LAF)
Arsitektur LAF dirancang untuk menghindari proses *looping* level-piksel secara eksplisit, murni mengandalkan operasi vektorisasi (NumPy/OpenCV), dan mengganti fusi multi-skala (*pyramid*) dengan fusi perkalian tunggal (*single-level multiplicative fusion*). Pipeline terdiri dari 3 tahap:

#### A. Fase Koreksi Warna: Bounded Gray World dengan Pixel-Wise Brightness Attenuation
*   **Teori:** Asumsi *Gray World* menyatakan bahwa rata-rata intensitas seluruh warna dalam gambar seharusnya abu-abu netral [1]. Jika warna merah sangat rendah, *gain* warna merah akan dikalikan.
*   **Inovasi:** *Gray World* konvensional sering memunculkan artefak kemerahan (*red tint*) pada objek yang sudah berwarna putih terang (seperti pasir atau bias cahaya). Metode usulan LAF mengukur *luminance* setiap piksel secara presisi dan membuat peta atenuasi kuadratik (`alpha = 1.0 - (luminance/255)^2`). Piksel terang tidak akan menerima *gain* merah, sehingga menjaga warna putih tetap natural tanpa efek *clipping*.

#### B. Fase Peningkatan Detail: CLAHE pada Luminance (YCbCr)
*   **Teori:** CLAHE (*Contrast Limited Adaptive Histogram Equalization*) meningkatkan kontras lokal tanpa membuat *noise* meledak [2].
*   **Inovasi:** CLAHE tidak diterapkan pada saluran RGB (karena akan merusak keseimbangan warna yang sudah diperbaiki di Fase A). Citra dikonversi ke ruang warna YCbCr, dan CLAHE **hanya diterapkan pada saluran Y (Luminance)**. Ekstraksi memori saluran Y ini juga dipakai ulang (*re-used*) untuk menghitung peta kecerahan di Fase C demi menghemat siklus CPU.

#### C. Fase Fusi Ringan (Single-Level Fusion)
Citra dari Fase A dan Fase B digabungkan (*blended*) berdasarkan dua peta bobot (*weight maps*):
1.  **Saliency Weight (Perhatian Visual):** Dihitung dari kuadrat jarak Euclidean piksel terhadap rata-rata warna global dalam ruang warna seragam perseptual **CIELAB**.
2.  **Brightness Weight (Kecerahan Ideal):** Memakai distribusi *Gaussian Curve* untuk memberi nilai tinggi pada piksel dengan eksposur sedang (luminance di sekitar 0.5), dan memberi penalti pada area yang *under-exposed* atau *over-exposed*.

Bobot ini dinormalisasi (`W1 + W2 = 1`) dan dikalikan langsung dengan gambar kandidat. Proses fusi linier ini menggantikan operasi dekomposisi *Laplacian Pyramid* konvensional [3] yang sangat berat, memangkas waktu komputasi secara radikal.

---

### 2.2. Contoh Kasus (Step-by-Step Output)
Untuk memperjelas metodologi **Global LAF**, berikut adalah simulasi pelacakan pemrosesan dari input hingga *output* akhir (menggunakan citra referensi terumbu karang):
1.  **Input Raw:** Citra terumbu karang yang didominasi warna hijau-kebiruan. Saluran merah (R) hampir hilang karena diserap air laut. Gambar terlihat buram (kurang kontras).
2.  **Hasil Fase A:** Algoritma mendeteksi rata-rata R sangat rendah, sehingga *gain* R dikalikan hingga 2.5x. Namun, terdapat area pasir putih terang di dasar karang. Peta atenuasi menekan *gain* di area pasir tersebut. **Hasil visual:** Air laut kembali menjadi kebiruan natural, karang kembali memiliki warna aslinya (merah/kecoklatan), dan pasir tetap berwarna putih terang (tidak bocor menjadi *pink*).
3.  **Hasil Fase B:** Citra dari Fase A diubah ke ruang warna YCbCr. Saluran *Luminance* (Y) yang tadinya datar diproses menggunakan CLAHE. **Hasil visual:** Warna gambar sama persis dengan Fase A, tetapi tekstur terumbu karang, bayangan di celah batu, dan sisik ikan menjadi sangat tegas dan tajam.
4.  **Hasil Fase C (Fusi):** Peta *Saliency* mengenali ikan berwarna cerah sebagai objek menonjol, sementara peta *Brightness* menyaring piksel yang terlalu gelap atau terlalu terang (*over-exposed*). **Hasil Akhir:** Fusi menggabungkan kelembutan warna dari Fase A dan ketajaman tekstur dari Fase B secara proporsional. Citra akhir sangat jernih, tajam, dengan distribusi cahaya yang merata.

---

### 2.3. Metode Pembanding 1: Fast Underwater Enhancer (Fokus Kecepatan)
Metode ini dirancang murni untuk menekan waktu komputasi sekecil mungkin.
*   **Mekanisme:** Menerapkan pemerataan kontras (CLAHE) secara independen pada masing-masing saluran R, G, dan B. Gambar kemudian diubah ke ruang HSI untuk CLAHE pada saluran *Intensity*, diakhiri dengan normalisasi histogram persentil.
*   **Alasan Digunakan dalam Riset:** Sebagai *baseline* ekstrem bawah untuk melihat batas maksimal FPS yang bisa dicapai Python.
*   **Analisis Kelemahan:** Melakukan pemerataan (CLAHE) secara terpisah pada R, G, B adalah pelanggaran integritas warna. Ini mengacaukan rasio asli antar-saluran, menyebabkan warna akhir menjadi sangat artifisial, terdistorsi, dan memicu tingkat saturasi buatan (*over-enhanced*).

### 2.4. Metode Pembanding 2: Adaptive Multichannel Enhancer (Fokus Kualitas)
Metode kompleks (*state-of-the-art*) yang mengandalkan fusi multi-skala.
*   **Mekanisme:** Menggunakan koreksi warna adaptif berbasis pembagian blok (GACC), penajaman detail berbasis *Local Shannon Entropy*, dan menggabungkan keduanya menggunakan dekomposisi **Laplacian-Gaussian Pyramid 5-tingkat** [3] (membongkar gambar menjadi berbagai skala resolusi sebelum digabung).
*   **Alasan Digunakan dalam Riset:** Sebagai *baseline* ekstrem atas (*Golden Standard*) dalam metrik *Naturalness* dan *SSIM*.
*   **Analisis Kelemahan:** Operasi dekomposisi piramida 5 tingkat memaksa CPU melakukan konvolusi (*blurring* & *subsampling*) berkali-kali. Hal ini memakan memori komputasi yang sangat masif, menyebabkan FPS jatuh ke angka < 1 FPS, sehingga mustahil dipasang pada sensor AUV yang melaju di bawah air.

### 2.5. Metode Alternatif Rekan: Local LAF (Fokus Reduksi Memori)
Sebuah arsitektur modifikasi yang diusulkan oleh rekan peneliti, mencoba memperingan beban kerja dari metode *Global LAF*.
*   **Mekanisme:** Alih-alih menghitung peta atenuasi di setiap piksel, metode ini membagi citra ke dalam ukuran kotak **Grid 8x8**. Perhitungan warna hanya dilakukan 64 kali (bukan ratusan ribu kali), dan blok-blok hasil tersebut dibesarkan kembali ke ukuran asli secara instan menggunakan fungsi C++ `cv2.resize` (interpolasi bilinear). Sebagai ganti CLAHE, detail ditajamkan secara kasar menggunakan operasi *Unsharp Masking*.
*   **Alasan Digunakan dalam Riset:** Menguji hipotesis apakah aproksimasi berbasis *Grid* bisa melampaui efisiensi *Pixel-wise*.
*   **Analisis Kelemahan:** Aproksimasi *Grid* merata-ratakan nilai warna, sehingga koreksinya tidak presisi dan meleset pada objek kecil. Penggunaan *Unsharp Masking* terbukti menciptakan *halo effect* (garis pijar putih di tepi objek gelap) yang secara fatal menurunkan tingkat kemiripan struktur benda (SSIM).

---

## 3. Metrik Evaluasi

Evaluasi dilakukan dengan pendekatan ganda agar objektif, mengingat metrik UIE sering memiliki bias matematis:

**No-Reference Metrics (Kualitas Visual Murni):**
*   **UIQM (*Underwater Image Quality Measure*):** Menilai warna (*UICM*), ketajaman (*UISM*), dan kontras (*UIConM*) [4].
*   **UCIQE (*Underwater Color Image Quality Evaluation*):** Berbasis *CIELAB*, mengevaluasi *chroma*, saturasi, dan kontras luminans [5].
*   **NIQE (*Natural Image Quality Evaluator*):** Metrik berbasis jarak statistik (*Mahalanobis distance*) terhadap *corpus* gambar alam yang sempurna [6]. **Semakin rendah NIQE, semakin gambar terlihat natural (tidak artifisial).**

**Full-Reference Metrics (Integritas Struktural):**
Menggunakan dataset **UIEB (Underwater Image Enhancement Benchmark)** [7] yang memiliki gambar referensi.
*   **PSNR (*Peak Signal-to-Noise Ratio*):** Mengukur akurasi absolut piksel (dB).
*   **SSIM (*Structural Similarity Index*):** Mengukur kemiripan tekstur dan struktur benda (Skala 0-1). *Sangat krusial untuk Computer Vision.*

---

## 4. Hasil Eksperimen

Pengujian dilakukan terhadap 4 metode:
1.  **Fast Underwater** (Baseline 1: Kecepatan ekstrem)
2.  **Adaptive Multichannel** (Baseline 2: Kualitas ekstrem)
3.  **Local LAF** (Usulan Alternatif Rekan: Pemrosesan berbasis blok *Grid 8x8* + *Unsharp Masking*)
4.  **Global LAF** (Usulan Anda: Presisi *Pixel-wise Attenuation*)

### A. Evaluasi Agregat
Berdasarkan sampel dataset UIEB:
*   **Fast Underwater** mencetak skor kecepatan fantastis (~30 FPS) dan UIQM yang tinggi. Namun, metode ini memanipulasi histogram terlalu ekstrem, sehingga **merusak struktur gambar** (PSNR & SSIM anjlok) dan warna menjadi tidak natural (NIQE sangat tinggi).
*   **Adaptive Multichannel** memegang rekor SSIM dan NIQE terbaik, namun berjalan sangat lambat pada **~0.6 FPS**.
*   **Local LAF (Grid 8x8)** berhasil berjalan *real-time* (~16 FPS) karena menggunakan teknik merata-ratakan memori ke dalam 64 blok. Namun, kompromi dari hal ini adalah presisi warna yang tidak merata. Penambahan *Unsharp Masking* juga menciptakan *halo effect* yang menurunkan SSIM dan naturalitas gambar.
*   **Proposed Global LAF** mempertahankan presisi di tingkat piksel individual. Meski sedikit lebih lambat dari Local LAF (**~14 FPS**), Global LAF terbukti mencetak **SSIM, PSNR, dan NIQE** terbaik di antara seluruh algoritma yang bersifat *real-time*.

### B. Task-Driven Evaluation (Canny Edge Detection)
Untuk membuktikan kelayakan di skenario robotika nyata, luaran metode diuji menggunakan algoritma deteksi garis tepi (*Canny*). Hasilnya menunjukkan bahwa citra mentah (Raw) kehilangan banyak garis karena rendahnya kontras, sedangkan **Proposed Global LAF memunculkan garis tepian karang dan rintangan bawah laut dengan sangat tegas dan bersih**, tanpa menciptakan garis batas palsu (*noise*) yang umumnya dihasilkan oleh metode *Unsharp Masking*.

---

## 5. Kesimpulan (Sweet-Spot Positioning)

Di industri otomasi robotika bawah laut (AUV), metode peningkatan citra berhadapan pada batas toleransi komputasi keras (*Hard-Edge Computing*). Metode yang indah dipandang namun menyebabkan keterlambatan sistem 2 detik per *frame* (seperti *Adaptive Multichannel*) adalah **tidak aplikatif** karena berisiko tabrakan fatal bagi robot. Di sisi lain, metode ekstrem cepat (seperti *Fast Underwater* atau metode *Unsharp Masking*) menghasilkan warna "buatan" yang justru merusak interpretasi sensor *Visual SLAM*.

Metode **Proposed Global Lightweight Adaptive Fusion (LAF)** membuktikan secara empiris kemampuannya memecahkan dilema tersebut. Melalui teknik *Pixel-wise Brightness Attenuation* dan fusi multiplikatif ringan, algoritma ini menjadi instrumen penyeimbang sempurna (*Pareto Optimal*): Memfasilitasi sistem deteksi *Computer Vision* dengan struktur yang solid (SSIM Tinggi) dan mempertahankan kecepatan operasional navigasi di zona aman (**~14 FPS**). 

---

## 6. Referensi & Sitasi (Supporting Theory)

1.  **Gray World Assumption:** Buchsbaum, G. (1980). *A spatial processor model for object colour perception.* Journal of the Franklin institute, 310(1), 1-26.
2.  **CLAHE:** Zuiderveld, K. (1994). *Contrast limited adaptive histogram equalization.* Graphics gems IV, 474-485.
3.  **Multi-scale Fusion Framework:** Ancuti, C., Ancuti, C. O., Haber, T., & Bekaert, P. (2012). *Enhancing underwater images and videos by fusion.* In 2012 IEEE Conference on Computer Vision and Pattern Recognition (CVPR) (pp. 81-88).
4.  **UIQM Metric:** Panetta, K., Gao, C., & Agaian, S. (2015). *Human-visual-system-inspired underwater image quality measures.* IEEE Journal of Oceanic Engineering, 41(3), 541-551.
5.  **UCIQE Metric:** Yang, M., & Sowmya, A. (2015). *An underwater color image quality evaluation metric.* IEEE Transactions on Image Processing, 24(12), 6062-6071.
6.  **NIQE Metric:** Mittal, A., Soundararajan, R., & Bovik, A. C. (2012). *Making a "completely blind" image quality analyzer.* IEEE Signal processing letters, 20(3), 209-212.
7.  **UIEB Dataset:** Li, C., Guo, C., Ren, W., Cong, R., Hou, J., Kwong, S., & Tao, D. (2019). *An underwater image enhancement benchmark dataset and beyond.* IEEE Transactions on Image Processing, 29, 4376-4389.
