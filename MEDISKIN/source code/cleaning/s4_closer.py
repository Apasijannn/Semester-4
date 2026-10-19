import pandas as pd
from clean_lib import strip_closer

df = pd.read_csv("data/clean/s3_opener.csv")
J0 = df["Jawaban_Dokter"].astype(str)
warm_before = J0.str.contains(r"(?i)semoga\s+\w*\s*(?:membantu|bermanfaat)").sum()
sig_before = J0.str.contains(r"(?:dr|drg)\.?\s+[A-Z][a-z]+\s*$").sum()

df["Jawaban_Dokter"] = df["Jawaban_Dokter"].map(strip_closer)
df.to_csv("data/clean/s4_closer.csv", index=False, encoding="utf-8")

J = df["Jawaban_Dokter"].astype(str)
sig_after = J.str.contains(r"(?:dr|drg)\.?\s+[A-Z][a-z]+\s*$").sum()
warm_after = J.str.contains(r"(?i)semoga\s+\w*\s*(?:membantu|bermanfaat)").sum()
ok = sig_after == 0 and warm_after >= warm_before * 0.98
print(f"[s4] rows={len(df)}  GATE -> trailing dr.Name {sig_before}->{sig_after} | warmth {warm_before}->{warm_after}  ({'OK' if ok else 'CHECK'})")
