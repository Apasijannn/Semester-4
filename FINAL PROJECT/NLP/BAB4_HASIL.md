# BAB 4 - HASIL DAN PEMBAHASAN

> Draf lengkap, gaya sama dengan `BAB3_METODOLOGI.md`. Bagian bertanda
> *⟨ISI: …⟩* menunggu angka/keterangan dari run final. Placeholder gambar
> bertanda *【GAMBAR …】* dan tabel bertanda *【TABEL …】* beserta deskripsi
> isinya. Semua angka metrik di bawah diambil dari `eval_results-1.jsonl` /
> `eval_results-1.md` dan `results/retrieval_eval.md`.
>
> **WAJIB dibereskan dulu (lihat catatan akhir):**
> 1. Ada **dua** run eval (`eval_results.md` dan `eval_results-1.md`) dengan
>    angka beda tipis. **Pilih satu** sebagai run final, pakai konsisten di
>    seluruh bab, hapus satunya. Draf ini pakai `-1`.
> 2. Generasi dievaluasi pada **n=100** pertanyaan/kondisi (bukan 866 penuh).
>    Test set 866 dipakai untuk **eval retrieval** (Skenario 3). Jangan
>    tertukar.
> 3. `configs/*.yaml` itu nilai prototipe lama (temp 0.7, max 400). Eval
>    sebenarnya pakai greedy, max 420 - ikut yang di Bab 3, bukan yaml.

---

## 4.1 Konfigurasi Lingkungan Penelitian

Seluruh percobaan dijalankan pada lingkungan yang seragam agar hasil
antarmodel dan antarkondisi dapat dibandingkan secara adil. Pelatihan QLoRA
ketiga model berjalan pada GPU NVIDIA A100 40 GB lewat layanan serverless
Modal, sedangkan pembangunan index RAG dan evaluasi generasi dijalankan pada
⟨ISI: lingkungan eval - GPU/Colab/Kaggle/Modal yang dipakai saat generate
prediksi dan hitung metrik⟩. Tumpukan perangkat lunak utama meliputi PyTorch
sebagai kerangka komputasi, Hugging Face Transformers untuk pemuatan model,
PEFT untuk adaptor LoRA, dan bitsandbytes untuk kuantisasi 4-bit. Tabel 4.1
merangkum spesifikasi lengkap lingkungan penelitian.

【TABEL 4.1 - Spesifikasi lingkungan penelitian. Susun dua kolom (Komponen |
Nilai), isi: GPU latih (A100 40 GB Modal), GPU/lingkungan eval ⟨ISI⟩,
PyTorch ⟨ISI versi⟩, Transformers ⟨ISI versi⟩, PEFT ⟨ISI versi⟩, bitsandbytes
⟨ISI versi⟩, Python ⟨ISI versi⟩, jumlah data latih efektif 15.000, test set
866, korpus index 58.940 jawaban → 97.035 chunk, model embedding
multilingual-e5-large-instruct (1024-dim).】

Ukuran data yang dipakai pada tiap tahap juga ditegaskan kembali di sini agar
hasil dapat ditempatkan pada konteksnya. Dari 58.940 pasangan keluhan-jawaban
final, 866 pasang disisihkan sebagai test set terstratifikasi per kategori
topik, dan 58.074 sisanya menjadi training set yang darinya diambil 15.000
pasang sebagai data latih efektif. Korpus RAG memakai seluruh 58.940 jawaban
dokter yang dipecah menjadi 97.035 chunk berukuran 250 token. Evaluasi generasi
dijalankan pada subset 100 pertanyaan per kondisi karena tiap pertanyaan
menuntut tiga proses generasi (base, ft, ft_rag) untuk tiga model, sehingga
biaya komputasi penuh atas 866 pertanyaan tidak sepadan dengan kestabilan
estimasi yang sudah tercapai pada n=100.

---

## 4.2 Hasil Penelitian

