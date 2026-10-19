# Panduan Penyusunan BAB 2–5 — Laporan FP

> Tujuan dokumen ini: checklist + arahan isi tiap bab supaya paper solid dan
> konsisten dengan sistem yang benar-benar dibangun (QLoRA 3 model + RAG hybrid
> di atas data Alodokter). Bukan teks jadi — ini kerangka isi + apa yang harus
> kamu sajikan, kenapa, dan apa yang dicari penguji.

---

## ⚠️ Hal yang WAJIB dibereskan dulu (sebelum nulis)

1. **Buang sisa copy-paste laporan lama.** Mulai dari BAB 2 ke bawah di
   `Laporan FP.docx.md` masih berisi materi NER / berita kriminalitas / format
   BIO / stemming / skenario batch size. Itu BUKAN proyek ini. Hapus total,
   ganti dengan isi RAG-medis. Daftar Isi, Daftar Tabel, Daftar Gambar, Daftar
   Kode Semu juga ikut diganti.

2. **Selaraskan Rumusan Masalah dengan Tujuan.** Rumusan Masalah sekarang
   fokus ke "BioMistral 7B" saja, tapi Tujuan membandingkan 3 model
   (BioMistral, Qwen2.5, SEA-LION). Pilih satu framing:
   - **Rekomendasi:** ubah rumusan jadi membandingkan 3 model dulu (domain-first
     vs language-first), lalu model terbaik diberi RAG. Ini sesuai yang
     benar-benar dikerjakan dan jadi nilai jual utama paper.

3. **Konsistenkan klaim hasil dengan data nyata.** Hasil eval menunjukkan:
   fine-tuning naik signifikan, RAG netral (tidak signifikan) setelah perbaikan
   prompt, SEA-LION model terbaik. Jangan menulis "RAG meningkatkan akurasi
   secara signifikan" kalau datanya tidak begitu — temuan "RAG netral / naive RAG
   bisa menurunkan kualitas" justru temuan ilmiah yang valid dan menarik.

---

## BAB 2 — TINJAUAN PUSTAKA

### 2.1 Penelitian Terkait

Pakai **5 penelitian** (semua sudah terbit di jurnal/konferensi resmi — hindari
arXiv/ResearchGate kecuali terpaksa), dikelompokkan ke 3 tema yang langsung
menopang proyek. Untuk tiap penelitian, tiap paragraf harus menutup dengan
kalimat celah ("…namun belum ada yang X"), dan X = yang kamu kerjakan.

**Tema A — QA medis berbahasa Indonesia (anchor domain)**

