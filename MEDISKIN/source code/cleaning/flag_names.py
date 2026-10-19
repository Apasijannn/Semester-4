import re

import pandas as pd
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory

SRC = "data/clean/s2_brand.csv"
OUT = "data/cleaning/name_candidates.csv"

DICT = {t for x in pd.read_csv("data/cleaning/dictionary_CSV.csv")["word"].dropna().astype(str)
        for t in re.findall(r"[a-z]+", x.lower())}
MED = {w.lower() for fn in ("data/raw/obat_list.txt", "data/raw/penyakit_list.txt",
                            "data/raw/drug_en_list.txt", "data/raw/disease_en_list.txt")
       for ln in open(fn, encoding="utf-8") for w in re.findall(r"[A-Za-z]{3,}", ln)}
VOCAB = DICT | MED
_stem = StemmerFactory().create_stemmer()
FORCE_NAME = {"agung", "jaya", "berkah", "wahyu", "teguh", "erik", "dayat", "kastiwa", "dina",
              "wanda", "ana", "siti", "arif", "hana", "anggun", "shepty", "ruruh", "arie", "indra",
              "nur", "dicky", "adam", "bagus", "bagas", "imam", "alex", "riski", "andri", "nona",
              "diyah", "sudi"}
_LET = "abcdefghijklmnopqrstuvwxyz"
_cache: dict = {}


def _edits1(w):
    sp = [(w[:i], w[i:]) for i in range(len(w) + 1)]
    return ([a + b[1:] for a, b in sp if b]
            + [a + c + b[1:] for a, b in sp if b for c in _LET]
            + [a + b[1] + b[0] + b[2:] for a, b in sp if len(b) > 1])


def known(w: str) -> bool:
    wl = w.lower()
    if wl in FORCE_NAME:
        return False
    if wl not in _cache:
        _cache[wl] = (wl in VOCAB
                      or (len(wl) >= 5 and any(e in MED for e in _edits1(wl)))
                      or _stem.stem(wl) in DICT)
    return _cache[wl]


_STOP = re.compile(r"(?i)^(?:terima|terimak\w*|trima\w*|kasih|makasih|tengkyu|thank|atas|pertany\w*|salam\w*|dok\w*|maaf)$")


def _capture(words) -> str:
    name = []
    for i, w in enumerate(words):
        if len(w) >= 2 and w.isupper():
            break
        if i > 0 and (known(w) or _STOP.match(w)):
            break
        name.append(w)
    return " ".join(name)


GREETS = (r"(?:assalam\w*|wa\w*alaikum\w*salam\w*|warahmatullah\w*|wabarakatuh\w*|wr\.?\s*wb\.?"
          r"|hal+o+|haii*|hai|hi|dear|selamat\s+(?:pagi|siang|sore|malam|datang))")
GREET1 = re.compile(r"(?i)^(?:" + GREETS + r"[\s,.!]*)+")
THX_AHEAD = re.compile(r"(?i)^(?:terima\s?kas?\w*|terimaks\w*|trima\s?kas?\w*|trimaks\w*|makasih|tengkyu|thank|atas\b)")
_NAMETOK = r"[A-Z][A-Za-z]+\d*"
LEAD = re.compile(r"((?:" + _NAMETOK + r"\s*){1,4})")
DR = re.compile(r"(?i)(?:saya|salam|perkenalkan\s+saya)\s*,?\s*(?:dr|drg)\.?\s+"
                r"([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4})")
DR_END = re.compile(r"(?i)(?:dr|drg)\.?\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4})\s*$")
TITLE = re.compile(r"(?i)^(?:tn|ny|sdri?|nn)\.?\s+")
TN_MID = re.compile(r"(?i)\btn\.?\s+(" + _NAMETOK + r"(?:\s+" + _NAMETOK + r"){0,3})")
ANAK_MID = re.compile(r"(?i)\banak\s+(" + _NAMETOK + r"(?:\s+" + _NAMETOK + r"){0,3})")