Hasil disusun mengikuti tiga skenario pengujian yang dirancang pada Bab 3. Tiap
skenario menjawab satu rumusan masalah, dimulai dari efektivitas fine-tuning,
lalu kontribusi RAG, dan diakhiri kualitas komponen retrieval.

### 4.2.1 Skenario 1 - Efektivitas Fine-tuning QLoRA

Skenario pertama membandingkan tiap model pada kondisi base terhadap kondisi
fine-tuned, sekaligus membandingkan ketiga model satu sama lain. Tabel 4.2
menyajikan enam metrik untuk sembilan kombinasi model-kondisi, dan Tabel 4.3
menyajikan uji signifikansi Wilcoxon signed-rank untuk selisih base → ft.

【TABEL 4.2 - Skor metrik base vs fine-tuned (n=100). Salin dari blok di bawah.
Tebalkan baris/sel terbaik tiap kolom agar pembaca cepat menangkap pemenang.】

| model | kondisi | F1 | BLEU | ROUGE-L | BERTScore | sem-sim |
|---|---|---|---|---|---|---|
| BioMistral | base | 0,1384 | 0,0082 | 0,0976 | 0,8405 | 0,8950 |
| BioMistral | ft | 0,2150 | 0,0229 | 0,1474 | 0,8555 | 0,9159 |
| Qwen2.5 | base | 0,2499 | 0,0215 | 0,1376 | 0,8593 | 0,9320 |
| Qwen2.5 | ft | 0,2625 | 0,0316 | 0,1592 | 0,8623 | 0,9266 |
| SEA-LION | base | 0,2708 | 0,0252 | 0,1517 | 0,8599 | 0,9336 |
| SEA-LION | ft | 0,2556 | 0,0407 | 0,1653 | 0,8582 | 0,9333 |

Paragraf pembacaan (tulis kira-kira begini, sesuaikan bila ganti run):
Fine-tuning memberi lonjakan terbesar pada BioMistral, model dengan titik awal
terendah. Token-F1-nya naik dari 0,1384 ke 0,2150 dan ROUGE-L dari 0,0976 ke
0,1474, kenaikan terbesar di antara ketiga model. Pola ini masuk akal karena
BioMistral berorientasi domain medis berbahasa Inggris sehingga paling banyak
belajar gaya jawaban dan bahasa Indonesia dari data Alodokter. Qwen2.5 naik
lebih tipis namun konsisten di seluruh metrik overlap. SEA-LION justru bergerak
campur: BLEU dan ROUGE-L naik, tetapi Token-F1 dan kemiripan semantik sedikit
turun, menandakan model ini sudah kuat sejak base sehingga adaptasi gaya tidak
banyak menambah dan sebagian malah menggeser dari acuan.

【TABEL 4.3 - Uji signifikansi base → ft (Wilcoxon signed-rank, p<0,05 = *).
Salin dari blok di bawah.】

| model | metrik | mean Δ | p-value | sig |
|---|---|---|---|---|
| BioMistral | F1 | +0,0765 | 0,0000 | * |
| BioMistral | BLEU | +0,0146 | 0,0000 | * |
| BioMistral | ROUGE-L | +0,0498 | 0,0000 | * |
| BioMistral | BERTScore | +0,0150 | 0,0000 | * |
| BioMistral | sem-sim | +0,0208 | 0,0000 | * |
| Qwen2.5 | F1 | +0,0126 | 0,0128 | * |
| Qwen2.5 | BLEU | +0,0101 | 0,0005 | * |
| Qwen2.5 | ROUGE-L | +0,0217 | 0,0001 | * |
| Qwen2.5 | BERTScore | +0,0030 | 0,0019 | * |
| Qwen2.5 | sem-sim | -0,0054 | 0,0237 | * |
| SEA-LION | F1 | -0,0153 | 0,1701 | |
| SEA-LION | BLEU | +0,0155 | 0,0032 | * |
| SEA-LION | ROUGE-L | +0,0135 | 0,1402 | |
| SEA-LION | BERTScore | -0,0017 | 0,9589 | |
| SEA-LION | sem-sim | -0,0004 | 0,5729 | |