- **Hanami, Mahendra & Wicaksono (2025) — "Semantic classification of Indonesian
  consumer health questions"**, *Journal of Biomedical Semantics* (Springer,
  Scopus).
  Yang harus dibahas: domain identik dengan proyekmu (forum kesehatan konsumen
  Indonesia, awam bertanya ke tenaga medis). Mereka menyelesaikan **satu modul
  hulu**: mengklasifikasi tipe/semantic intent pertanyaan agar bisa dirutekan.
  Tegaskan relevansi bukan dari metode (mereka klasifikasi, kamu generasi) tapi
  dari **problem setup + motivasi yang sama** ("forum lambat menjawab karena
  tenaga medis terbatas → butuh QA otomatis"). Celah: berhenti di pemahaman
  pertanyaan, **belum menghasilkan jawaban** — proyek ini melanjutkannya dengan
  generasi jawaban berbasis LLM + RAG.

- **Firdaus, Sumardi & Kulsum (2024) — "Integrating Retrieval-Augmented
  Generation with LLM Mistral 7b for Indonesian Medical Herb"**, *JISKA* (Sinta).
  Yang harus dibahas: ini **pembanding metode paling sebanding** — RAG + Mistral
  7B + medis + Indonesia, sama-sama generasi jawaban. Jelaskan arsitektur RAG
  mereka, sumber pengetahuan (tanaman obat / basis pengetahuan statis), dan satu
  model tunggal tanpa fine-tuning pembanding. Celah: knowledge-base herbal yang
  kaku, satu model, tanpa fine-tuning — proyek ini pakai **data forum
  dokter-pasien nyata, membandingkan 3 model lintas-bahasa, dan QLoRA**.

**Tema B — LLM medis & adaptasi lintas-bahasa**

- **Labrak dkk. (2024) — "BioMistral"**, *Findings of ACL 2024*.
  Yang harus dibahas: pendekatan **domain-first** (pra-latih lanjutan di korpus
  biomedis PubMed). Kuat di benchmark medis Inggris, tapi turun di bahasa lain.
  Celah: keunggulan domain Inggris tidak otomatis berpindah ke QA berbahasa
  Indonesia — ini **motivasi langsung** eksperimen domain-first vs language-first
  kamu.

- **Paiola dkk. (2025) — "Adapting LLMs for the Medical Domain in Portuguese: A
  Study on Fine-Tuning and Model Evaluation"**, *WSCG 2025 Proceedings* (DOI
  10.24132/CSRN.2025-37, peer-reviewed conference).
  Yang harus dibahas: paralel paling dekat secara metode — adaptasi LLM medis ke
  bahasa **non-Inggris bersumber daya menengah** (Portugis Brasil) lewat
  fine-tuning untuk asisten medis virtual. Tunjukkan bahwa adaptasi bahasa
  terbukti penting di luar Inggris. Celah: Portugis bukan Indonesia; belum
  menggabungkan RAG; tidak membandingkan domain-first vs language-first.
  *(Catatan: ini paper bervenue paling lemah di list — WSCG bukan venue NLP/medis
  utama. Tetap valid karena peer-reviewed & published, tapi kalau mau ramping,
  paper inilah yang paling bisa dilepas → cukup 4 penelitian. Nilai uniknya:
  satu-satunya angle adaptasi medis lintas-bahasa non-Inggris.)*

**Tema C — RAG untuk QA medis**

- **Xiong dkk. (2024) — "Benchmarking Retrieval-Augmented Generation for
  Medicine"**, *Findings of ACL 2024*.
  Yang harus dibahas: evaluasi sistematis RAG pada beragam korpus & retriever
  medis; temuan bahwa RAG **tidak selalu menaikkan** kualitas, tergantung
  kualitas retrieval. Ini menopang temuan jujurmu (RAG netral). Celah: berbahasa
  Inggris, bukan data forum awam Indonesia.

**Tabel 2.1 — Perbandingan Penelitian Terkait.** Kolom: Penulis (Tahun) |
Metode | Bahasa/Domain | Dataset | Hasil utama | Keterbatasan. Baris terakhir:
**"Penelitian ini"** dengan kolom keterbatasan diisi "—" (menegaskan posisimu
mengisi celah: cross-lingual + QLoRA + RAG + Indonesia + data forum).

> Yang dicari penguji: bukan ringkasan paper satu-satu, tapi **narasi celah**.
> Tiap paragraf harus berakhir pada "…namun belum ada yang X", dan X itu = yang
> kamu kerjakan. Dua anchor Indonesia (Hanami, Firdaus) yang membuat klaim
> "celah Indonesia" kredibel — jangan dihapus.

### 2.2 Dasar Teori