def _trigger_name(rx, s: str, prefix: str = "") -> str:
    m = rx.search(str(s))
    if not m:
        return ""
    toks = re.findall(_NAMETOK, m.group(1))
    if (not toks or known(toks[0]) or len(toks[0]) < 3
            or toks[0].isupper() or _STOP.match(toks[0])):
        return ""
    cap = _capture(toks)
    return (prefix + cap) if cap else ""


def patient_name(ans: str):
    s = str(ans)
    m = GREET1.match(s)
    if not m:
        return "", False
    rest = s[m.end():]
    mt = TITLE.match(rest)
    if mt:
        rest = rest[mt.end():]
    if THX_AHEAD.match(rest):
        return "", False
    mw = LEAD.match(rest)
    if not mw:
        return "", False
    name = _capture(re.findall(_NAMETOK, mw.group(1)))
    if not name:
        return "", False
    first = name.split()[0]
    if _STOP.match(first):
        return "", False
    after = re.match(r"^\s*" + r"\s+".join(re.escape(w) for w in name.split()), rest)
    tail = rest[after.end():].lstrip() if after else ""
    strong = bool(re.match(r"[,.!]", tail) or THX_AHEAD.match(tail))
    if known(first):
        tnext = tail.lstrip(" ,.!")
        return name, bool(THX_AHEAD.match(tnext))
    return name, strong


def doctor_name(ans: str) -> str:
    s = str(ans)
    m = DR.search(s) or DR_END.search(s)
    if not m:
        return ""
    return _capture(re.findall(r"[A-Z][A-Za-z]+", m.group(1))[:4])


def strip_front(text: str, name: str) -> str:
    name = str(name).strip()
    if not name or name.lower() == "nan":
        return text
    new = re.sub(r"^" + re.escape(name) + r"(?![A-Za-z])[\s,.!]*", "", str(text)).strip()
    if new and new != text:
        return new[:1].upper() + new[1:]
    return text


def main():
    df = pd.read_csv(SRC)
    pn = df["Jawaban_Dokter"].map(patient_name)
    gn = pn.map(lambda t: t[0])
    strong = pn.map(lambda t: t[1])
    dn = df["Jawaban_Dokter"].map(doctor_name)
    tnn = df["Jawaban_Dokter"].map(lambda s: _trigger_name(TN_MID, s))
    akn = df["Jawaban_Dokter"].map(lambda s: _trigger_name(ANAK_MID, s, "anak "))
    has_g, has_d = gn.str.len() > 0, dn.str.len() > 0
    has_tn, has_ak = tnn.str.len() > 0, akn.str.len() > 0
    mask = has_g | has_d | has_tn | has_ak

    nk = gn.map(lambda x: known(x.split()[0]) if x else False)
    keep = (has_g & strong).astype(int)
    out = pd.DataFrame({
        "rid": df["rid"], "keep": keep,
        "Poli_Tujuan": df["Poli_Tujuan"], "URL": df["URL"],
        "guess_name": gn, "name_known": nk, "doctor_name": dn,
        "tn_name": tnn, "anak_name": akn,
        "Keluhan": df["Keluhan"], "Jawaban_Dokter": df["Jawaban_Dokter"],
    })[mask].reset_index(drop=True)
    out.to_csv(OUT, index=False, encoding="utf-8")

    print(f"{len(out)} baris dgn nama -> {OUT}")
    print(f"  pasien: {int(has_g.sum())} (strong/berpembatas {int((has_g & strong).sum())}) | dokter: {int(has_d.sum())}")
    print(f"  mid-text (review): tn {int(has_tn.sum())} | anak {int(has_ak.sum())}")
    print(f"  keep=1 (dibuang): {int((out.keep==1).sum())} | keep=0 (ambigu, dijaga): {int((out.keep==0).sum())}")


if __name__ == "__main__":
    main()
