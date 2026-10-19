import pandas as pd
from clean_lib import strip_opener

df = pd.read_csv("data/clean/s2_brand.csv")
df["Jawaban_Dokter"] = df["Jawaban_Dokter"].map(strip_opener)
df.to_csv("data/clean/s3_opener.csv", index=False, encoding="utf-8")

J = df["Jawaban_Dokter"].astype(str)
greet = J.str.match(r"(?i)^(halo+|hai+|hi|dear|selamat\s+(pagi|siang|sore|malam)|assalam|wa\S*alaikum)").sum()
remnant = J.str.match(r"^(Aas|Aatas|Pertanyannya|Pertanyaannya)\b").sum()
tests = {
    "Halo Kalya, Terimakasih aas pertanyaannya. Nyeri saat menelan.": "Nyeri saat menelan.",
    "Halo, Misoprostol, atau obat lain.": "Misoprostol, atau obat lain.",
    "Halo, selamat malam Asam folat merupakan nutrisi.": "Asam folat merupakan nutrisi.",
}
safe = all(strip_opener(k).startswith(v.split()[0]) for k, v in tests.items())
ok = greet < 1500 and remnant == 0 and safe
print(f"[s3] rows={len(df)}  GATE -> greeting-start={greet} remnant(Aas/Pertanyannya)={remnant} drug_safe={safe}  ({'OK' if ok else 'CHECK'})")