Susun dari umum → spesifik. Pola tiap subbab **wajib sama**: (1) definisi, (2)
cara kerja / rumus bila ada, (3) **kalimat relevansi ke sistemmu** ("dalam
penelitian ini, … dipakai untuk …"). Jangan ada teori menggantung — tiap
konsep harus menjelaskan komponen nyata di sistem. Panjang ideal: 0.5–1.5
halaman per subbab (kecuali 2.2.3 LoRA/QLoRA & 2.2.8 metrik, boleh lebih).

#### 2.2.1 Large Language Model & Arsitektur Transformer *(tipis — secukupnya)*
> Catatan: kamu **tidak memodifikasi arsitektur**, jadi subbab ini cukup tipis
> (≈0.5 halaman). Tujuannya cuma kasih pembaca konteks "LLM/Transformer itu
> apa" sebelum masuk model-spesifik. **Jangan derivasi rumus attention** —
> itu padding yang tak menopang kontribusimu. Bobot taruh di 2.2.7.
- **Bahas (singkat):** definisi LLM (model bahasa berparameter besar, dilatih
  self-supervised pada korpus teks raksasa). Sebut Transformer berbasis
  **self-attention** & arsitektur **decoder-only autoregresif** (prediksi token
  berikutnya) — cukup 2–3 kalimat, tanpa menurunkan rumus. Singgung tokenisasi
  subword seperlunya.
- **Relevansi:** ketiga modelmu (BioMistral, Qwen2.5, SEA-LION) semuanya
  Transformer decoder-only — fondasi kenapa bisa di-fine-tune & generate jawaban.
- *Sandaran:* Vaswani dkk. (2017) — sitir **sekali** sebagai asal-usul.

#### 2.2.2 Fine-tuning & Parameter-Efficient Fine-Tuning (PEFT)
- **Bahas:** beda **full fine-tuning** (update semua bobot — mahal memori,
  butuh menyimpan optimizer state untuk miliaran param) vs **PEFT** (bekukan
  bobot dasar, latih sedikit parameter tambahan). Motivasi: 7–9B param tak muat
  di-full-finetune pada GPU konsumer/sewa terbatas. Sebut keluarga PEFT
  (adapter, prefix-tuning, LoRA) singkat.
- **Relevansi:** justifikasi metodologis — kenapa kamu pilih PEFT, bukan full
  fine-tuning. Jembatan ke 2.2.3.

#### 2.2.3 LoRA & QLoRA *(porsi besar — inti metode)*
- **Bahas LoRA:** dekomposisi low-rank. Bobot tak di-update langsung; ditambah
  matriks `ΔW = B·A` dengan rank `r ≪ dimensi`. Hanya A & B dilatih.
  Hyperparameter: **rank r**, **alpha (α)** (skala `α/r`), **target modules**
  (mis. q_proj, v_proj), dropout.
- **Rumus:** `h = W₀x + (α/r)·B·A·x`, dengan `A∈ℝ^{r×d}`, `B∈ℝ^{d×r}`,
  `B` diinisialisasi nol.
- **Bahas QLoRA:** kuantisasi bobot dasar ke **4-bit NF4** (NormalFloat),
  **double quantization**, **paged optimizer**. Gradien mengalir lewat bobot
  4-bit ke adapter LoRA presisi penuh. Efek: muat di 1 GPU, kualitas ≈ full
  fine-tuning.
- **Relevansi:** tulis konfigurasi yang kamu pakai (r, α, target modules,
  presisi bf16). Ini yang dicari penguji untuk reproducibility — samakan dengan
  BAB 3.2.4.
- *Sandaran:* Hu dkk. (2021) LoRA; Dettmers dkk. (2023) QLoRA.

#### 2.2.4 Retrieval-Augmented Generation (RAG)
- **Bahas:** definisi RAG — gabung **retriever** (cari dokumen relevan dari
  korpus) + **generator** (LLM merangkai jawaban). Beda dua fase: **indexing**
  (offline: embed korpus, simpan) vs **query-time** (online: embed query, ambil
  top-k, susun prompt). Tegaskan **in-context injection**: konteks disuntik
  **lewat prompt** (system + konteks + pertanyaan) — pendekatan standar
  (vs RAG arsitektural ala Lewis yang melatih retriever+generator bersama).
- **Relevansi:** sistemmu = RAG in-context di atas LLM yang sudah di-fine-tune.
  Jelaskan kenapa pilih ini: tak perlu latih ulang, modular, murah.
- *Sandaran:* Lewis dkk. (2020).

#### 2.2.5 Dense Retrieval & Sentence Embedding
- **Bahas:** representasi teks jadi vektor padat (dense embedding) lewat model
  encoder. **Cosine similarity** untuk ukur kemiripan. **Wajib satu vector
  space**: query & korpus harus diembed model yang sama, kalau beda → mismatch.
  Sebut model: multilingual-E5-large-instruct (pakai instruction prefix) &
  BGE-M3 (konteks panjang 8192, tanpa prefix).
- **Rumus:** `cos(u,v) = (u·v)/(‖u‖‖v‖)`.
- **Relevansi (penting — novelty-mu):** jelaskan strategi indexing yang kamu
  pilih. Default RAG = embed **jawaban** dokumen. Kamu uji juga **Q→Q
  retrieval**: embed **pertanyaan/keluhan pasien** lalu kembalikan jawaban
  dokter — mengurangi *semantic gap* antara bahasa awam pasien & bahasa formal
  dokter. Ini jadi bahan Skenario 3.
- *Sandaran:* Wang dkk. (2024) E5; Chen dkk. (2024) BGE-M3.

#### 2.2.6 Sparse Retrieval (BM25) & Hybrid Search
- **Bahas:** BM25 — pencarian leksikal berbasis **term frequency** + inverse
  document frequency + normalisasi panjang dokumen. Kelebihan: tangkap istilah
  spesifik/nama obat/typo persis. Kelemahan: buta sinonim/parafrase.
  **Hybrid** = gabung skor dense (makna) + BM25 (leksikal), dinormalisasi
  (min-max) lalu dibobot.
- **Rumus:** skor fusi `score = w_dense·norm(dense) + w_bm25·norm(bm25)`;
  sebut bobot yang kamu pakai (0.6 / 0.4).
- **Relevansi:** kenapa hybrid: dense nangkap makna keluhan, BM25 nangkap
  istilah medis langka — saling menutup.
- *Sandaran:* Robertson & Zaragoza (BM25, buku/teks IR).

#### 2.2.7 Model Pra-terlatih yang Digunakan *(porsi besar — sumbu utama eksperimen)*
> Ini subbab paling *load-bearing* di Dasar Teori: seluruh Skenario 1
> membandingkan ketiga model ini. Bahas tiap model **satu paragraf penuh** dari
> paper aslinya, bukan sekadar satu baris. Yang dicari: pembaca paham **kenapa
> ketiga model ini dipilih** dan apa hipotesis di balik perbandingannya.
- **Bahas tiap model — basis, data pra-latih, cara adaptasi, positioning:**
  - **BioMistral-7B-DARE** *(domain-first)* — basis Mistral-7B, **pra-latih
    lanjutan (continued pretraining) pada korpus biomedis PubMed Central**.
    DARE = teknik *model merging* yang menggabung bobot medis & instruct. Kuat
    di benchmark medis **Inggris** (MedQA, PubMedQA), tapi paper aslinya
    melaporkan **performa turun di bahasa non-Inggris**. Sebut: inilah yang mau
    kamu uji di Indonesia.
  - **Qwen2.5-7B-Instruct** *(language-first)* — LLM multilingual Alibaba,
    pra-latih pada korpus sangat besar (~18T token) lintas banyak bahasa
    termasuk bahasa Asia, lalu instruction-tuned. Kuat ikut-instruksi &
    penalaran umum; tidak dikhususkan domain medis.
  - **Gemma-SEA-LION-v3-9B-IT** *(regional)* — basis Gemma2-9B, **diadaptasi
    khusus bahasa Asia Tenggara** (termasuk Indonesia, Jawa, Sunda) oleh
    AI Singapore. Positioning: penguasaan bahasa regional terdalam dari ketiganya.
- **Sajikan Tabel 2.2:** Model | Basis | Ukuran | Data/strategi pra-latih |
  Positioning (domain-first / language-first / regional).
- **Relevansi (hipotesis inti skripsi):** untuk QA medis **bahasa Indonesia**
  dari forum awam, **penguasaan bahasa** (language-first/regional) diduga lebih
  menentukan daripada **pengetahuan domain medis Inggris** (domain-first). Tiga
  model ini sengaja dipilih mewakili tiga strategi berbeda → Skenario 1
  menguji dugaan ini secara langsung. Tegaskan eksplisit: pemilihan model
  **bukan acak**, tapi desain untuk membenturkan domain-first vs language-first.
- *Sandaran:* Labrak dkk. (2024) BioMistral; Qwen2.5 Technical Report;
  SEA-LION (AI Singapore).

#### 2.2.8 Metrik Evaluasi *(porsi besar)*
Untuk **tiap** metrik tulis: rumus/definisi singkat + "mengukur apa" +
**keterbatasan**. Tiap metrik di sini WAJIB muncul lagi di BAB 4.
- **Token-F1** — irisan token prediksi vs referensi (harmonic mean
  precision/recall token). Mengukur tumpang-tindih kata. Batas: buta urutan &
  makna.
- **BLEU** — presisi n-gram + brevity penalty. Mengukur kemiripan n-gram ke
  referensi. Batas: lemah untuk jawaban open-ended (banyak jawaban benar beda
  kata).
- **ROUGE-L** — longest common subsequence. Mengukur cakupan isi referensi.
  Batas: tetap berbasis overlap permukaan, satu referensi.
- **BERTScore** — cosine similarity embedding token (pakai xlm-roberta-large).
  Mengukur kemiripan **semantik**, bukan kata persis. Batas: bergantung kualitas
  model embedding, tak menjamin kebenaran faktual.
- **Semantic Similarity** — cosine antara embedding kalimat (E5) jawaban vs
  referensi. Mengukur kedekatan makna keseluruhan. Batas: bisa tinggi walau
  detail klinis salah.
- **NLI Faithfulness** — model NLI (mDeBERTa-xnli) cek apakah jawaban
  *entailed* oleh konteks/referensi (deteksi halusinasi/kontradiksi). Mengukur
  kesetiaan. Batas: bergantung akurasi model NLI lintas-bahasa.
- **Uji signifikansi:** **Wilcoxon signed-rank** (berpasangan, non-parametrik) —
  jelaskan kenapa: data berpasangan (model sama, sampel sama), distribusi selisih
  tak diasumsikan normal.
- **Penutup jujur:** semua metrik di atas mengukur **kemiripan permukaan/semantik
  ke satu jawaban dokter**, bukan kebenaran/keamanan klinis. Akui ini — justru
  memperkuat pembahasan BAB 4.
- *Sandaran:* Zhang dkk. (2020) BERTScore; sitir paper asal BLEU (Papineni 2002)
  & ROUGE (Lin 2004).

**Peta sitasi Dasar Teori (paper sandaran tiap subbab):**

| Subbab | Paper sandaran |
|---|---|
| 2.2.1 Transformer | Vaswani dkk. (2017) — *Attention Is All You Need* |
| 2.2.2–2.2.3 PEFT/LoRA/QLoRA | Hu dkk. (2021) LoRA; Dettmers dkk. (2023) QLoRA (NeurIPS) |
| 2.2.4 RAG | Lewis dkk. (2020) RAG (NeurIPS) |
| 2.2.5 Dense embedding | Wang dkk. (2024) Multilingual-E5; Chen dkk. (2024) BGE-M3 (ACL) |
| 2.2.6 BM25 / hybrid | Robertson & Zaragoza (BM25) — sitir buku teks IR bila perlu |
| 2.2.7 Model pra-terlatih | BioMistral (Labrak 2024); Qwen2.5 Technical Report; SEA-LION |
| 2.2.8 Metrik | Zhang dkk. (2020) BERTScore (ICLR); sitir paper asal BLEU/ROUGE |

> Paper teori di tabel ini **bukan** "penelitian terkait" — jangan masukkan ke
> 2.1. 2.1 = karya sebanding (apa yang orang lain *bangun*); 2.2 = fondasi
> metode (konsep yang kamu *pakai*).

---

## BAB 3 — METODOLOGI

### 3.1 Perancangan Sistem

**Gambar 3.1 — Diagram Alir Sistem (wajib).** Buat flowchart end-to-end:

```
Scraping Alodokter → Pembersihan & Kurasi Data → Pembagian Data (train/val/test)
        │
        ├──► [Jalur Pelatihan] QLoRA fine-tune 3 model → Evaluasi → Pilih model terbaik
        │
        └──► [Jalur RAG] Bangun Index (embedding + BM25) atas korpus jawaban dokter
                          │
   Pertanyaan user ─────► Retrieval hybrid (dense+BM25) → top-k context
                          │
                          └► Prompt (system + context + pertanyaan) → LLM terpilih → Jawaban
                                                                              │
                                                                       Deploy Bot Telegram
```

Pecah juga jadi 2 sub-diagram kalau perlu: (a) alur pelatihan & evaluasi,
(b) alur inferensi RAG. Tiap blok di flowchart harus punya padanan di
implementasi (3.2) — jangan ada blok yatim.

Jelaskan **3 skenario pengujian** di sini supaya pembaca tahu desain eksperimen
sebelum masuk hasil:
- Skenario 1 — perbandingan **base vs fine-tuned (QLoRA)** untuk 3 model.
- Skenario 2 — perbandingan **fine-tuned vs fine-tuned + RAG** pada model terbaik.
- Skenario 3 — (opsional, kalau jadi) variasi RAG: strategi indexing /
  model embedding / pakai reranker.

### 3.2 Implementasi Sistem

Tiap subbab: paragraf penjelasan + **Kode Semu (pseudocode)**, bukan dump kode
asli. Pseudocode = langkah algoritmik tingkat tinggi.

- **3.2.1 Pengumpulan Data (Web Scraping Alodokter)** — sumber, field yang
  diambil (pertanyaan, jawaban dokter, poli, URL), volume mentah.
  *Kode Semu 3.1.*
- **3.2.2 Pembersihan & Kurasi Data** — langkah cleaning (hapus sapaan/identitas
  dokter, normalisasi, filter non-dokter, dedup). Sajikan statistik
  sebelum→sesudah. *Kode Semu 3.2.*
- **3.2.3 Pembagian & Format Data Latih** — split train/val/test, format
  percakapan (system/user/assistant), system prompt persona "Medi".
  *Kode Semu 3.3.*
- **3.2.4 Fine-tuning QLoRA** — konfigurasi: kuantisasi 4-bit NF4, rank/alpha,
  target modules, optimizer, learning rate, epoch, batch/grad-accum,
  presisi (bf16). Sebut lingkungan (Modal, A100-40GB). *Kode Semu 3.4.*
- **3.2.5 Pembangunan Index RAG** — korpus = jawaban dokter; strategi chunking
  (gunakan jawaban penuh bila muat di jendela embedding, chunk hanya bila
  panjang); model embedding; pembentukan BM25; penyimpanan vektor.
  *Kode Semu 3.5.*
- **3.2.6 Retrieval & Penyusunan Prompt** — embed query (model & space sama
  dengan korpus), skor dense + BM25, normalisasi & fusion berbobot, ambil
  top-k, **exclude dokumen jawaban gold** (anti-kebocoran saat evaluasi),
  susun prompt RAG. *Kode Semu 3.6.*
- **3.2.7 Evaluasi** — pipeline penilaian: untuk tiap (model × skenario) hitung
  6 metrik vs jawaban dokter; uji signifikansi Wilcoxon signed-rank
  berpasangan. *Kode Semu 3.7.*
- **3.2.8 Deployment Bot Telegram** — alur long-polling, muat model+adapter,
  panggil pipeline RAG, kirim balasan + disclaimer medis. *Kode Semu 3.8.*

> Yang dicari penguji: **reproducibility**. Semua hyperparameter penting harus
> tertulis (rank, lr, epoch, top-k, bobot dense/BM25, model embedding). Kalau
> angka tidak ada, eksperimen dianggap tidak bisa diulang.

---

## BAB 4 — HASIL DAN PEMBAHASAN

### 4.1 Konfigurasi Lingkungan Penelitian
Tabel spesifikasi: GPU (A100-40GB via Modal), framework (PyTorch, Transformers,
PEFT, bitsandbytes), versi, ukuran dataset final (jumlah train/val/test),
model embedding, jumlah dokumen korpus index.

### 4.2 Hasil Penelitian

**Skenario 1 — Perbandingan 3 Model (base vs fine-tuned).**
Tabel: model × {base, ft} × 6 metrik. Lalu tabel uji signifikansi Wilcoxon
(mean Δ, p-value, tanda signifikansi). Tegaskan temuan: fine-tuning QLoRA
meningkatkan kualitas secara signifikan pada BioMistral & Qwen; SEA-LION sudah
kuat di base sehingga peningkatannya kecil; **SEA-LION jadi model terbaik
keseluruhan** → dipilih untuk tahap RAG.

**Skenario 2 — Efek RAG (ft vs ft+RAG) pada model terbaik.**
Tabel metrik + Wilcoxon. Laporkan apa adanya: setelah perbaikan prompt
(instruksi sintesis), RAG netral (tidak menurunkan signifikan). **Bahas kenapa**
(lihat pembahasan). Jangan dipoles jadi seakan naik signifikan kalau bukan.

**Skenario 3 (jika dijalankan) — Variasi RAG.**
Bandingkan strategi indexing (chunk vs jawaban penuh), model embedding
(e5 vs BGE-M3), dengan/tanpa reranker. Tabel recall@k untuk kualitas retrieval.

**Sertakan contoh kualitatif.** Tabel 1 pertanyaan → output base / ft / ft+RAG /
jawaban dokter. Ini bukti naratif yang kuat dan disukai penguji.

### 4.3 Pembahasan / Analisis (bagian paling bernilai)

Jangan cuma mendeskripsikan angka — **jelaskan kenapa**:
- **Domain-first vs language-first:** kenapa SEA-LION/Qwen (language-first)
  mengungguli BioMistral (domain-first) di tugas berbahasa Indonesia. Hipotesis:
  penguasaan bahasa lebih menentukan daripada pengetahuan domain Inggris untuk
  QA forum Indonesia.
- **Kenapa RAG netral, bukan naik:** (a) kualitas retrieval — context relevan
  secara topik tapi sering salah aspek; (b) naive RAG mendorong penyalinan
  verbatim sehingga butuh instruksi sintesis; (c) metrik overlap n-gram
  terhadap satu referensi kurang sensitif terhadap perbaikan kualitas faktual.
  Ini analisis yang jujur dan justru menambah bobot ilmiah.
- **Keterbatasan metrik:** akui Token-F1/BLEU/ROUGE mengukur kemiripan
  permukaan ke satu jawaban dokter, bukan kebenaran/keamanan klinis. Sebutkan
  ini sebagai batasan, bukan disembunyikan.
- **Analisis kesalahan (error analysis):** kategorikan kegagalan output
  (mis. pengulangan, jawaban terpotong, halusinasi, salah aspek). Tunjukkan kamu
  paham penyebabnya, bukan sekadar lapor skor.

> Yang dicari penguji di BAB 4: bukan tabel terbanyak, tapi **insight**.
> Satu paragraf "kenapa RAG tidak naik" yang tajam lebih bernilai dari 5 tabel.

---

## BAB 5 — KESIMPULAN DAN SARAN

### 5.1 Kesimpulan
Jawab langsung tiap Rumusan Masalah, satu-satu, dengan angka pendukung:
1. Efektivitas QLoRA — naik signifikan (sebut metrik & p-value ringkas).
2. Perbandingan 3 model — model terbaik + alasan (language-first unggul).
3. Kontribusi RAG — temuan netral + syaratnya (prompt sintesis, kualitas
   retrieval menentukan).
Hindari klaim yang tidak didukung data.

### 5.2 Saran
Arahkan ke pengembangan nyata yang muncul dari keterbatasanmu:
- Tingkatkan kualitas retrieval: tambah **reranker** (BGE-reranker), embedding
  konteks panjang (BGE-M3), perluas korpus.
- Evaluasi kebenaran/keamanan klinis (mis. penilaian oleh ahli atau LLM-judge),
  bukan hanya kemiripan permukaan.
- Coba RAFT / fine-tune yang sadar-konteks supaya model lebih baik memanfaatkan
  retrieval.
- Perluas modalitas / sumber data di luar forum Alodokter.

---

## Lampiran yang memperkuat paper
- Contoh data sebelum/sesudah pembersihan.
- Kurva loss pelatihan tiap model.
- Tabel lengkap hyperparameter QLoRA.
- Contoh-contoh retrieval (query → top-k yang terambil) + penilaian relevansinya.
- Tangkapan layar bot Telegram berjalan (untuk 4.3 Hasil Deployment).

## Checklist konsistensi akhir
- [ ] Sisa materi NER/kriminalitas/BIO/stemming sudah dihapus seluruhnya.
- [ ] Rumusan Masalah ↔ Tujuan ↔ Kesimpulan saling menjawab (3 poin sama).
- [ ] Tiap blok flowchart punya Kode Semu padanannya.
- [ ] Semua hyperparameter penting tertulis (reproducible).
- [ ] Klaim hasil = data nyata (RAG netral ditulis jujur).
- [ ] Setiap metrik di 2.2.8 benar-benar muncul di BAB 4.
- [ ] Daftar Isi/Gambar/Tabel/Kode Semu diperbarui sesuai isi baru.