Paragraf pembacaan signifikansi:
Pada BioMistral seluruh selisih signifikan dengan p mendekati nol, jadi
fine-tuning QLoRA benar-benar mengangkat model domain-first ini, bukan sekadar
fluktuasi. Qwen2.5 juga signifikan di lima dari lima metrik overlap, meski
kemiripan semantiknya turun tipis tapi signifikan. SEA-LION hanya signifikan di
BLEU; perubahan metrik lain tidak signifikan, menegaskan model ini sudah berada
di langit-langit kemampuannya untuk tugas ini sejak kondisi base.

【GAMBAR 4.1 - Diagram batang berkelompok Token-F1 base vs ft untuk tiga model.
Sumbu-x tiga model, tiap model dua batang (base, ft). Visual ini menegaskan
lonjakan BioMistral dan posisi awal tinggi SEA-LION. Buat dari angka Tabel 4.2.】

Temuan kunci Skenario 1: dalam kondisi terbaiknya, SEA-LION (fine-tuned)
memimpin pada mayoritas metrik dan dipilih sebagai model terbaik keseluruhan
untuk tahap RAG. Yang lebih penting secara ilmiah, dua model language-first dan
regional (Qwen2.5 dan SEA-LION) mengungguli model domain-first (BioMistral)
pada hampir semua metrik, mendukung hipotesis bahwa untuk QA medis berbahasa
Indonesia dari forum awam, penguasaan bahasa lebih menentukan daripada
pengetahuan domain medis berbahasa Inggris. ⟨ISI: pastikan satu kalimat
eksplisit menyebut model mana yang dipilih untuk Skenario 2 - draf ini asumsi
SEA-LION; samakan dengan keputusan sebenarnya.⟩

### 4.2.2 Skenario 2 - Kontribusi RAG

Skenario kedua menambahkan konteks retrieval pada model terbaik dan
membandingkan kondisi fine-tuned terhadap fine-tuned + RAG secara berpasangan
pada pertanyaan yang sama. Tabel 4.4 menyajikan skor, Tabel 4.5 uji
signifikansinya. Kolom faithfulness hanya terisi pada kondisi RAG karena metrik
ini mengukur dukungan konteks terhadap jawaban.

【TABEL 4.4 - Skor ft vs ft_rag untuk model terpilih (dan, bila ingin lengkap,
ketiga model). Salin baris ft dan ft_rag dari blok di bawah.】

| model | kondisi | F1 | BLEU | ROUGE-L | BERTScore | sem-sim | faithfulness |
|---|---|---|---|---|---|---|---|
| BioMistral | ft | 0,2150 | 0,0229 | 0,1474 | 0,8555 | 0,9159 | - |
| BioMistral | ft_rag | 0,2134 | 0,0188 | 0,1408 | 0,8555 | 0,9149 | 0,4494 |
| Qwen2.5 | ft | 0,2625 | 0,0316 | 0,1592 | 0,8623 | 0,9266 | - |
| Qwen2.5 | ft_rag | 0,2320 | 0,0255 | 0,1447 | 0,8541 | 0,9175 | 0,4143 |
| SEA-LION | ft | 0,2556 | 0,0407 | 0,1653 | 0,8582 | 0,9333 | - |
| SEA-LION | ft_rag | 0,2737 | 0,0422 | 0,1709 | 0,8591 | 0,9325 | 0,3641 |

【TABEL 4.5 - Uji signifikansi ft → ft_rag (Wilcoxon, p<0,05 = *). Salin dari
blok di bawah.】

