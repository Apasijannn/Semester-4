import re

import ftfy

EMOJI = re.compile("[" "\U0001F300-\U0001FAFF" "\U00002600-\U000027BF" "\U0001F1E6-\U0001F1FF" "\U00002B00-\U00002BFF" "]")

_G = (r"(?i:assalam[\w']*|wa[\w']*alaikum[\w']*salam[\w']*|walaikum[\w']*salam[\w']*"
      r"|warahmatullah\w*|wabarakatuh\w*|wr\.?\s*wb\.?"
      r"|hal+o+|haii*|hai|hi|dear|salam(?:\s+(?:sehat|hangat|sejahtera|kenal))?"
      r"|selamat\s+(?:pagi|siang|sore|malam|datang))")
NAME = r"[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3}"
_THX_ANCHOR = r"(?i:terima\s?ka\w+|makasih|atas\s+pertany|(?:telah|sudah)\s+(?:bertanya|menghubungi))"
SPEC = (r"(?i:spesialis|sp\b|umum|gigi|anak|kandungan|kulit|mata|tht|penyakit|jiwa|saraf"
        r"|bedah|jantung|paru|dalam|kelamin|gizi|obgyn|radiologi)")

SALAAM = re.compile(r"^\s*(?i:assalam[\w']*|wa[\w']*alaikum[\w']*salam\w*|warahmatullah\w*|wabarakatuh\w*|wr\.?\s*wb\.?)[\s.,]*")
GREET_NAME = re.compile(r"^\s*" + _G + r"\s+(?:" + NAME + r")\s*[,.!]\s*")
GREET = re.compile(r"^\s*" + _G + r"\b[\s.,!]*")
NAME_YANGBAIK = re.compile(r"^\s*(?:" + NAME + r")\s+(?i:yang\s+baik)\s*[,.!]+\s*")
NAME_THX = re.compile(r"^\s*[A-Za-z]+(?:\s+[A-Za-z]+){0,4}[\s,.!]+(?=" + _THX_ANCHOR + r")")
THANKS = re.compile(r"^\s*(?i:terima\s?ka\w+|makasih)\b[^.]{0,60}?\b(?i:pertany\w+|medi)\b[\s.,!]*")
THANKS2 = re.compile(r"^\s*(?i:atas\s+pertany\w+|(?:telah|sudah)\s+(?:bertanya|menghubungi)\w*[^.]{0,40}?\bmedi\b)[\s.,!]*")
PERTANY_FRAG = re.compile(r"^\s*(?i:pertany\w*nya)[,.]\s+")
DR_INTRO = re.compile(r"^\s*(?i:(?:perkenalkan[,\s]+)?saya\s+(?:dr|drg)\.?\s+)" + NAME + r"\b[\s,.]*")
_OPENER_SEQ = [SALAAM, GREET_NAME, NAME_YANGBAIK, GREET, NAME_THX, THANKS, THANKS2, PERTANY_FRAG, DR_INTRO]

SIGNOFF = re.compile(
    r"(?:"
    + r"[\s,.!]*(?i:(?:dan\s+)?salam[\s,]*(?:sehat|hangat|kenal)?[\s,]*(?:medi)?)[,.!]*"
    + r"|[\s,.!]*(?i:(?:salam[\s,]*)?(?:dr|drg)\.?\s+)(?!" + SPEC + r")" + NAME + r"[,.!]*"
    + r")+\s*$"
)

PRONOUN = re.compile(r"(?i)\b(?:saya|aku|kami)\b")


def base_clean(s) -> str:
    s = ftfy.fix_text(str(s))
    s = s.replace("­", "").replace("Â", "").replace("�", "")
    s = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", "", s)
    s = re.sub(r"https?://\S+", " ", s)
    s = EMOJI.sub("", s)
    s = re.sub(r"\bAblasio\b", "Ablasi", s)
    s = re.sub(r"\bablasio\b", "ablasi", s)
    return re.sub(r"\s+", " ", s).strip()


def normalize_brand(s) -> str:
    s = re.sub(r"\w*alodokter\w*(?:\.[a-z]{2,3})*", "Medi", str(s), flags=re.I)
    s = re.sub(r"\balo\b", "Halo", s, flags=re.I)
    return s


def strip_opener(s) -> str:
    s = str(s)
    prev = None
    while s != prev:
        prev = s
        for pat in _OPENER_SEQ:
            s = pat.sub("", s, count=1)
        s = s.strip()
    s = re.sub(r"^[\s,.!:;]+", "", s)
    return (s[:1].upper() + s[1:]) if s else s


def strip_closer(s) -> str:
    s = str(s)
    prev = None
    while s != prev:
        prev = s
        s = SIGNOFF.sub("", s, count=1).strip()
    return (s[:1].upper() + s[1:]) if s else s


def pronoun_to_medi(s) -> str:
    return PRONOUN.sub("Medi", str(s))
