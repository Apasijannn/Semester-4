"""Build a REVIEW csv of every proposed s6.1 cleanup edit (run AFTER s6, on dataset_final.csv).

For each row that matches a cleanup category it writes one review line: the category, the BEFORE text
and the proposed AFTER text (both full + a short head/tail preview), so the edit can be eyeballed and
accepted/rejected BEFORE anything is applied. Nothing is mutated here -- this only proposes.

out: cleanup_candidates.csv
"""
import re

import pandas as pd

SRC = "data/cleaning/dataset_final.csv"
OUT = "data/cleaning/cleanup_candidates.csv"

# --- proposed transforms (each returns new text; identity if not applicable) --------------- #
WAS_STUB = re.compile(r"(?i)[\s.,]+wass?(?:alam\w*|alamualaikum\w*)?\.?\s*$")   # trailing 'Was' / 'Wassalam'
DUP_CLOSER = re.compile(r"(?i)(terima kasih,?\s*semoga membantu\.?)(?:\s*\1)+")  # repeated closer
MEDI_NODELIM = re.compile(r"(?i)^\W*(?:di|untuk|pada|ke)\s+(?:forum\s+)?medi\s+(?=[A-Z])")
DIGIT_STUB = re.compile(r"^(?:070669[.\s]+|1\s+(?=Halo)|19\s+(?=saat))", re.I)


def _recap(s):
    s = s.strip()
    return (s[:1].upper() + s[1:]) if s else s


def proposals(text: str):
    """yield (category, after) for each cleanup that would change `text`."""
    s = str(text)
    out = []
    if WAS_STUB.search(s):
        out.append(("was_stub", _recap(WAS_STUB.sub("", s)) + "."))
    if DUP_CLOSER.search(s):
        out.append(("dup_closer", _recap(DUP_CLOSER.sub(r"\1", s))))
    if MEDI_NODELIM.search(s):
        out.append(("medi_nodelim", _recap(MEDI_NODELIM.sub("", s))))
    if DIGIT_STUB.search(s):
        out.append(("digit_stub", _recap(DIGIT_STUB.sub("", s))))
    return out


df = pd.read_csv(SRC)
rows = []
for r in df.itertuples(index=False):
    s = str(r.Jawaban_Dokter)
    for cat, after in proposals(s):
        if after != s:
            rows.append({
                "rid": r.rid, "kategori": cat, "keep_clean": 1, "Poli_Tujuan": r.Poli_Tujuan,
                "before_head": s[:80], "before_tail": s[-50:],
                "after_head": after[:80], "after_tail": after[-50:],
                "before_full": s, "after_full": after,
            })

out = pd.DataFrame(rows)
out.to_csv(OUT, index=False, encoding="utf-8")
print(f"{len(out)} kandidat cleanup -> {OUT}")
print(out["kategori"].value_counts().to_string())
print("\nset keep_clean=0 di baris yang TIDAK mau di-clean, lalu apply.")