| model | metrik | mean Δ | p-value | sig |
|---|---|---|---|---|
| BioMistral | F1 | -0,0016 | 0,7431 | |
| BioMistral | BLEU | -0,0040 | 0,4034 | |
| BioMistral | ROUGE-L | -0,0066 | 0,1766 | |
| BioMistral | BERTScore | +0,0000 | 0,8906 | |
| BioMistral | sem-sim | -0,0009 | 0,7362 | |
| Qwen2.5 | F1 | -0,0305 | 0,0019 | * |
| Qwen2.5 | BLEU | -0,0061 | 0,0586 | |
| Qwen2.5 | ROUGE-L | -0,0146 | 0,0142 | * |
| Qwen2.5 | BERTScore | -0,0081 | 0,0031 | * |
| Qwen2.5 | sem-sim | -0,0091 | 0,0011 | * |
| SEA-LION | F1 | +0,0181 | 0,3055 | |
| SEA-LION | BLEU | +0,0015 | 0,4494 | |
| SEA-LION | ROUGE-L | +0,0057 | 0,4724 | |
| SEA-LION | BERTScore | +0,0009 | 0,9315 | |
| SEA-LION | sem-sim | -0,0008 | 0,5230 | |

Paragraf pembacaan:
Untuk SEA-LION, model terpilih, penambahan RAG menggeser seluruh metrik ke arah
positif kecuali kemiripan semantik yang turun sangat tipis, namun tidak satu pun
selisih itu signifikan secara statistik. Artinya pada model terbaik, RAG
bersifat netral: tidak menurunkan kualitas, juga tidak menaikkannya secara
meyakinkan. Pola berbeda muncul pada Qwen2.5, di mana RAG justru menurunkan
empat dari lima metrik secara signifikan, sementara pada BioMistral seluruh
selisih kecil dan tidak signifikan. Skor faithfulness berkisar 0,36-0,45,
menandakan kurang dari separuh isi jawaban benar-benar didukung (entailed) oleh
konteks yang diambil. Temuan netral ini konsisten dengan literatur (Xiong dkk.,
2024) bahwa RAG tidak otomatis menaikkan kualitas dan sangat bergantung pada
mutu retrieval, dan menjadi temuan jujur yang dibahas tuntas di subbab 4.3.

【GAMBAR 4.2 - Diagram batang ft vs ft_rag untuk model terpilih pada keenam
metrik, agar netralnya selisih terlihat secara visual.】

### 4.2.3 Skenario 3 - Kualitas Retrieval

Skenario ketiga mengukur mutu komponen retrieval secara terpisah dari generasi,
memakai 866 pertanyaan test sebagai kueri dan jawaban dokter berpasangan sebagai
gold. Karena tiap kueri hanya punya satu jawaban gold, recall@k setara hit-rate@k.
Tabel 4.6 menyajikan metrik peringkat pada konfigurasi produksi (hybrid 0,6/0,4).

【TABEL 4.6 - Metrik peringkat retrieval, hybrid 0,6/0,4. Salin dari blok.】

| k | recall | precision | nDCG |
|---|---|---|---|
| 1 | 0,4157 | 0,4157 | 0,4157 |
| 3 | 0,5751 | 0,1917 | 0,5087 |
| 5 | 0,6570 | 0,1314 | 0,5425 |
| 10 | 0,7344 | 0,0734 | 0,5674 |

MRR = 0,5148. Presisi menurun seiring k karena hanya ada satu gold per kueri
(plafon presisi = 1/k), jadi recall, nDCG, dan MRR yang informatif.

Untuk membuktikan setiap komponen berkontribusi, dilakukan ablasi yang
membandingkan dense saja, BM25 saja, dan hybrid. Tabel 4.7 menyajikannya.

【TABEL 4.7 - Ablasi komponen retrieval. Salin dari blok.】

| konfigurasi | recall@1 | recall@3 | recall@5 | nDCG@5 | MRR |
|---|---|---|---|---|---|
| dense saja | 0,4065 | 0,5566 | 0,6316 | 0,5243 | 0,5015 |
| BM25 saja | 0,1316 | 0,2125 | 0,2714 | 0,2031 | 0,1887 |
| hybrid 0,6/0,4 | 0,4157 | 0,5751 | 0,6570 | 0,5425 | 0,5148 |

