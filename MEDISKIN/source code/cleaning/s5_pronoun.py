import pandas as pd
from clean_lib import pronoun_to_medi

df = pd.read_csv("data/clean/s4_closer.csv")
J0 = df["Jawaban_Dokter"].astype(str)
pron_before = J0.str.contains(r"(?i)\b(?:saya|aku|kami)\b").sum()
kita_before = J0.str.contains(r"(?i)\bkita\b").sum()

df["Jawaban_Dokter"] = df["Jawaban_Dokter"].map(pronoun_to_medi)
df = df[(df["Keluhan"].astype(str).str.len() > 0) & (df["Jawaban_Dokter"].astype(str).str.len() > 0)]
df = df.drop_duplicates(["Keluhan", "Jawaban_Dokter"]).reset_index(drop=True)
df.to_csv("data/clean/s5_pronoun.csv", index=False, encoding="utf-8")

J = df["Jawaban_Dokter"].astype(str)
pron_after = J.str.contains(r"(?i)\b(?:saya|aku|kami)\b").sum()
kita_after = J.str.contains(r"(?i)\bkita\b").sum()
ok = pron_after == 0
print(f"[s5] rows={len(df)}  GATE -> saya/aku/kami {pron_before}->{pron_after} | kita preserved {kita_before}->{kita_after}  ({'OK' if ok else 'CHECK'})")
