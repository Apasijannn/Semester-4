"""s7: filter dataset_final.csv down to the skin/dermatology domain.

Run after s6_polish.py, before building train.jsonl and the RAG vector-index,
so both only see skin-related Poli_Tujuan categories instead of all ~1400
Alodokter specialties.

out: dataset_skin.csv
"""
import sys

import pandas as pd

BASE = "data/cleaning/dataset_final.csv"
OUT = "data/cleaning/dataset_skin.csv"
INCLUDE_BORDERLINE = "--include-borderline" in sys.argv

CORE = {
    # jerawat & folikel
    "jerawat", "jerawat-batu", "jerawat-hormonal", "komedo", "komedo-putih",
    "folikulitis", "milia",
    # dermatitis & alergi kulit
    "dermatitis", "dermatitis-atopik", "dermatitis-kontak",
    "dermatitis-kontak-iritan", "dermatitis-numularis", "dermatitis-seboroik",
    "dermatographia", "eksim", "alergi-kulit", "urtikaria", "biduran",
    "neurodermatitis", "iritasi-kulit", "ruam-kulit", "kulit-gatal",
    # infeksi kulit (jamur/bakteri/virus/parasit)
    "infeksi-kulit", "jamur-kulit", "jamur-kuku", "kurap", "panu",
    "tinea-corporis", "kutu-air", "kudis", "kusta", "bisul", "kista-kulit",
    "kutil", "kutil-kelamin", "herpes", "herpes-labialis", "herpes-simpleks",
    "herpes-zoster", "herpes-genital", "kutu-rambut",
    # pigmentasi, penuaan & kosmetik
    "flek", "flek-hitam", "hiperpigmentasi", "keriput", "penuaan",
    "pemutihan-kulit", "bekas-luka", "kosmetik", "skin-care", "wajah",
    "selulitis",
    # kanker & lesi kulit
    "kanker-kulit", "melanoma", "vitiligo", "bintik-kulit", "alopecia-areata",
    # kondisi kulit umum & rambut/kuku
    "kulit", "kulit-bersisik", "kulit-kering", "kulit-kelamin",
    "penyakit-kulit", "kesehatan-kulit", "kuku", "rambut", "rambut-rontok",
    "rambut-tumbuh-ke-dalam", "luka-bakar",
}

# viral/systemic diseases that present with a rash but aren't primarily a
# dermatology complaint -- off by default, add with --include-borderline
BORDERLINE = {"cacar-air", "cacar-monyet", "campak"}

# NOTE: "divertikulitis"/"diverkulitis" (usus) and "vaskulitis" (pembuluh
# darah) only look skin-related because "kulit" appears as a substring --
# deliberately excluded. "vaksin-campak" is a vaccination topic, also excluded.

WHITELIST = CORE | (BORDERLINE if INCLUDE_BORDERLINE else set())

df = pd.read_csv(BASE)
before = len(df)
poli = df["Poli_Tujuan"].astype(str).str.strip().str.lower()

mask = poli.isin(WHITELIST)
out = df[mask].reset_index(drop=True)
out.to_csv(OUT, index=False, encoding="utf-8")

leftover = sorted(
    set(poli[poli.str.contains(r"kulit|kuku|rambut|jerawat|dermat|kutil|jamur", regex=True)])
    - WHITELIST
)

print(f"[s7] {before} -> {len(out)} rows ({len(out) / before:.1%}) | kategori dipakai: {len(WHITELIST)} "
      f"(borderline {'ON' if INCLUDE_BORDERLINE else 'OFF'})")
if leftover:
    print(f"     [!] kategori mengandung kata kunci kulit tapi TIDAK ada di whitelist -- cek manual: {leftover}")
print("\nsebaran per kategori:")
print(poli[mask].value_counts().to_string())