Paragraf pembacaan:
BM25 sendirian lemah (recall@3 hanya 0,21) karena pertanyaan pasien
memparafrase, bukan mencocokkan kata kunci. Dense retrieval menopang sistem
(recall@3 0,56), dan fusi hybrid mengungguli dense saja pada setiap metrik,
membuktikan kedua jalur saling melengkapi. Sapuan bobot menunjukkan kurva
cekung dengan puncak pada dense_weight 0,6 (Tabel 4.8), sehingga konfigurasi
terpasang adalah optimum empiris, bukan tebakan.

【TABEL 4.8 - Sapuan bobot hybrid (dense_weight 0,0-1,0 vs recall@3, recall@5,
nDCG@5, MRR). Salin dari `results/retrieval_eval.md` bagian 3. Opsional: ganti
jadi GAMBAR 4.3 grafik garis recall@3 terhadap dense_weight, puncak di 0,6.】

⟨ISI opsional: bila run ablasi e5 vs BGE-M3 selesai, tambah Tabel 4.9
perbandingan dua model embedding. Bila belum, hapus klaim perbandingan embedding
dari Bab 3.1 Skenario 3 agar konsisten - jangan janjikan yang tak dilaporkan.⟩

### 4.2.4 Contoh Kualitatif

Untuk melengkapi angka, Tabel 4.10 menyajikan satu pertanyaan beserta jawaban
keempat sumber agar perbedaan kualitas tampak nyata.

【TABEL 4.10 - Contoh kualitatif. Empat baris: Keluhan pasien | Jawaban base |
Jawaban fine-tuned | Jawaban fine-tuned+RAG | Jawaban dokter asli. Pilih satu
kasus dari `eval_preds-1.jsonl` yang menunjukkan: base ngawur/terpotong, ft
lebih rapi dan berpersona Medi, ft_rag menambah detail dari konteks. Sensor
nama bila ada.】

⟨ISI: ambil satu contoh nyata dari eval_preds-1.jsonl, salin teksnya ke Tabel
4.10. Pilih kasus yang naratifnya jelas - penguji suka bukti kualitatif ini.⟩

---

## 4.3 Pembahasan

Bagian ini menjelaskan **mengapa** angka di atas muncul, bukan sekadar
mengulanginya. Empat pokok dibahas: keunggulan language-first, netralnya RAG,
keterbatasan metrik, dan analisis kesalahan.

**Domain-first kalah dari language-first.** Hasil Skenario 1 menunjukkan
BioMistral, satu-satunya model domain-first, berangkat dari titik terendah dan
walau naik paling banyak setelah fine-tuning tetap tidak menyusul Qwen2.5
maupun SEA-LION. Penjelasannya, keunggulan BioMistral terletak pada pengetahuan
biomedis berbahasa Inggris hasil pra-latih di PubMed, sedangkan tugas ini
menuntut pemahaman keluhan awam berbahasa Indonesia dan perangkaian jawaban yang
luwes dalam bahasa itu. Pengetahuan domain Inggris tidak otomatis berpindah
lintas bahasa, sementara penguasaan bahasa yang sudah dimiliki Qwen2.5
(multilingual) dan SEA-LION (dikhususkan Asia Tenggara) langsung terpakai. Untuk
QA forum kesehatan Indonesia, modal bahasa lebih menentukan daripada modal
domain medis berbahasa asing.

**Mengapa RAG netral, bukan naik.** Tiga sebab saling menguatkan. Pertama,
mutu retrieval terbatas: recall@3 sekitar 0,58 dan faithfulness 0,36-0,45,
sehingga konteks yang diambil sering relevan secara topik tetapi tidak persis
pada aspek yang ditanya, dan model tidak selalu mendapat bahan yang menambah
nilai. Kedua, corpus Alodokter sangat duplikatif: keluhan umum seperti "sakit
kepala sebelah" muncul ratusan kali dengan jawaban dokter berbeda yang
sama-sama valid, sehingga jawaban berpasangan yang persis sering tidak masuk
top-3, dan metrik own-answer recall menjadi proksi yang pesimistis. Ketiga,
RAG naif sempat mendorong model menyalin konteks verbatim sehingga butuh
instruksi sintesis pada prompt; setelah perbaikan itu, RAG berhenti merusak
tetapi belum cukup untuk menaikkan skor overlap terhadap satu jawaban acuan.
Pada Qwen2.5 efek negatif RAG bahkan signifikan, menandakan model yang sudah
kuat dapat terganggu oleh konteks yang tidak presisi. Temuan netral ini bukan
kegagalan eksperimen melainkan hasil yang jujur dan sejalan dengan Xiong dkk.
(2024).

