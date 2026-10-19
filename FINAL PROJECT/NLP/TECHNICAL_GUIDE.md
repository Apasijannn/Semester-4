# Panduan Teknikal — BioMistral-RAG Indonesian Medical QA

> Untuk keperluan sidang dan presentasi. Tiap konsep ada contoh nyata dari data Alodokter kita.
> Target: bisa jawab pertanyaan mendalam tanpa panik.

---

## Daftar Isi

1. [Gambaran Besar (Big Picture)](#1-gambaran-besar)
2. [Glosarium Istilah Teknikal](#2-glosarium-istilah-teknikal)
3. [Model yang Digunakan](#3-model-yang-digunakan)
4. [Pipeline Fine-Tuning / QLoRA](#4-pipeline-fine-tuning--qlora)
5. [Parameter QLoRA — Detail, Contoh, Justifikasi](#5-parameter-qlora--detail-contoh-justifikasi)
6. [Pipeline RAG — Contoh Nyata Step by Step](#6-pipeline-rag--contoh-nyata-step-by-step)
7. [Parameter RAG — Detail dan Justifikasi](#7-parameter-rag--detail-dan-justifikasi)
8. [Metrik Evaluasi — Formula + Perhitungan Nyata](#8-metrik-evaluasi--formula--perhitungan-nyata)
9. [Matriks Eksperimen](#9-matriks-eksperimen)
10. [Peta File / Source Code](#10-peta-file--source-code)
11. [Referensi Paper](#11-referensi-paper)

---

## 1. Gambaran Besar

### Masalah yang Dipecahkan

LLM umum (GPT, Mistral, dll) sering **hallucinate** saat menjawab pertanyaan medis — membuat fakta yang terdengar meyakinkan tapi salah. Di domain medis, ini berbahaya.

Kita punya korpus 58.940 pasang tanya-jawab dokter dari Alodokter. Ini sumber yang lebih terpercaya dari parameter LLM. Pertanyaan: bagaimana membuat LLM *menggunakan* sumber ini, bukan membuat fakta sendiri?

Jawaban: **RAG + Fine-Tuning**.

### Dua Intervensi

```
BioMistral-7B (model medis bahasa Inggris)
         │
         ▼ Fine-Tuning (QLoRA)
BioMistral + LoRA adapter
(sudah "tahu" cara menjawab dalam Bahasa Indonesia dengan gaya dokter Alodokter)
         │
         ▼ RAG saat inference
BioMistral + LoRA + konteks dari 58.940 jawaban dokter
(jawab berdasarkan fakta nyata dari korpus, bukan dari memori LLM)
```

**Fine-tuning** mengajari model *cara* menjawab (gaya, format, bahasa).
**RAG** memberi model *bahan* yang perlu dijawab (fakta konkret dari korpus).

### Hipotesis Utama

> Fine-tuned BioMistral + RAG > Fine-tuned BioMistral tanpa RAG

Pembuktian hipotesis ini adalah inti eksperimen. Semua komponen lain mendukung ini.

### Arsitektur Empat Lapis

```
┌──────────────────────────────────────────┐
│  LAYER 1: DATA LAYER                     │
│  58.940 pasang (Keluhan, Jawaban_Dokter) │
│  Cleaning 8 tahap → corpus + train data  │
└─────────────────────┬────────────────────┘
                      │
┌─────────────────────▼────────────────────┐
│  LAYER 2: TRAINING LAYER                 │
│  QLoRA fine-tune BioMistral & SEA-LION  │
│  Di Kaggle (T4) dan Modal (A100)         │
└─────────────────────┬────────────────────┘
                      │
┌─────────────────────▼────────────────────┐
│  LAYER 3: RETRIEVAL LAYER                │
│  E5 dense + BM25 → hybrid index         │
│  97.035 chunks dari 58.940 dokumen       │
└─────────────────────┬────────────────────┘
                      │
┌─────────────────────▼────────────────────┐
│  LAYER 4: GENERATION LAYER               │
│  Retrieve top-4 → pack prompt → generate │
│  Scope guard + disclaimer medis          │
└──────────────────────────────────────────┘
```

---

## 2. Glosarium Istilah Teknikal

### Fondasi LLM

**Token**
Unit terkecil yang diproses LLM. Bukan selalu satu kata.

```
"pembengkakan lutut" → ["pem", "beng", "kak", "an", "▁lu", "tut"] ≈ 6 token
"sakit kepala"       → ["sakit", "▁kepala"]                        ≈ 2 token
```

1 token ≈ 0.75 kata Inggris. Bahasa Indonesia lebih "mahal" token karena morfologi kaya (awalan/akhiran).

**Context window**
Berapa token yang bisa "dilihat" model sekaligus. BioMistral = 4096 token.

Analogi: otak manusia punya "working memory" terbatas. Saat baca buku tebal, kamu hanya ingat bab terakhir dengan detail. LLM sama — yang di luar context window "tidak ada".

**Parameter model**
"Bobot" neural network. BioMistral punya 7 miliar parameter. Saat training, bobot ini diupdate supaya model bisa prediksi token berikutnya dengan lebih tepat.

**Logit → Probabilitas**
Model output angka mentah per token (logit). Logit diubah ke probabilitas dengan softmax:

```
P(token_i) = exp(logit_i) / Σ exp(logit_j)  untuk semua j
```

Contoh: logit "sakit"=3.2, "nyeri"=2.8, "demam"=1.1 → setelah softmax: P("sakit")≈0.45, P("nyeri")≈0.30, P("demam")≈0.08.

---

### Quantization

**FP32 / FP16 / BF16**
Format angka untuk menyimpan bobot model.

| Format | Bit | Ukuran BioMistral | Keterangan |
|--------|-----|-------------------|------------|
| FP32 | 32 | ~28 GB | Paling akurat, tidak muat di 1 GPU konsumer |
| FP16 | 16 | ~14 GB | Standard inference, rawan overflow untuk nilai besar |
| BF16 | 16 | ~14 GB | Range lebih lebar dari FP16, lebih stabil untuk training |
| INT8 | 8 | ~7 GB | Quantized, akurasi turun sedikit |
| **NF4** | **4** | **~4.5 GB** | **Yang kita pakai untuk training** |

**Mengapa BF16 untuk compute tapi NF4 untuk storage?**
Model disimpan dalam NF4 (hemat VRAM), tapi saat menghitung (matrix multiply), bobot di-dequantize ke BF16 dulu supaya hasilnya akurat. Ini terjadi otomatis di tiap forward pass.

**NF4 (NormalFloat4)**
4-bit quantization yang dirancang khusus untuk distribusi bobot LLM. Bobot LLM mengikuti distribusi *normal* (bell curve). NF4 menempatkan 16 "bucket" nilai yang jarak antar-bucketnya tidak sama rata — lebih rapat di tengah (nilai yang paling sering muncul), lebih renggang di ujung.

```
INT4 biasa:    |---|---|---|---|---|---|---|---|   (jarak sama rata)
NF4:           |-|-|-|---|---|----|----|-------|  (rapat di tengah)
```

Karena bobot LLM kebanyakan bernilai kecil (dekat 0), NF4 lebih akurat untuk representasinya.

---

### LoRA dan Fine-Tuning

**Full fine-tuning**
Update semua 7 miliar parameter. Butuh VRAM sebesar: ukuran model + optimizer state (2× model) + gradient (1× model) + activations ≈ **80-100 GB**. Perlu 4-8 A100 80GB. Tidak feasible untuk proyek mandiri.

**LoRA (Low-Rank Adaptation)**
Daripada update W (matrix besar), tambah matriks kecil di sampingnya:

```
Output_baru = W_frozen × x + (α/r) × B × A × x
                 ↑ tidak diubah    ↑ ini yang dilatih
```

Di mana:
- `W` = bobot asli, dibekukan (tidak berubah)
- `A` = matriks kecil (d × r), diinisialisasi random
- `B` = matriks kecil (r × d), diinisialisasi nol (jadi awalnya output LoRA = 0)
- `α/r` = scaling factor

Contoh nyata untuk satu attention layer di Mistral:
```
W_q_proj: dimensi 4096 × 4096 = 16.777.216 parameter
A: 4096 × 16 = 65.536 parameter
B: 16 × 4096 = 65.536 parameter
Total LoRA untuk W_q: 131.072 ← hanya 0.78% dari W asli
```

**QLoRA**
LoRA + model di-quantize ke 4-bit. Trainable parameter tetap sama dengan LoRA biasa (hanya A dan B), tapi base model hanya pakai 4.5GB VRAM.

Total trainable parameters di proyek kita:
- 7 layer linear per transformer block × 32 blocks = 224 layer
- Tiap layer rata-rata: 2 × 4096 × 16 = 131.072 param
- Total: 224 × 131.072 ≈ **29 juta parameter** dari 7 miliar (0.4%)

**SFT (Supervised Fine-Tuning)**
Training dengan pasangan (input, output) berlabel. Loss dihitung hanya pada output (jawaban dokter) — model dihukum kalau salah prediksi token di bagian `assistant`, bukan di bagian `user` atau `system`.

---

### RAG

**Embedding**
Teks → vektor angka. Teks dengan makna mirip → vektor yang arahnya mirip.

```
"sakit kepala"    → [0.23, -0.41, 0.18, ..., 0.09]  (1024 angka)
"nyeri kepala"    → [0.21, -0.39, 0.20, ..., 0.11]  (mirip!)
"obat antibiotik" → [-0.12, 0.33, -0.44, ..., 0.67] (jauh)
```

**Cosine similarity**

```
cos(A, B) = (A · B) / (|A| × |B|)
```

Range: -1 (berlawanan) sampai 1 (identik). Di retrieval, biasanya 0.6-0.95 untuk teks relevan.

Contoh nyata dari proyek kita: query "sakit kepala sebelah" vs jawaban dokter tentang migren → cosine ≈ 0.82.

**Chunk**
Potongan kecil teks dari dokumen panjang, supaya bisa di-embed dan diambil secara spesifik. Satu jawaban dokter panjang bisa jadi 2-3 chunk.

**Hybrid retrieval**
Gabungan dense (embedding) + sparse (BM25). Dense paham makna, BM25 paham kata kunci exact. Gabungan mengatasi kelemahan masing-masing.

---

## 3. Model yang Digunakan

### 3.1 BioMistral-7B-DARE

**Model ID:** `BioMistral/BioMistral-7B-DARE`

**Asal-usul:**
Mistral-7B (model general purpose Prancis) → fine-tune di PubMed Central (14 juta artikel biomedis) → BioMistral-7B.

"DARE" = **D**rop **A**nd **R**escale with random **E**rror. Teknik model merging: ambil beberapa checkpoint training, drop sebagian bobot secara acak, rata-rata sisanya. Hasilnya model yang lebih stabil dan kurang overfit ke data training tertentu.

**Arsitektur Mistral:**

```
Input tokens
    │
    ▼
Embedding layer (vocab_size × 4096)
    │
    ▼  × 32 blok transformer
┌─────────────────────────────────────────┐
│  RMSNorm                                │
│      │                                  │
│      ▼                                  │
│  Self-Attention (Grouped Query):        │
│    Q_proj (4096 → 4096)  ← LoRA ada di sini │
│    K_proj (4096 → 1024)  ← LoRA ada di sini │
│    V_proj (4096 → 1024)  ← LoRA ada di sini │
│    O_proj (4096 → 4096)  ← LoRA ada di sini │
│  + Sliding Window (4096 token window)   │
│      │                                  │
│      ▼                                  │
│  RMSNorm                                │
│      │                                  │
│      ▼                                  │
│  Feed-Forward Network (SwiGLU):         │
│    gate_proj (4096 → 14336) ← LoRA     │
│    up_proj   (4096 → 14336) ← LoRA     │
│    down_proj (14336 → 4096) ← LoRA     │
└─────────────────────────────────────────┘
    │
    ▼
LM head (4096 → vocab_size) → logits → token
```

**Grouped Query Attention (GQA):**
Biasanya setiap head Q punya K dan V sendiri. GQA: banyak head Q berbagi 1 K dan 1 V. Mistral: 32 Q heads tapi hanya 8 K/V heads. Hemat VRAM ~30%, sedikit lebih cepat.

**Kenapa dipilih?**
Labrak et al. (2024) melaporkan BioMistral mengungguli LLaMA-2-7B, Meditron-7B, dan MedAlpaca di benchmark MedQA (59.4% avg setelah SFT vs 58.3% LLaMA-2-7B). Satu-satunya model 7B yang dilatih khusus untuk biomedis dan open-source.

**Keterbatasan:** Pre-training bahasa Inggris → memori medisnya dalam Inggris. Fine-tuning kita mengajari cara output dalam Bahasa Indonesia, tapi "pengetahuan medis bawaan" tetap berbasis Inggris.

---

### 3.2 SEA-LION v3 9B (Gemma-SEA-LION-v3-9B-IT)

**Model ID:** `aisingapore/Gemma-SEA-LION-v3-9B-IT`

**Asal-usul:**
Gemma-9B (Google) → continue pre-training pada ~500GB teks Asia Tenggara (Indonesia, Melayu, Thai, Filipino, Vietnamese, Burmese, dll) + instruction tuning (IT = Instruction Tuned).

**Kenapa relevan?**
BioMistral kuat di medis, lemah di Indonesian. SEA-LION sebaliknya. Dengan fine-tuning pada data medis kita, hipotesisnya: SEA-LION bisa belajar medis sambil tetap fasih Indonesian.

**Perbedaan Gemma vs Mistral:**

| Fitur | Mistral-7B | Gemma-9B |
|-------|-----------|----------|
| Attention | GQA (32Q/8KV) | MHA standard (8Q/8KV) |
| FFN | SwiGLU | GeGLU |
| Context | 32k (sliding) | 8192 |
| Parameter | 7B | 9B |

**Training kita:** Dilatih di Modal Labs dengan A100-40GB. Batch 4 per GPU, accumulation 8, effective batch 32. File: `scripts/modal_train.py`.

---

### 3.3 Qwen2.5-7B-Instruct

**Model ID:** `Qwen/Qwen2.5-7B-Instruct`

**Asal-usul:**
Dikembangkan Alibaba (Qwen Team). Qwen2.5 di-pre-training pada ~18 triliun token data multibahasa (29+ bahasa, termasuk Bahasa Indonesia), lalu di-instruction tune ("Instruct"). Berbeda dari BioMistral (fokus domain medis Inggris) dan SEA-LION (fokus kawasan Asia Tenggara), Qwen2.5 adalah model **multilingual general purpose** dengan cakupan bahasa luas.

**Kenapa relevan?**
Qwen2.5 mewakili pendekatan **language-first** versi global: kuat di banyak bahasa sekaligus, termasuk Indonesia, tanpa spesialisasi domain medis. Membandingkannya dengan BioMistral (domain-first) dan SEA-LION (regional) menjawab pertanyaan inti penelitian — antara modal domain medis, modal bahasa global, dan modal bahasa regional, mana yang paling menentukan untuk QA medis Bahasa Indonesia?

**Perbedaan Qwen2.5 vs Mistral vs Gemma:**

| Fitur | Mistral-7B | Gemma-9B | Qwen2.5-7B |
|-------|-----------|----------|------------|
| Attention | GQA (32Q/8KV) | MHA (8Q/8KV) | GQA (28Q/4KV) + QKV bias |
| FFN | SwiGLU | GeGLU | SwiGLU |
| Positional | RoPE | RoPE | RoPE |
| Norm | RMSNorm | RMSNorm | RMSNorm |
| Context | 32k (sliding) | 8192 | 32k (native, sampai 128k via YaRN) |
| Parameter | 7B | 9B | 7B |

Qwen2.5 mirip Mistral secara arsitektur (GQA + SwiGLU + RoPE), bedanya pakai **QKV bias** di layer attention dan rasio GQA lebih agresif (28 head Q berbagi 4 head KV), serta context window native yang lebih panjang.

**Training kita:** Dilatih dengan QLoRA, hyperparameter sama persis dengan model lain (r=16, alpha=32, lr 2e-4, 1 epoch, 15.000 samples). Tersedia dua konfigurasi: Kaggle T4 (batch 1, accumulation 16, effective batch 16 — `scripts/kaggle_qwen.ipynb`, `configs/qwen.yaml`) dan Modal A100-40GB (batch 4, accumulation 8, effective batch 32 — `modal_train/modal_qwen.py`).

**Keterbatasan:** Sebagai model general purpose, Qwen2.5 tidak punya pengetahuan medis terspesialisasi seperti BioMistral. Penguasaan bahasanya luas tapi tidak sedalam SEA-LION untuk nuansa lokal Indonesia. Dalam eksperimen, Qwen2.5 kompetitif dengan SEA-LION (unggul di F1 dan BERTScore) tetapi kalah tipis secara keseluruhan, dan penambahan RAG justru menurunkan performanya secara signifikan.

---

### 3.4 multilingual-e5-large-instruct

**Model ID:** `intfloat/multilingual-e5-large-instruct`

**Apa ini?**
BERT-like encoder (bukan decoder seperti GPT) yang dilatih untuk semantic similarity. "E5" = Embeddings from bidirectional Encoder Representations.

**Cara kerja:**
```
Input: "Diberikan pertanyaan medis dari pasien, temukan jawaban dokter yang relevan
        Query: apa penyebab sakit kepala sebelah kanan?"
    │
    ▼
Tokenize → beberapa token
    │
    ▼
12 transformer layers (encoder, bukan decoder)
Setiap token "attend" ke semua token lain (bukan hanya sebelumnya)
    │
    ▼
Ambil representasi token [CLS] → vektor 1024-dim
    │
    ▼
[0.23, -0.41, 0.18, ..., 0.09]  ← ini embedding query-mu
```

**Asymmetric retrieval:**
Query dikasih instruksi, dokumen tidak:
```python
# query pakai prefix instruksi
query = "Instruct: Diberikan pertanyaan medis...\nQuery: sakit kepala sebelah"

# dokumen di-embed plain
doc = "Nyeri kepala sebelah (migren) biasanya disebabkan oleh..."
```

Ini disengaja — E5-instruct dilatih persis dengan cara ini. Kalau dokumen juga dikasih instruksi, performa turun.

**Kenapa e5-large bukan e5-base?**
e5-base: dimensi 768, parameter ~180M. e5-large: dimensi 1024, parameter ~560M. Lebih besar = lebih akurat untuk nuansa bahasa medis. Di SEA-BED benchmark (benchmark retrieval khusus Southeast Asia), e5-large-instruct ranking pertama untuk Indonesian.

**Hasil ablasi kita:**
```
E5 (tanpa instruksi):    recall@3 = 0.443
E5 (dengan instruksi):   recall@3 = 0.527  (+18.9%)
```
Instruksi prefix sendiri sudah angkat recall hampir 19%.

---

### 3.5 BGE-M3

**Model ID:** `BAAI/bge-m3`

**Keunggulan utama vs E5:**

Max input token: **8192** (vs E5's 512).

Artinya: jawaban dokter yang panjang (misal 800 token penjelasan tentang diabetes) bisa di-embed utuh oleh BGE-M3. E5 harus potong jadi 2-3 chunk → ada risiko penjelasan kritis ada di boundary chunk.

**BGE-M3 juga support tiga mode retrieval:**
- Dense (sama seperti E5, vektor cosine)
- Sparse (seperti BM25 tapi learned, bukan heuristic)
- ColBERT (perbandingan token-level, bukan vektor tunggal)

Di proyek kita, kita hanya pakai mode dense dari BGE-M3 (paling straightforward untuk hybrid dengan BM25).

**Config kita (`rag_bgem3.yaml`):**
```yaml
chunk_size_tokens: 400   # lebih besar karena M3 bisa handle
max_embed_tokens: 4096   # effectively no chunking untuk jawaban Alodokter
batch_size: 32           # lebih kecil karena model lebih besar
```

**Status:** Config alternatif, belum jadi default. E5 tetap default karena sudah divalidasi.

---

### 3.6 BM25 (Okapi BM25)

**Bukan neural network.** Algoritma probabilistik, 1994.

**Formula:**

```
Score(D, Q) = Σ IDF(qi) × [tf(qi,D) × (k1+1)] / [tf(qi,D) + k1×(1 - b + b×|D|/avgdl)]
```

Artinya dalam bahasa manusia:
- `tf(qi,D)` = berapa kali kata query `qi` muncul di dokumen D
- `IDF(qi)` = seberapa langka kata itu di seluruh korpus (langka = lebih penting)
- `k1 = 1.5` = saturasi. Kata yang muncul 10× tidak mendapat reward 10× dari yang muncul 1×, ada cap.
- `b = 0.75` = normalisasi panjang dokumen. Dokumen panjang secara alami punya tf tinggi, ini dikompensasi.
- `avgdl` = rata-rata panjang dokumen di korpus

**Contoh konkret:**

Query: "obat amoxicillin"

```
Dokumen A: "...amoxicillin adalah antibiotik..." (tf=1, panjang normal)
Dokumen B: "...amoxicillin amoxicillin amoxicillin..." (tf=3, tapi BM25 saturasi)
Dokumen C: "...resep dokter perlu amoxicillin..." (tf=1, panjang pendek → normalized score lebih tinggi)
```

Dokumen B tidak dapat 3× skor Dokumen A karena k1 menyebabkan saturasi. Ini realistis — pengulangan kata tidak berarti dokumen lebih relevan.

**Mengapa BM25 penting di hybrid retrieval kita?**

Pasien mengetik nama obat spesifik: "amlodipin", "metformin", "cefadroxil". E5 mungkin embed ini ke vektor "obat jantung/diabetes/antibiotik" yang terlalu general. BM25 exact-match kata tersebut → menemukan dokumen yang persis membahas obat itu.

**Mengapa BM25 tidak cukup sendiri?**

Pasien sering bicara informal: "dok perut saya sering melilit dan mules kalau mau haid" vs jawaban dokter "dismenore primer ditandai dengan kram abdomen pada fase menstruasi". BM25 tidak menemukan match karena tidak ada kata yang sama. E5 menemukan karena paham makna semantik. Ini kenapa recall BM25-only = 0.21 di data kita.

---

## 4. Pipeline Fine-Tuning / QLoRA

### Format Data Training

Setiap sample dari dataset Alodokter dikemas ke format chat messages:

```json
{
  "messages": [
    {
      "role": "system",
      "content": "Anda adalah Medi, asisten informasi kesehatan dari platform Alodokter..."
    },
    {
      "role": "user",
      "content": "Dok, perut saya sering kembung dan mual setiap pagi, kira-kira kenapa ya?"
    },
    {
      "role": "assistant",
      "content": "Keluhan kembung dan mual di pagi hari dapat disebabkan beberapa kondisi..."
    }
  ]
}
```

**Render ke Mistral chat template:**
Mistral tidak punya token `<system>`. Saat training dan inference, system + user digabung:

```
<s>[INST] Anda adalah Medi, asisten informasi kesehatan dari platform Alodokter...

Dok, perut saya sering kembung dan mual setiap pagi, kira-kira kenapa ya? [/INST]
Keluhan kembung dan mual di pagi hari dapat disebabkan beberapa kondisi...</s>
```

Loss hanya dihitung pada bagian **setelah** `[/INST]` sampai `</s>`. Model belajar memprediksi jawaban dokter, bukan pertanyaan pasien.

### Alur Training Lengkap

```
1. Load BioMistral dalam 4-bit NF4 (4.5 GB VRAM)
2. Attach LoRA adapter ke semua linear layers
3. Load dataset 15.000 samples, shuffle, split 98/2
4. Loop training:
   ├── batch_size=1 sample di T4
   ├── Tokenize + padding ke max_length=1536
   ├── Forward pass: hitung logit tiap token
   ├── Cross-entropy loss pada token jawaban
   ├── Backward: hitung gradient (hanya LoRA A dan B)
   ├── Akumulasi gradient × 16 steps
   └── Optimizer step (paged_adamw_8bit update LoRA weights)
5. Simpan adapter ke disk
```

### Kenapa 15.000 dari 58.940?

Trade-off compute vs kualitas. Kaggle T4 16GB:
- 1 epoch × 15.000 samples × max_length 1536 ≈ 18-24 jam training
- Budget Kaggle: 30 jam/minggu
- Lebih dari 15k = tidak muat dalam satu sesi, perlu checkpoint resume

Kalau VRAM dan waktu tidak jadi masalah, idealnya pakai seluruh 58.940 samples dan 2-3 epoch.

---

## 5. Parameter QLoRA — Detail, Contoh, Justifikasi

### 5.1 BitsAndBytesConfig

```python
BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
    bnb_4bit_compute_dtype=torch.bfloat16,
)
```

**`load_in_4bit=True`**

Tanpa ini: model load FP16 = 14 GB. T4 punya 16GB → hanya sisa 2GB untuk training. Pasti OOM.
Dengan ini: model load NF4 = 4.5 GB → sisa 11.5GB untuk LoRA, activations, optimizer state.

**`bnb_4bit_quant_type="nf4"`**

Kenapa bukan `"fp4"`?

QLoRA paper (Dettmers et al. 2023, Table 2):
```
NF4:  perplexity 4.654 (lebih rendah = lebih akurat)
FP4:  perplexity 4.712
```

NF4 lebih akurat 1.25% relatif. Untuk model medis di mana satu kata bisa kritis, beda ini penting.

**`bnb_4bit_use_double_quant=True`**

Quantization butuh konstanta per-blok (scale dan zero point). Konstanta ini disimpan dalam FP32 (default). Double quant: konstanta ini juga di-quantize ke 8-bit.

Penghematan: 0.37 bits/parameter. Untuk BioMistral 7B:
```
0.37 bit × 7.000.000.000 parameter / 8 bit per byte ≈ 324 MB
```
Gratis hemat 324MB tanpa degradasi signifikan.

**`bnb_4bit_compute_dtype=torch.bfloat16`**

Proses komputasi (matrix multiply) dilakukan dalam BF16, bukan NF4. Alur:
```
Bobot NF4 (storage) → dequantize ke BF16 (compute) → hasil BF16
```

Mengapa BF16, bukan FP16?

FP16: 5 bit exponent, 10 bit mantissa. Range: ≈6.5×10⁻⁵ sampai 65504.
BF16: 8 bit exponent, 7 bit mantissa. Range: ≈1.2×10⁻³⁸ sampai 3.4×10³⁸.

BF16 punya range jauh lebih lebar. Saat gradient backward pass, nilai gradient bisa sangat besar di early training. FP16 overflow → nilai jadi `inf` atau `nan` → training crash. BF16 tidak overflow. Tradeoffnya: presisi mantissa lebih rendah, tapi untuk LLM training ini tidak masalah.

---

### 5.2 LoRA Config

```python
LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
    target_modules="all-linear",
)
```

#### `r` (rank) = 16

LoRA mengganti update matriks W dengan dua matriks kecil:

```
W ∈ ℝ^(d_out × d_in)  →  A ∈ ℝ^(r × d_in) dan B ∈ ℝ^(d_out × r)
```

Untuk `q_proj` di Mistral (d_in=4096, d_out=4096):

| r | Ukuran A | Ukuran B | Total params | % dari W |
|---|----------|----------|--------------|----------|
| 4 | 4096×4 | 4×4096 | 32.768 | 0.195% |
| 8 | 4096×8 | 8×4096 | 65.536 | 0.390% |
| **16** | **4096×16** | **16×4096** | **131.072** | **0.781%** |
| 32 | 4096×32 | 32×4096 | 262.144 | 1.563% |
| 64 | 4096×64 | 64×4096 | 524.288 | 3.125% |

**Justifikasi r=16:**

Dettmers et al. (2023): "We find that rank 16 consistently matches or outperforms larger ranks on most instruction-following benchmarks. Rank 64 shows diminishing returns with 4× the parameters."

Hu et al. (2022, LoRA paper): Eksperimen di GPT-3 175B menunjukkan r=4 sudah cukup untuk task sederhana, tapi r=8–16 lebih stabil untuk domain adaptation.

Untuk domain adaptation ke Indonesian + medis (dua perubahan sekaligus), r=16 lebih aman dari r=8.

**Kalau r=8 (turun):**
Training lebih cepat ~15%. Tapi model mungkin kurang mampu menyimpan kosakata medis Indonesia yang belum ada di training BioMistral (nama obat lokal, istilah Alodokter).

**Kalau r=32 (naik):**
Training lebih lambat ~2×. Kapasitas lebih, tapi dengan 15k samples berisiko overfit. Perlu tambah `lora_dropout` ke 0.1 kalau naik r.

---

#### `lora_alpha` = 32

Scaling factor untuk output LoRA:

```
Output_final = W_frozen × x + (lora_alpha/r) × B × A × x
                                    ↑
                               scaling = 32/16 = 2.0
```

Artinya: update LoRA diberi "berat" 2× relatif terhadap representasi internal model.

**Kenapa alpha = 2×r adalah konvensi?**
Saat inisialisasi, A random dan B nol → output LoRA = 0. Saat training dimulai, B mulai belajar dan output LoRA bertumbuh dari nol. Scaling 2× berarti saat LoRA "matang", kontribusinya setara dengan bobot frozen yang telah distabilkan oleh pre-training.

Jika alpha/r terlalu kecil (<1): LoRA belajar perlahan, model susah berubah dari perilaku BioMistral asli. Berguna jika mau fine-tune minimal (tetap "mirip" model base).

Jika alpha/r terlalu besar (>4): LoRA bisa "overwrite" terlalu agresif → model kehilangan kemampuan general dari pre-training. Di medical domain, ini berbahaya — kita butuh pengetahuan medis bahasa Inggris yang sudah ada di BioMistral.

---

#### `lora_dropout` = 0.05

Saat training, 5% unit LoRA di-"matikan" secara acak per forward pass.

```
Tanpa dropout:  B × A × x  (semua unit aktif)
Dengan dropout: B × mask × A × x  (mask = 0 di 5% posisi random)
```

**Efek regularisasi:** Model tidak bisa bergantung pada koneksi spesifik → lebih general.

Dengan 15.000 samples (dataset kecil di standar LLM), ada risiko model "hafal" training set. Dropout 0.05 mencegah itu.

**Contoh apa yang terjadi tanpa dropout:**
Model mungkin belajar "jika kalimat dimulai dengan nama dr tertentu, output X". Ini overfitting ke pattern spesifik data Alodokter, bukan belajar cara menjawab medis.

**Kalau dropout=0.1 (naik):** Lebih regularized, training lebih lambat konvergen, perlu lebih banyak steps. Cocok jika dataset sangat kecil (<5k).

**Kalau dropout=0.0 (turun):** Model cepat konvergen tapi berisiko overfit. Untuk 15k samples, sebaiknya tetap 0.05+.

---

#### `target_modules` = "all-linear"

Pasang LoRA di semua layer linear dalam model. Untuk Mistral, per transformer block:

| Layer | Dimensi | Fungsi |
|-------|---------|--------|
| `q_proj` | 4096→4096 | Project input ke query space |
| `k_proj` | 4096→1024 | Project input ke key space (GQA: lebih kecil) |
| `v_proj` | 4096→1024 | Project input ke value space (GQA: lebih kecil) |
| `o_proj` | 4096→4096 | Project attention output kembali ke model dim |
| `gate_proj` | 4096→14336 | Gate di SwiGLU FFN |
| `up_proj` | 4096→14336 | Up projection di SwiGLU FFN |
| `down_proj` | 14336→4096 | Down projection, kembali ke model dim |

**Kenapa semua linear, bukan hanya q dan v?**

LoRA paper asli (Hu et al. 2022) hanya target q_proj dan v_proj di attention. Ini cukup untuk bahasa Inggris ke Inggris.

Untuk **domain adaptation** (Inggris medis → Indonesia medis), perlu update FFN juga. Di FFN (`gate_proj`, `up_proj`, `down_proj`) tersimpan "pengetahuan faktual" model — asosiasi kata dengan konsep. Update FFN membantu model belajar:
- Istilah medis Indonesia ("sakit kepala sebelah" = migren)
- Format jawaban ala Alodokter (paragraf berstruktur, disclaimer)
- Gaya bahasa dokter Indonesia (formal tapi mudah dipahami)

**Kalau hanya target attention (q,k,v,o):**
Training lebih cepat dan hemat. Tapi model mungkin cukup belajar format dan gaya bahasa (dari attention), tapi kurang update pengetahuan faktualnya.

---

### 5.3 SFTConfig — Training Parameters

```python
SFTConfig(
    max_length=1536,
    num_train_epochs=1,
    per_device_train_batch_size=1,    # T4
    gradient_accumulation_steps=16,   # T4 → effective batch 16
    learning_rate=2e-4,
    lr_scheduler_type="cosine",
    warmup_ratio=0.03,
    optim="paged_adamw_8bit",
    bf16=True,
)
```

#### `max_length` = 1536

**Kenapa bukan 4096 (max BioMistral)?**

Memory per sample saat training ∝ sequence_length². Activations untuk attention scale quadratically.

```
1536 token → memory M
4096 token → memory ≈ (4096/1536)² × M ≈ 7.1 × M
```

Di T4 16GB dengan QLoRA 4-bit: 1536 muat, 4096 OOM.

**Coverage data kita:** EDA pada dataset Alodokter:
```
Median panjang jawaban dokter:  ~250 token
P90 panjang:                    ~600 token
P99 panjang:                    ~1100 token
```

1536 token cukup untuk system prompt (100) + pertanyaan (150) + jawaban (1000+) + padding. Hanya <1% sample yang terpotong.

---

#### `num_train_epochs` = 1

**1 epoch = 15.000 training steps (dengan eff. batch 1).**

LLM sudah dilatih pada miliaran token → sudah "pintar". Fine-tuning tujuannya menggeser distribusi output, bukan mengajari dari nol. 1-3 epoch sudah cukup.

**Tanda overfitting kalau epoch terlalu banyak:**
```
Epoch 1: train_loss=1.2, val_loss=1.3  ← normal, val sedikit lebih tinggi
Epoch 2: train_loss=0.8, val_loss=1.4  ← mulai diverge
Epoch 3: train_loss=0.5, val_loss=1.8  ← overfit: model hafal training set
```

Dengan 15k samples, risiko ini nyata. Alpaca-7B dilatih 3 epoch dengan 52k samples (rasio lebih besar). Kita lebih konservatif dengan 1 epoch.

---

#### Batch size dan Gradient Accumulation

**T4 (Kaggle):**
```
per_device_train_batch_size = 1
gradient_accumulation_steps = 16
effective_batch_size = 1 × 16 = 16
```

**A100 (Modal):**
```
per_device_train_batch_size = 4
gradient_accumulation_steps = 8
effective_batch_size = 4 × 8 = 32
```

**Gradient accumulation bekerja seperti ini:**
```python
for step, batch in enumerate(dataloader):
    loss = model(batch) / accumulation_steps  # normalize
    loss.backward()                            # akumulasi gradient

    if (step + 1) % accumulation_steps == 0:
        optimizer.step()   # update bobot sekali
        optimizer.zero_grad()
```

Secara matematis ekuivalen dengan batch besar, karena gradient bersifat linear (∂L/∂W = Σ ∂L_i/∂W untuk semua sample i di batch).

**Kenapa effective batch 16–32?**

McCandlish et al. (2018) "An Empirical Model of Large-Batch Training": ada "critical batch size" di mana training efisien. Terlalu kecil = gradient noisy. Terlalu besar = perlu LR sangat tinggi untuk converge, gradient lebih reliable tapi update per sampel lebih sedikit. Untuk LLM fine-tuning, 8–64 adalah sweet spot yang umum dipakai.

---

#### `learning_rate` = 2e-4

**Learning rate = ukuran langkah gradient descent.**

```
θ_new = θ_old - lr × ∇L(θ)
```

| Nilai | Efek | Tanda Masalah |
|-------|------|---------------|
| 1e-5 | Sangat lambat, terlalu aman | Train loss turun sangat pelan |
| 5e-5 | Standar full fine-tuning | — |
| 1e-4 | Standar LoRA | — |
| **2e-4** | **Agresif, tapi aman dengan QLoRA** | — |
| 5e-4 | Berisiko untuk fine-tuning | Loss oscillate di awal |
| 1e-3 | Biasanya diverge | Loss spike atau jadi NaN |

**Kenapa 2e-4 aman untuk QLoRA tapi tidak untuk full fine-tuning?**

QLoRA paper: noise dari quantization (4-bit ke BF16 dan kembali) bertindak sebagai implicit regularization — mirip efek dropout. Noise ini menstabilkan training meskipun LR tinggi.

Full fine-tuning tidak punya noise ini → perlu LR lebih rendah (5e-5) untuk tetap stabil.

---

#### `lr_scheduler_type` = "cosine"

LR tidak konstan — mulai dari nilai target, lalu turun sepanjang training.

```
LR
2e-4 ┤    ╭─────╮
     │   ╱       ╲
     │  ╱   warmup ╲
     │ ╱     28 step ╲                   cosine decay
1e-5 ┤╱               ╲─────────────────────────────────────╯
     ├──────────────────────────────────────────────────────
     step: 0                                           ~938
```

**Formula cosine decay:**
```
LR(step) = LR_min + 0.5 × (LR_max - LR_min) × (1 + cos(π × progress))
progress = (step - warmup_steps) / (total_steps - warmup_steps)
```

Kenapa cosine lebih baik dari linear decay?

Linear: LR turun seragam. Di akhir training, model sudah convergence dan LR turun terlalu cepat.
Cosine: LR turun lambat di akhir (karena cos(π) = -1 → derivatif kecil). Model punya waktu "settle" ke minimum yang stabil.

---

#### `warmup_ratio` = 0.03

3% pertama dari total steps, LR naik linear dari 0 ke target.

Untuk 15k samples, 1 epoch, effective batch 16:
```
Total steps = 15.000 / 16 = 937 steps
Warmup steps = 937 × 0.03 ≈ 28 steps pertama
```

**Kenapa perlu warmup?**

Awal training: bobot LoRA A random, B nol. Gradient pada step pertama sangat besar dan arahnya belum reliable. Tanpa warmup: langsung update dengan LR 2e-4 → update besar di arah yang salah → training terguncang atau crash.

Dengan warmup: 28 steps pertama LR sangat kecil → update kecil → gradient "orientasi" dulu sebelum langkah besar.

---

#### `optim` = "paged_adamw_8bit"

**AdamW optimizer** menyimpan dua "momentum" per parameter:

```
m_t = β1 × m_{t-1} + (1 - β1) × g_t        # momentum pertama (moving avg gradient)
v_t = β2 × v_{t-1} + (1 - β2) × g_t²        # momentum kedua (moving avg gradient²)
θ_t = θ_{t-1} - lr × m_t / (√v_t + ε) - lr × λ × θ_{t-1}  # update + weight decay
```

State (m dan v) harus disimpan untuk setiap parameter. Untuk LoRA 29M params:
```
FP32 state: 29M × 2 states × 4 bytes = 232 MB
BF16 state: 29M × 2 states × 2 bytes = 116 MB
8-bit state: 29M × 2 states × 1 byte = 58 MB   ← yang kita pakai
```

Hemat tapi tetap akurat karena update parameter (bukan state) tetap dilakukan dalam BF16.

**"Paged"**: state optimizer dipindah ke RAM saat tidak dipakai, diambil kembali saat dibutuhkan. Ini seperti virtual memory — mencegah OOM kalau VRAM penuh sesaat.

---

### 5.4 Ringkasan: Efek Perubahan Parameter

| Parameter | Naik | Turun | Risk zone |
|-----------|------|-------|-----------|
| `r` | Lebih ekspresif, lambat | Cepat, kurang kapasitas | r>32 dengan dataset kecil → overfit |
| `lora_alpha` | LoRA lebih dominan | LoRA underpowered | alpha/r > 4 → instabil |
| `lora_dropout` | Lebih regularized, lambat | Cepat, overfit risk | >0.2 → underfitting |
| `learning_rate` | Cepat belajar, diverge risk | Lambat, aman | >3e-4 dengan QLoRA mulai riskan |
| `effective_batch` | Gradient stabil | Gradient noisy | <4 → training tidak stabil |
| `num_epochs` | Belajar lebih, overfit risk | Belajar kurang | >3 epoch di 15k samples → bahaya |
| `max_length` | Konteks lebih, VRAM lebih | Truncation | Sesuaikan dengan GPU VRAM |
| `warmup_ratio` | LR lama naik | Unstable awal | <0.01 di dataset kecil → crash risk |

---

## 6. Pipeline RAG — Contoh Nyata Step by Step

Kita trace satu query dari awal sampai jawaban akhir.

**Query:** `"Dok, saya sering sakit kepala sebelah kanan sudah 2 minggu, kadang disertai mual dan silau. Obatnya apa?"`

---

### Step 1: Embed Query

```python
query = "Instruct: Diberikan pertanyaan medis dari pasien, temukan jawaban dokter yang relevan\n" \
        "Query: Dok, saya sering sakit kepala sebelah kanan sudah 2 minggu, kadang disertai mual dan silau. Obatnya apa?"

query_vec = model.encode(query, normalize_embeddings=True)
# → shape: (1024,)  contoh nilai: [0.23, -0.41, 0.18, ..., 0.09]
```

---

### Step 2: Dense Search (E5 Cosine)

```python
# embs shape: (97035, 1024)  — semua chunk yang sudah di-embed saat indexing
scores = embs @ query_vec  # matrix multiply → (97035,) cosine scores

# contoh top-5 hasil:
# idx 42810: "Sakit kepala sebelah (migren) adalah..."     → score 0.8734
# idx 42811: "Pengobatan migren meliputi..."               → score 0.8291
# idx 15203: "Nyeri kepala unilateral dapat disebabkan..."  → score 0.7988
# idx 42809: "Gejala migren termasuk fotofobia..."         → score 0.7812
# idx 31044: "Paracetamol dan ibuprofen untuk nyeri..."    → score 0.7601
```

Ambil top-50 dari 97.035 chunks. Proses ini cepat: matmul numpy ~0.08 detik di CPU.

---

### Step 3: BM25 Search

```python
tokens_q = "dok saya sering sakit kepala sebelah kanan sudah 2 minggu kadang disertai mual dan silau obatnya apa".split()
bm25_scores = bm25.get_scores(tokens_q)  # (97035,)

# contoh top-5 BM25:
# idx 42810: "...sakit kepala sebelah..."  → score 12.4 (kata "sakit kepala sebelah" exact match)
# idx 11201: "...kepala sebelah kanan..."  → score 9.8
# idx 42808: "...mual dan silau..."        → score 8.2  (exact: "mual", "silau")
# idx 31044: "...sakit kepala obat..."     → score 7.1
# idx 55003: "...kepala sebelah 2 minggu..." → score 6.9
```

---

### Step 4: Union Candidates

```python
dense_top50 = np.argsort(-dense_scores)[:50]   # top-50 dense
bm25_top50 = np.argsort(-bm25_scores)[:50]     # top-50 BM25
candidates = np.union1d(dense_top50, bm25_top50)  # union → ~85 unique chunks
```

Beberapa chunk muncul di kedua (dense + BM25 keduanya menemukan migren). Beberapa chunk unik di masing-masing.

---

### Step 5: Hybrid Scoring

```python
# ambil scores hanya untuk candidates (~85 chunks)
d = dense_scores[candidates]
b = bm25_scores[candidates]

# min-max normalize ke [0, 1]
d_norm = (d - d.min()) / (d.max() - d.min())
b_norm = (b - b.min()) / (b.max() - b.min())

# hybrid score (dense_weight=0.6, bm25_weight=0.4)
hybrid = 0.6 * d_norm + 0.4 * b_norm
```

Contoh perhitungan untuk idx 42810:
```
d_raw = 0.8734  →  d_norm = (0.8734 - 0.62) / (0.8734 - 0.62) = 1.00
b_raw = 12.4    →  b_norm = (12.4 - 1.2) / (12.4 - 1.2) = 1.00
hybrid = 0.6 × 1.00 + 0.4 × 1.00 = 1.00  ← ranking pertama
```

Contoh untuk chunk yang hanya ditemukan BM25 (idx 55003):
```
d_raw = 0.65  →  d_norm = (0.65 - 0.62) / (0.8734 - 0.62) = 0.12
b_raw = 6.9   →  b_norm = (6.9 - 1.2) / (12.4 - 1.2) = 0.51
hybrid = 0.6 × 0.12 + 0.4 × 0.51 = 0.072 + 0.204 = 0.276  ← ranking tengah
```

Sort descending, ambil top-4.

---

### Step 6: Scope Check

```python
top_cosine = dense_scores[candidates][np.argmax(hybrid)]  # = 0.8734
scope_threshold = 0.75

if top_cosine < scope_threshold:
    return REFUSAL_MESSAGE  # "Pertanyaan ini di luar topik kesehatan..."
```

Query ini: 0.8734 > 0.75 → lanjut ke generation.

Untuk query out-of-topic "siapa presiden Amerika?": top_cosine ≈ 0.35 < 0.75 → refuse.

---

### Step 7: Build Prompt

```
[INST] Anda adalah Medi, asisten informasi kesehatan dari platform Alodokter.
Jawab berdasarkan konteks berikut.

=== KONTEKS MEDIS ===
[1] Sakit kepala sebelah (migren) adalah gangguan saraf yang menyebabkan nyeri
berdenyut unilateral. Migren sering disertai gejala seperti mual, muntah, dan
hipersensitivitas terhadap cahaya (fotofobia) dan suara (fonofobia)...

[2] Pengobatan migren dibagi menjadi abortif dan profilaktik. Untuk serangan akut,
pilihan pertama adalah triptan (sumatriptan) dan NSAID (ibuprofen, naproxen)...

[3] Faktor pemicu migren antara lain: perubahan hormon, kurang tidur, makanan
tertentu (coklat, keju, alkohol), cahaya terang, stres, dan menstruasi...

[4] Nyeri kepala unilateral yang berlangsung lebih dari 2 minggu dan rekuren
sebaiknya dievaluasi oleh dokter untuk menyingkirkan penyebab sekunder...

Dok, saya sering sakit kepala sebelah kanan sudah 2 minggu, kadang disertai mual
dan silau. Obatnya apa? [/INST]
```

Token budget konteks: 4 chunk × ~250 token = ~1000 token (dari budget 1650).

---

### Step 8: Generate

```python
output = model.generate(
    input_ids,
    max_new_tokens=400,
    temperature=0.7,
    top_p=0.9,
    repetition_penalty=1.1,
    do_sample=True,
)
```

Model membaca semua konteks + pertanyaan, lalu generate token satu per satu:

```
"Berdasarkan" → "gejala" → "yang" → "Anda" → "jelaskan" → ...
```

Output akhir: "Berdasarkan gejala yang Anda jelaskan — sakit kepala sebelah kanan berdenyut, disertai mual dan silau (fotofobia) — ini mengarah ke migren..."

---

### Variasi: Mode Q→Q (rag_keluhan.yaml)

Config alternatif di `configs/rag_keluhan.yaml`. Alih-alih embed jawaban dokter, kita embed pertanyaan pasien di index. Saat query masuk, cari pertanyaan pasien yang mirip, ambil jawaban dokter yang dipasangkan.

```
Query baru: "kepala sebelah kanan sakit, ada mual"
      ↓
Cari pertanyaan pasien yang paling mirip di index:
→ "sering sakit kepala sebelah kanan, disertai mual dan silau"  (cosine 0.97!)
      ↓
Return jawaban dokter yang pasangan dengan pertanyaan itu
```

**Hasil recall@1 = 0.9988** — hampir sempurna. Ini karena kita menghilangkan semantic gap antara bahasa informal pasien dengan bahasa formal dokter.

**Keterbatasan:** Hanya bisa menjawab pertanyaan yang mirip dengan yang sudah ada di database. Pertanyaan baru yang genuinely novel tidak punya pasangan.

---

## 7. Parameter RAG — Detail dan Justifikasi

### `chunk_size_tokens` = 250

**Kenapa 250 bukan 512 (limit E5)?**

Kita uji beberapa ukuran chunk:

| chunk_size | recall@3 | Catatan |
|------------|----------|---------|
| 128 | 0.521 | Terlalu kecil, kehilangan konteks |
| **250** | **0.575** | **Optimal** |
| 384 | 0.559 | Sedikit turun, embedding "tercampur" topik |
| 512 | 0.541 | Mendekati E5 limit, embedding mulai saturasi |

Pada 250 token, rata-rata jawaban Alodokter (250-350 token) masuk dalam 1-2 chunk dengan konteks utuh.

### `chunk_overlap_tokens` = 30

Chunk berurutan tumpang tindih 30 token. Contoh:

```
Jawaban: "...penyakit ini disebabkan oleh bakteri [chunk1 berakhir di sini]
          bakteri Streptococcus yang menginfeksi saluran napas..."
```

Tanpa overlap: "bakteri" ada di akhir chunk1 tapi konteks "Streptococcus yang menginfeksi" ada di chunk2. Embedding chunk1 incomplete.

Dengan 30-token overlap: chunk2 dimulai dari "oleh bakteri Streptococcus" → konteks utuh di kedua chunk.

### `top_k` = 4

Berapa chunk yang dimasukkan ke prompt.

| top_k | Token di prompt | Risk |
|-------|-----------------|------|
| 2 | ~500 | Konteks kurang |
| **4** | **~1000** | **Optimal** |
| 6 | ~1500 | Mepet token budget |
| 8 | ~2000 | Over budget |

Dengan max_length 1536 dan token budget 1650 untuk konteks, k=4 adalah maksimum yang muat sebelum bertabrakan dengan pertanyaan user.

### `dense_weight` = 0.6, `bm25_weight` = 0.4

Didapat dari sweep empiris di `src/ablate_retrieval.py`:

```
dense_weight | bm25_weight | Recall@3 | MRR
0.0          | 1.0         | 0.2125   | 0.1887  ← BM25 only
0.3          | 0.7         | 0.5112   | 0.4723
0.4          | 0.6         | 0.5441   | 0.4950
0.5          | 0.5         | 0.5623   | 0.5073
0.6          | 0.4         | 0.5751   | 0.5148  ← optimal
0.7          | 0.3         | 0.5694   | 0.5102
0.8          | 0.2         | 0.5647   | 0.5044
1.0          | 0.0         | 0.5566   | 0.5015  ← dense only
```

Peak di 0.6. BM25 berkontribusi, tapi dense lebih dominan. Ini sesuai dengan literatur: untuk bahasa dengan gap formal-informal (seperti Indonesian medis), dense lebih powerful tapi BM25 tetap membantu untuk nama obat dan diagnosis spesifik.

### `scope_threshold` = 0.75

Cosine minimum antara query dan dokumen terbaik. Di bawah ini → refuse.

**Cara kalibrasi yang benar (tidak dilakukan di proyek ini, catat sebagai limitation):**
1. Kumpulkan 100 query medis valid dan 100 query off-topic
2. Hitung distribusi cosine untuk keduanya
3. Pilih threshold di mana false positive (valid tapi ditolak) < 5%

Nilai 0.75 adalah heuristic berdasarkan observasi bahwa query medis valid biasanya cosine ≥ 0.80 dengan sistem E5 kita.

### Generation Parameters

**`max_new_tokens` = 400**

Jawaban dokter rata-rata 200-350 token → 400 memberi ruang cukup tanpa membiarkan model generate tanpa batas.

Naik ke 800: Jawaban bisa lebih detail, tapi model cenderung "mengisi" dengan pengulangan kalau sudah kehabisan ide. Lebih lambat.
Turun ke 200: Jawaban sering terpotong di tengah penjelasan.

**`temperature` = 0.7**

Temperature mengontrol distribusi sampling:

```
P(token_i) = softmax(logit_i / temperature)
```

| Temperature | Efek | Kapan dipakai |
|-------------|------|----------------|
| 0.0 | Greedy — selalu pilih token paling probable | Exact answers, kode |
| 0.3–0.5 | Konservatif, konsisten | Faktual Q&A ketat |
| **0.7** | **Balance konsisten dan natural** | **Medical explanation** |
| 1.0 | Sampling persis distribusi asli | Creative writing |
| 1.5+ | Sangat random, sering tidak koheren | Eksperimen saja |

Untuk medical QA: tidak terlalu random (tidak mau hallucinate) tapi tidak terlalu greedy (jawaban persis sama untuk semua pertanyaan → terasa robot).

**`top_p` = 0.9 (Nucleus Sampling)**

Hanya sample dari token-token yang secara kumulatif mencakup 90% probabilitas. Token dengan probabilitas kecil diabaikan.

Misalnya: "Pasien mengalami nyeri" — top token: "kepala" (55%), "perut" (20%), "dada" (10%), "sendi" (5%), ... → top-p 0.9 mungkin hanya allow 5-8 token pertama, buang ratusan token improbable.

**`repetition_penalty` = 1.1**

Kurangi probabilitas token yang sudah muncul sebelumnya:

```
logit_adjusted = logit / 1.1  (untuk token yang sudah muncul)
```

Tanpa penalty, LLM sering loop: "Nyeri kepala bisa disebabkan... nyeri kepala bisa disebabkan..."
1.1 = penalty ringan, cukup untuk cegah loop tanpa membuat jawaban terasa dipaksakan menghindari kata penting.

---

## 8. Metrik Evaluasi — Formula + Perhitungan Nyata

### 8.1 Setup Evaluasi

**Dataset:** 866 query dari test split (held-out, tidak dipakai saat training atau indexing).

**Gold standard:** Tiap query punya satu "paired answer" — jawaban dokter asli yang menjawab pertanyaan itu. Evaluasi dianggap "hit" jika retrieval menemukan persis pasangan ini.

**Catatan penting ("pessimistic evaluation"):** Query seperti "apa itu diabetes?" punya ratusan jawaban valid di korpus. Tapi kita hanya hitung 1 sebagai gold. Retrieval yang menemukan jawaban diabetes yang valid tapi bukan yang "paired" tetap dihitung miss. Ini underestimate kualitas nyata retrieval.

---

### 8.2 Recall@k

**Formula:**
```
Recall@k = (jumlah query di mana gold ada di top-k) / total query
```

**Perhitungan nyata di proyek kita (866 query total):**

```
k=1:  360 query punya gold di posisi 1    → Recall@1  = 360/866 = 0.4157
k=3:  498 query punya gold di top-3       → Recall@3  = 498/866 = 0.5751
k=5:  569 query punya gold di top-5       → Recall@5  = 569/866 = 0.6570
k=10: 636 query punya gold di top-10      → Recall@10 = 636/866 = 0.7344
```

**Interpretasi:** Untuk sistem RAG dengan k=4, yang relevan adalah Recall@3 sampai Recall@5. Recall@3 = 0.575 artinya 57.5% pertanyaan pasien, dokumen relevannya ada di antara 3 hasil pertama.

**Recall naik:** Retrieval menemukan lebih banyak dokumen relevan — model embedding lebih baik, atau hybrid weight lebih optimal.
**Recall turun:** Retrieval sering melewatkan dokumen yang benar — bisa karena domain mismatch atau chunking yang buruk.

---

### 8.3 Precision@k

**Formula:**
```
Precision@k = (jumlah dokumen relevan di top-k) / k
```

Karena gold kita hanya 1 per query:
```
Precision@k = 1/k  jika gold ada di top-k
            = 0    jika tidak
```

Maka:
```
Precision@3 = (498 × 1/3 + 368 × 0) / 866 = 166/866 = 0.1917
Precision@5 = (569 × 1/5 + 297 × 0) / 866 = 113.8/866 = 0.1314
```

**Catatan:** Precision menurun seiring k naik karena penyebut (k) membesar tapi jumlah relevan tetap 1. Ini bukan "kualitas turun", ini sifat matematisnya. Untuk sistem single-relevant, Recall@k lebih informatif dari Precision@k.

---

### 8.4 MRR (Mean Reciprocal Rank)

**Formula:**
```
MRR = (1/N) × Σᵢ (1/rank_i)
```

Di mana rank_i = posisi gold di hasil query ke-i (jika tidak ditemukan = ∞, kontribusi = 0).

**Perhitungan contoh (4 query):**
```
Query 1: gold di posisi 1 → 1/1 = 1.000
Query 2: gold di posisi 3 → 1/3 = 0.333
Query 3: gold di posisi 7 → 1/7 = 0.143
Query 4: gold tidak masuk top-10 → 0.000

MRR = (1.000 + 0.333 + 0.143 + 0.000) / 4 = 0.369
```

**MRR nyata di proyek kita: 0.5148**

Artinya rata-rata gold dokumen ada di posisi ~1.94 (1/0.5148 ≈ 1.94).

**Interpretasi MRR vs Recall@k:**

MRR sangat sensitif ke apakah gold ada di ranking 1 atau 2. Recall@k hanya peduli apakah gold ada dalam k besar.

MRR = 0.5148 dan Recall@1 = 0.4157: gap 0.0991 artinya ada cukup banyak query di mana gold di posisi 2-3 (kontribusi ke recall@3 tapi posisinya bukan 1).

---

### 8.5 nDCG@k (Normalized Discounted Cumulative Gain)

**Motivasi:** Recall dan Precision tidak peduli posisi — gold di rank 3 sama nilainya dengan rank 1. nDCG memberi reward lebih besar untuk posisi lebih atas.

**Formula:**
```
DCG@k = Σᵢ₌₁ᵏ (rel_i / log₂(i+1))

rel_i = 1 jika posisi i adalah gold, 0 jika bukan

nDCG@k = DCG@k / IDCG@k
IDCG@k = maksimum DCG yang mungkin (jika gold di posisi 1) = 1/log₂(2) = 1.0
```

**Perhitungan konkret:**

Query dengan gold di posisi 2:
```
DCG@5 = rel_1/log₂(2) + rel_2/log₂(3) + rel_3/log₂(4) + ...
      = 0/1.000       + 1/1.585        + 0/2.000        + 0 + 0
      = 0.631

IDCG@5 = 1/log₂(2) = 1.000  (jika gold ada di posisi 1)

nDCG@5 = 0.631 / 1.000 = 0.631
```

Query dengan gold di posisi 1:
```
DCG@5 = 1/log₂(2) = 1.000
nDCG@5 = 1.000 / 1.000 = 1.000
```

Query dengan gold di posisi 5:
```
DCG@5 = 1/log₂(6) = 1/2.585 = 0.387
nDCG@5 = 0.387
```

**nDCG@5 nyata: 0.5425**

---

### 8.6 BERTScore

**Untuk evaluasi kualitas jawaban (generation), bukan retrieval.**

**Formula:**

Misal prediksi P = ["Keluhan", "Anda", "mengarah", "ke", "migren"]
dan referensi R = ["Gejala", "ini", "konsisten", "dengan", "migren"]

```
1. Encode P dan R dengan xlm-roberta-large → embedding tiap token
2. Untuk setiap token p_i di P:
   max_sim(p_i) = max cosine(embed(p_i), embed(r_j)) untuk semua r_j ∈ R
3. Precision_BRT = mean of max_sim untuk semua token di P
4. Recall_BRT    = mean of max_sim untuk semua token di R (tapi diukur dari P)
5. F1_BRT = 2 × P_BRT × R_BRT / (P_BRT + R_BRT)
```

Contoh token-level:
```
"migren" (P) ↔ "migren" (R): cosine ≈ 0.99  ← sama persis
"Keluhan" (P) ↔ "Gejala" (R): cosine ≈ 0.87  ← sinonim
"mengarah" (P) ↔ "konsisten" (R): cosine ≈ 0.72  ← bermakna mirip
"Anda" (P) ↔ "ini" (R): cosine ≈ 0.41  ← berbeda tapi tidak berlawanan
"ke" (P) ↔ "dengan" (R): cosine ≈ 0.68  ← fungsi kata mirip
```

**Kenapa bukan BLEU?**

BLEU hitung exact n-gram overlap. "sakit kepala" vs "nyeri kepala": BLEU = 0 (tidak ada bigram yang sama). BERTScore ≈ 0.88 (sangat mirip secara semantik).

Untuk medical QA, sinonim dan parafrase sangat umum → BLEU menghukum semua sinonim → tidak cocok.

**`xlm-roberta-large`** dipilih karena:
1. Dilatih pada 100 bahasa termasuk Indonesian (XLM = Cross-Lingual)
2. Versi `large` (355M parameter) lebih akurat dari `base` untuk nuansa bahasa
3. BERTScore dengan XLM-R jadi defacto standar untuk multilingual NLG evaluation

---

### 8.7 F1 Token

**Formula:**
```
TP = jumlah token yang ada di prediksi DAN referensi
Precision = TP / total token prediksi
Recall    = TP / total token referensi
F1        = 2 × P × R / (P + R)
```

Contoh:
```
Prediksi:  ["migren", "disebabkan", "oleh", "saraf", "dan", "pembuluh"]
Referensi: ["migren", "terjadi", "karena", "saraf", "trigeminal"]

TP = {"migren", "saraf"} = 2 token
P = 2/6 = 0.333
R = 2/5 = 0.400
F1 = 2 × 0.333 × 0.400 / (0.333 + 0.400) = 0.364
```

**Keterbatasan F1 Token:** Tidak paham sinonim — "mengalami" dan "menderita" dihitung berbeda. Dipakai bersama BERTScore untuk gambar lebih lengkap.

---

### 8.8 Ringkasan Angka Retrieval Nyata

**Config Production (E5 + Hybrid 0.6/0.4, 866 query test):**

| k | Recall | Precision | nDCG |
|---|--------|-----------|------|
| 1 | 0.4157 | 0.4157 | 0.4157 |
| 3 | **0.5751** | 0.1917 | 0.5087 |
| 5 | 0.6570 | 0.1314 | 0.5425 |
| 10 | 0.7344 | 0.0734 | 0.5674 |

**MRR: 0.5148**

**Komponen Ablation:**

| Config | Recall@3 | Recall@5 | nDCG@5 | MRR |
|--------|----------|----------|--------|-----|
| Dense-only | 0.5566 | 0.6316 | 0.5243 | 0.5015 |
| BM25-only | 0.2125 | 0.2714 | 0.2031 | 0.1887 |
| **Hybrid 0.6/0.4** | **0.5751** | **0.6570** | **0.5425** | **0.5148** |

**Mode Q→Q (rag_keluhan.yaml):**

| k | Recall |
|---|--------|
| 1 | 0.9988 |
| 3 | 1.0000 |

MRR: 0.9994 — hampir sempurna, tapi ini "cheating" karena test questions sangat mirip dengan index questions (same source).

---

## 9. Matriks Eksperimen

```yaml
# configs/eval.yaml
conditions:
  - name: baseline_base
    adapter: null
    use_rag: false

  - name: baseline_finetuned
    adapter: models/biomistral-id-lora
    use_rag: false

  - name: proposed_rag
    adapter: models/biomistral-id-lora
    use_rag: true

  - name: ablation_topk2
    adapter: models/biomistral-id-lora
    use_rag: true
    top_k: 2
```

### Apa yang Dibuktikan Tiap Kondisi

**`baseline_base`:** BioMistral asli tanpa modifikasi. Ekspektasi: buruk untuk Indonesian.

**`baseline_finetuned`:** Fine-tune saja, tanpa RAG. Belajar Indonesian + gaya Alodokter, tapi jawab dari memori LLM. Ini **baseline utama** — musuh yang harus dikalahkan oleh RAG.

**`proposed_rag`:** Sistem lengkap. Kalau ini lebih baik dari `baseline_finetuned`: hipotesis terbukti, RAG membantu.

**`ablation_topk2`:** Apakah k=4 lebih baik dari k=2? Kalau skornya sama, hemat token dengan k=2. Kalau k=4 lebih baik, lebih banyak konteks memang membantu.

### Cara Baca Hasil

```
proposed_rag > baseline_finetuned  → RAG membantu (hipotesis terbukti)
proposed_rag ≈ baseline_finetuned  → RAG tidak banyak bantu, perlu investigasi
proposed_rag < baseline_finetuned  → RAG mengganggu (konteks salah masuk)
```

---

## 10. Peta File / Source Code

### Struktur Direktori

```
biomistral-rag/
│
├── configs/
│   ├── rag.yaml              ← Parameter RAG default (E5 hybrid)
│   ├── rag_bgem3.yaml        ← Alternatif BGE-M3
│   ├── rag_keluhan.yaml      ← Mode Q→Q retrieval
│   └── eval.yaml             ← Matriks eksperimen 4 kondisi
│
├── src/
│   ├── build_index.py        ← Bangun embs.npy + bm25.pkl dari corpus
│   ├── retrieve.py           ← Class Index: candidates() + rank() + retrieve()
│   ├── rag_pipeline.py       ← End-to-end: load model → retrieve → generate
│   ├── eval_retrieval.py     ← Hitung Recall/Precision/nDCG/MRR
│   └── ablate_retrieval.py   ← Sweep weight, komponen ablation
│
├── scripts/
│   ├── modal_train.py        ← Fine-tune SEA-LION di Modal (A100-40GB)
│   ├── kaggle_biomistral.ipynb ← Fine-tune BioMistral di Kaggle (T4×2)
│   ├── export_train.py       ← Format CSV → JSONL messages
│   ├── make_splits.py        ← Split 80/10/10 train/val/test
│   └── cleaning/             ← 8-stage data cleaning pipeline
│       ├── clean_lib.py      ← Fungsi shared (base_clean, dll)
│       ├── s1_textclean.py   ← Encoding, mojibake, URL, emoji
│       ├── s2_brand.py       ← Brand name → Medi
│       ├── s3_opener.py      ← Strip sapaan/pembuka
│       ├── s4_closer.py      ← Strip tanda tangan dokter
│       ├── s5_pronoun.py     ← Saya/aku → Medi, dedup
│       ├── flag_names.py     ← Bangun CSV kandidat nama bocor (semi-manual)
│       ├── fix_names.py      ← Apply hasil review ke dataset
│       └── s6_polish.py      ← Second pass leftover
│
├── data/
│   ├── corpus/corpus.jsonl   ← Korpus final untuk RAG (58.940 dokumen)
│   └── processed/            ← train.jsonl, val.jsonl, test.jsonl
│
├── models/
│   ├── biomistral-id-lora/   ← LoRA adapter BioMistral (hasil fine-tune)
│   ├── sealion-id-lora/      ← LoRA adapter SEA-LION
│   └── vector_index/         ← embs.npy + bm25.pkl + chunks.jsonl
│
└── results/
    ├── retrieval_eval.md     ← Hasil retrieval eval E5 hybrid
    └── retrieval_eval_keluhan.md ← Hasil retrieval eval Q→Q
```

### Penjelasan `src/retrieve.py` — Desain Class

```python
class Index:
    def __init__(self, cfg):
        # load embs.npy ke RAM (~380MB untuk 97k chunks)
        # load bm25.pkl (BM25Okapi object)
        # load embedding model (E5 atau BGE-M3)

    def _embed_query(self, q):
        # tambah instruksi prefix jika E5
        # encode → normalize → return (1024,) vector

    def candidates(self, query):
        # dense: matmul → top-50
        # bm25: get_scores → top-50
        # return union (~85 unique indices)

    def rank(self, cand_idx, d_scores, b_scores, k, dw, bw):
        # min-max normalize
        # hybrid = dw*d_norm + bw*b_norm
        # sort, ambil top-k

    def retrieve(self, query, k):
        # candidates() lalu rank()
        # return list of chunk dicts dengan teks + metadata
```

**Mengapa `candidates()` dipisah dari `rank()`?**

`ablate_retrieval.py` perlu jalankan retrieval untuk 866 test queries × banyak weight kombinasi (0.0 sampai 1.0). Embedding adalah operasi mahal (~0.1 detik/query). Kalau embed + rank dalam satu fungsi, harus embed ulang 866×11 = 9.526 kali.

Dengan pemisahan: embed sekali per query (866 kali total), simpan scores, re-rank dengan berbagai weight. Waktu eksekusi turun dari ~16 menit ke ~1.5 menit.

---

## 11. Referensi Paper

| Paper | Kontribusi Langsung ke Proyek |
|-------|-------------------------------|
| Dettmers et al. (2023). **QLoRA: Efficient Finetuning of Quantized LLMs.** NeurIPS. | Justifikasi seluruh setup QLoRA: NF4, double quant, paged optimizer, r=16, LR 2e-4. |
| Labrak et al. (2024). **BioMistral: A Collection of Open-Source Pretrained LLMs for Medical Domains.** ACL. | Alasan memilih BioMistral, arsitektur DARE merging, benchmark MedQA. |
| Xiong et al. (2024). **MIRAGE: A Benchmark for Medical RAG.** arXiv. | Justifikasi RAG untuk medical QA: "RAG improves GPT-3.5 from 60.69% to 71.57% on MedQA." |
| Wang et al. (2023). **Improving Text Embeddings with Large Language Models.** arXiv. | E5-instruct methodology, instruksi prefix untuk asymmetric retrieval. |
| Chen et al. (2024). **BGE-M3: A Multi-Lingual, Multi-Functionality, Multi-Granularity Embedding.** arXiv. | Justifikasi BGE-M3 sebagai alternatif untuk dokumen panjang. |
| Hu et al. (2022). **LoRA: Low-Rank Adaptation of Large Language Models.** ICLR. | Dasar teori LoRA, justifikasi rank choice. |
| Robertson & Zaragoza (2009). **The Probabilistic Relevance Framework: BM25 and Beyond.** | Dasar teori BM25, parameter k1 dan b. |
| SEA-BED Benchmark (2024). | Bukti E5-large-instruct ranking pertama untuk Indonesian retrieval. |
| McCandlish et al. (2018). **An Empirical Model of Large-Batch Training.** arXiv. | Justifikasi effective batch size 16-32 untuk LLM fine-tuning. |
