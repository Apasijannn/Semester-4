"""Re-scrape the suspected non-doctor rows, this time picking the REAL doctor reply.

Alodokter renders every reply (member AND doctor) with the same <doctor-topic> tag; the
original scraper took find('doctor-topic') = the FIRST reply, which on these pages is a
member reply. The true discriminator is the reply's role:
    doctor-title-small == "Dokter"   (members are "Anggota")
    or by-nicename starts with "dr-"/"drg-".

For each candidate URL this writes:
    Keluhan        = the question (detail-topic / member-topic-content)
    Jawaban_Dokter = the first DOCTOR reply's content  (empty if none)
    Jawaban_Lama   = the old (member) answer, for side-by-side validation
    status         = ok | no_doctor | http_xxx | err:<Type>

Run:  python scripts/rescrape_candidates.py   (~448 req, polite 3-5s delay -> ~30 min)
"""

import random
import re
import time

import pandas as pd
import requests
from bs4 import BeautifulSoup

IN = "non_doctor_candidates.csv"
OUT = "rescraped_candidates.csv"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                         "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"}


def unescape(s) -> str:
    s = str(s)
    s = re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), s)   # < -> <
    s = s.replace("\\n", " ").replace("\\t", " ").replace('\\"', '"').replace("\\/", "/")
    s = re.sub(r"<[^>]+>", " ", s)                                              # strip html tags
    return re.sub(r"\s+", " ", s).strip(' "')


def is_doctor(el) -> bool:
    # role tag is unreliable (some doctors are mistagged "Anggota"); the by-doctor name
    # carrying a "dr."/"drg." title is the robust signal.
    title = (el.get("doctor-title-small") or "").strip().lower()
    nic = (el.get("by-nicename") or "").lower()
    byd = (el.get("by-doctor") or "").strip().lower()
    return (title.startswith("dokter")
            or nic.startswith(("dr-", "drg-"))
            or byd.startswith(("dr.", "drg.", "dr ", "drg ")))


def scrape(url):
    r = requests.get(url, headers=HEADERS, timeout=20)
    if r.status_code != 200:
        return "", "", f"http_{r.status_code}"
    soup = BeautifulSoup(r.text, "html.parser")
    dt = soup.find("detail-topic")
    keluhan = unescape(dt.get("member-topic-content")) if dt else ""
    if dt and len(keluhan) < 10:                          # body broken/empty -> use the topic title
        keluhan = unescape(dt.get("member-topic-title")) or keluhan
    docs = [el for el in soup.find_all("doctor-topic") if is_doctor(el)]
    if not docs:
        return keluhan, "", "no_doctor"
    # a doctor's reply is often SPLIT across bubbles (bubble[0] = greeting only, content below);
    # join every doctor bubble so the full answer is captured, not just the first fragment.
    jawaban = " ".join(unescape(el.get("doctor-topic-content")) for el in docs).strip()
    return keluhan, jawaban, "ok"


def main():
    df = pd.read_csv(IN)
    rows = []
    for n, (_, row) in enumerate(df.iterrows(), 1):
        url = row["URL"]
        keluhan, jawaban, status = "", "", "err:unknown"
        for attempt in range(2):
            try:
                keluhan, jawaban, status = scrape(url)
                break
            except Exception as e:
                status = f"err:{type(e).__name__}"
                time.sleep(10)
        rows.append({
            "row_id": row["row_id"], "Poli_Tujuan": row["Poli_Tujuan"], "URL": url,
            "Keluhan": keluhan, "Jawaban_Dokter": jawaban,
            "Jawaban_Lama": row["Jawaban_Dokter"], "status": status,
        })
        print(f"[{n}/{len(df)}] {status:9s} {url.split('/topic/')[-1][:45]}")
        time.sleep(random.uniform(3, 5))

    out = pd.DataFrame(rows)
    out.to_csv(OUT, index=False, encoding="utf-8")
    print("\n=== status counts ===")
    print(out["status"].value_counts().to_string())
    print(f"\nwrote {OUT}")


if __name__ == "__main__":
    main()