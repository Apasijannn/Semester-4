import sys

import pandas as pd
from flag_names import strip_front

BASE = "data/clean/s5_pronoun.csv"
CAND = "data/cleaning/name_candidates.csv"
OUT = "data/cleaning/dataset_cleaned.csv"
PREVIEW = "--preview" in sys.argv

base = pd.read_csv(BASE)
cand = pd.read_csv(CAND)
if "keep" in cand.columns:
    cand = cand[cand["keep"].fillna(1).astype(int) == 1]

patched, skipped, samples = 0, 0, []
for _, r in cand.iterrows():
    rid = r["rid"]
    if rid not in base.index:
        continue
    name = str(r["guess_name"]).strip()
    if not name or name.lower() == "nan":
        skipped += 1
        continue
    cur = str(base.at[rid, "Jawaban_Dokter"])
    new = strip_front(cur, name)
    if new and new != cur:
        if len(samples) < 15:
            samples.append((name, cur[:55], new[:55]))
        if not PREVIEW:
            base.at[rid, "Jawaban_Dokter"] = new
        patched += 1
    else:
        skipped += 1

if PREVIEW:
    print("=== PREVIEW (tidak menulis) ===")
    for name, before, after in samples:
        print(f"  [{name}]")
        print(f"    B: {before!r}")
        print(f"    A: {after!r}")
    print(f"\nakan patch {patched}, skip {skipped} (name_guess tak lagi di awal)")
else:
    base = base[base["Jawaban_Dokter"].astype(str).str.len() > 0]
    base.to_csv(OUT, index=False, encoding="utf-8")
    print(f"patched {patched}, skipped {skipped} -> {OUT} ({len(base)} rows)")