**Keterbatasan metrik.** Keenam metrik mengukur kemiripan permukaan (Token-F1,
BLEU, ROUGE-L) atau makna (BERTScore, sem-sim, faithfulness) terhadap satu
jawaban dokter acuan, bukan kebenaran atau keamanan klinis. Sebuah jawaban bisa
benar dan aman secara medis namun berbeda kata dari acuan sehingga skornya
rendah, atau sebaliknya mirip permukaan namun salah detail klinis. Karena
banyak jawaban benar mungkin untuk satu keluhan, metrik berbasis acuan tunggal
ini secara sistematis meremehkan kualitas, khususnya untuk kontribusi RAG.
Keterbatasan ini diakui terbuka dan menjadi dasar saran perbaikan di Bab 5.

**Analisis kesalahan.** ⟨ISI: kategorikan kegagalan dari membaca
eval_preds-1.jsonl. Kategori yang biasa muncul: (a) pengulangan/looping frasa,
(b) jawaban terpotong di batas token, (c) halusinasi detail yang tak ada di
konteks, (d) jawaban benar topik tapi salah aspek pertanyaan. Beri perkiraan
proporsi kasar tiap kategori dari sampel, mis. "dari 20 output yang ditinjau
manual, X menunjukkan…". Ini menunjukkan kamu paham penyebab, bukan sekadar
lapor skor.⟩

### 4.4 Hasil Deployment Bot Telegram

Sistem akhir, yakni model terpilih digabung pipeline RAG, dipasang sebagai bot
Telegram untuk demonstrasi langsung. Bot menerima keluhan, mengambil konteks
lewat retrieval hybrid, menyusun prompt, memanggil model, dan membalas dengan
disklaimer bahwa informasi bersifat edukatif dan bukan pengganti konsultasi
medis.

⟨ISI: lingkungan hosting bot (Kaggle/Modal/lokal), apakah model penuh atau
terkuantisasi saat penyajian, latensi kasar per balasan bila terukur.⟩

【GAMBAR 4.4 - Tangkapan layar bot Telegram menjawab satu keluhan: gelembung
pertanyaan pengguna, jawaban "Medi", dan baris disklaimer.】

---

## Catatan kelengkapan untuk penulis

- **Kunci satu run eval.** Pilih `eval_results.md` ATAU `eval_results-1.md`,
  pakai konsisten, hapus satunya dari laporan. Draf ini pakai `-1`.
- Lengkapi seluruh *⟨ISI: …⟩*: lingkungan & versi (4.1), kalimat model terpilih
  (4.2.1), contoh kualitatif (4.2.4), analisis kesalahan (4.3), deployment
  (4.4), dan opsional perbandingan embedding (4.2.3).
- Render GAMBAR 4.1, 4.2, 4.3 dari angka tabel; GAMBAR 4.4 dari tangkapan layar.
  Sisipkan tiap gambar **setelah** kalimat penyajiannya.
- Pastikan tiap metrik yang muncul di sini sudah dijelaskan di Bab 2.2.8, dan
  tiap metrik di Bab 3.2.7 muncul di sini. Tidak boleh ada metrik yatim.
- Jaga konsistensi klaim: fine-tuning naik signifikan, RAG netral, language-first
  unggul. Jangan poles RAG jadi seakan naik.
- Nomor tabel/gambar di sini lanjut dari Bab 3 (Tabel 3.x, Gambar 3.x). Sesuaikan
  bila penomoran skripsi pakai gaya lain.
