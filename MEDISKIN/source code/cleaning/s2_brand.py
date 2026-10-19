import pandas as pd
from clean_lib import normalize_brand

df = pd.read_csv("data/clean/s1_text.csv")
before_alo = df["Jawaban_Dokter"].astype(str).str.contains(r"(?i)alodokter").sum()
df["Jawaban_Dokter"] = df["Jawaban_Dokter"].map(normalize_brand)
df.to_csv("data/clean/s2_brand.csv", index=False, encoding="utf-8")

after_alo = df["Jawaban_Dokter"].astype(str).str.contains(r"(?i)alodokter").sum()
print(f"[s2] rows={len(df)}  GATE -> alodokter {before_alo}->{after_alo}  ({'OK' if after_alo==0 else 'FAIL'})")
