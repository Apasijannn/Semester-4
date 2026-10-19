import re
import sys

import pandas as pd
from flag_names import strip_front

BASE = "data/cleaning/dataset_cleaned.csv"
OUT = "data/cleaning/dataset_final.csv"
PREVIEW = "--preview" in sys.argv

GREET = re.compile(r"(?i)^\W*(?:hal+o+|hell?o+|haii+|hai|hi|hey|dear|"
                   r"selamat\s+(?:pagi|siang|sore|malam|datang))\b[\s,.!]*")

LEFTOVER_NAMES = [
    "M Yudatam", "Saudari Ely", "Imra'atus",
    "Zefanya", "Aritsa123", "Kastiwa30", "996er", "Rudi93", "Andrarama", "Diyah2511",
    "Villana", "David2209", "Galihdm20", "Faizal", "Natalia", "Vivi", "Lyna", "Fathur",
    "Raya", "Andri", "Alex", "Ely",
]

DIGIT_LEAD = re.compile(r"^\W*(?:\d{4,}[.…\s]+|\d+\s+(?=(?:halo|hai|hallo|hello|selamat)\b))", re.I)
MEDI_NODELIM = re.compile(r"(?i)^\W*(?:di|untuk|pada|ke)\s+(?:forum\s+)?medi\s+(?=[A-Z])")
WAS_STUB = re.compile(r"(?i)\s+wass?(?:alam\w*)?\.?\s*$")
DUP_CLOSER = re.compile(r"(?i)(terima kasih,?\s*semoga membantu\.?)(?:\s*\1)+")
THX_REMN = re.compile(
    r"(?i)^\W*(?:"
    r"terima\s?kasih[^.]*?(?:pertanyaa?n\w*|bertanya|menghubungi)[^.]*"
    r"|(?:di|untuk|pada|ke)\s+(?:forum\s+)?medi"
    r"|anda(?:\s+di\s+(?:forum\s+)?medi)?"
    r"|sebelumnya"
    r")\s*[.,!]+\s*")
DR_INTRO = re.compile(r"(?i)^\W*(?:perkenalkan\s+)?(?:nama\s+saya\s+|saya\s+)?"
                      r"medi[,\s]+(?:dr|drg)\.?\s*(?:[A-Z][a-z']+\s+){1,7}"
                      r"akan\s+(?:menjawab|mencoba|membantu)[^.]*\.\s*")
DR_SIGN = re.compile(r"(?i)\s*(?:salam[,.\s]*)?(?:hormat\s+saya[,.\s]*)?"
                     r"(?:dr|drg)\.\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\s*[\"'.]*\s*$")


def _recap(s: str) -> str:
    s = s.strip()
    return (s[:1].upper() + s[1:]) if s else s


def polish(text: str) -> str:
    s = str(text)
    s = DR_INTRO.sub("", s)
    for _ in range(6):
        before = s
        s = DIGIT_LEAD.sub("", s)
        s = GREET.sub("", s)
        for nm in LEFTOVER_NAMES:
            s = strip_front(s, nm)
        s = MEDI_NODELIM.sub("", s)
        s = THX_REMN.sub("", s)
        if s == before:
            break
    s = DR_SIGN.sub("", s)
    s = WAS_STUB.sub("", s)
    s = DUP_CLOSER.sub(r"\1", s)
    return _recap(s)


df = pd.read_csv(BASE)
orig = df["Jawaban_Dokter"].astype(str)
new = orig.map(polish)
changed = new != orig

if PREVIEW:
    print("=== PREVIEW (tidak menulis) ===")
    for o, n in zip(orig[changed][:20], new[changed][:20]):
        print(f"  B: {o[:70]!r}")
        print(f"  A: {n[:70]!r}\n")
    print(f"akan ubah {int(changed.sum())} baris")
else:
    df["Jawaban_Dokter"] = new
    df = df[df["Jawaban_Dokter"].astype(str).str.len() > 0]
    df.to_csv(OUT, index=False, encoding="utf-8")
    print(f"[s6] polished {int(changed.sum())} baris -> {OUT} ({len(df)} rows)")
