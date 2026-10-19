import pandas as pd
from clean_lib import base_clean

df = pd.read_csv("data/cleaning/3_dataset_corrected.csv")[["Poli_Tujuan", "URL", "Keluhan", "Jawaban_Dokter"]]
df = df.dropna(subset=["Keluhan", "Jawaban_Dokter"]).reset_index(drop=True)
df.insert(0, "rid", df.index)
for c in ["Poli_Tujuan", "Keluhan", "Jawaban_Dokter"]:
    df[c] = df[c].map(base_clean)
df.to_csv("data/clean/s1_text.csv", index=False, encoding="utf-8")

J, K = df["Jawaban_Dokter"].astype(str), df["Keluhan"].astype(str)
moji = (J.str.contains("Â") | J.str.contains("�") | K.str.contains("�")).sum()
url = (J.str.contains(r"https?://") | K.str.contains(r"https?://")).sum()
print(f"[s1] rows={len(df)}  GATE -> mojibake={moji} url={url}  ({'OK' if moji==0 and url==0 else 'FAIL'})")
