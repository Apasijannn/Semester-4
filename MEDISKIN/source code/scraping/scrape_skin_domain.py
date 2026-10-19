"""Scrape Alodokter komunitas, skin/dermatology categories only, ALL pages.

Unlike scraping_data.ipynb (general scraper capped at BATAS_HALAMAN=5 pages
per category), this walks every page of each skin category until Alodokter
returns an empty page or blocks the request -- the original run topped out
around ~75 Q&A per category purely because of that page cap.

Categories must stay in sync with CORE/BORDERLINE in
source code/cleaning/s7_filter_domain.py.

Produces, resumable at every stage (safe to stop and re-run):
  data/scraping/1_skin_kategori.csv   kategori slug -> URL kategori
  data/scraping/2_skin_pertanyaan.csv kategori, URL pertanyaan
  data/scraping/3_skin_dataset.csv    Poli_Tujuan, URL, Keluhan, Jawaban_Dokter

Run: python scrape_skin_domain.py [--include-borderline]
"""
import csv
import os
import random
import re
import sys
import time

import pandas as pd
import requests
from bs4 import BeautifulSoup

BASE_TOPIC_URL = "https://www.alodokter.com/komunitas/topic-tag/"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
SLEEP_RANGE = (3, 6)

OUT_DIR = "data/scraping"
F_KATEGORI = f"{OUT_DIR}/1_skin_kategori.csv"
F_LINKS = f"{OUT_DIR}/2_skin_pertanyaan.csv"
F_DATASET = f"{OUT_DIR}/3_skin_dataset.csv"

INCLUDE_BORDERLINE = "--include-borderline" in sys.argv

CORE = [
    "jerawat", "jerawat-batu", "jerawat-hormonal", "komedo", "komedo-putih",
    "folikulitis", "milia",
    "dermatitis", "dermatitis-atopik", "dermatitis-kontak",
    "dermatitis-kontak-iritan", "dermatitis-numularis", "dermatitis-seboroik",
    "dermatographia", "eksim", "alergi-kulit", "urtikaria", "biduran",
    "neurodermatitis", "iritasi-kulit", "ruam-kulit", "kulit-gatal",
    "infeksi-kulit", "jamur-kulit", "jamur-kuku", "kurap", "panu",
    "tinea-corporis", "kutu-air", "kudis", "kusta", "bisul", "kista-kulit",
    "kutil", "kutil-kelamin", "herpes", "herpes-labialis", "herpes-simpleks",
    "herpes-zoster", "herpes-genital", "kutu-rambut",
    "flek", "flek-hitam", "hiperpigmentasi", "keriput", "penuaan",
    "pemutihan-kulit", "bekas-luka", "kosmetik", "skin-care", "wajah",
    "selulitis",
    "kanker-kulit", "melanoma", "vitiligo", "bintik-kulit", "alopecia-areata",
    "kulit", "kulit-bersisik", "kulit-kering", "kulit-kelamin",
    "penyakit-kulit", "kesehatan-kulit", "kuku", "rambut", "rambut-rontok",
    "rambut-tumbuh-ke-dalam", "luka-bakar",
]
BORDERLINE = ["cacar-air", "cacar-monyet", "campak"]
SKIN_CATEGORIES = CORE + (BORDERLINE if INCLUDE_BORDERLINE else [])


def stage1_kategori():
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(F_KATEGORI, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Nama_Poli", "URL_Kategori"])
        for slug in SKIN_CATEGORIES:
            w.writerow([slug, BASE_TOPIC_URL + slug])
    print(f"[1] {len(SKIN_CATEGORIES)} kategori kulit -> {F_KATEGORI}")


def stage2_links():
    df_kat = pd.read_csv(F_KATEGORI)
    done = set()
    if os.path.exists(F_LINKS):
        done = set(pd.read_csv(F_LINKS)["URL_Pertanyaan"])
    else:
        with open(F_LINKS, "w", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow(["Kategori_Poli", "URL_Pertanyaan"])

    for _, row in df_kat.iterrows():
        slug, url_kategori = row["Nama_Poli"], row["URL_Kategori"]
        print(f"\n[2] kategori: {slug}")
        halaman = 1
        while True:
            url_target = url_kategori if halaman == 1 else f"{url_kategori}/page/{halaman}"
            print(f"    halaman {halaman}...", end=" ")
            time.sleep(random.uniform(*SLEEP_RANGE))
            try:
                resp = requests.get(url_target, headers=HEADERS, timeout=20)
            except Exception as e:
                print(f"error: {e}")
                break
            if resp.status_code != 200:
                print(f"stop (status {resp.status_code})")
                break
            kartu = BeautifulSoup(resp.text, "html.parser").find_all("card-topic")
            if not kartu:
                print("stop (halaman kosong)")
                break
            baru = 0
            with open(F_LINKS, "a", newline="", encoding="utf-8") as f:
                w = csv.writer(f)
                for k in kartu:
                    href = k.get("href")
                    if href:
                        full = "https://www.alodokter.com" + href
                        if full not in done:
                            w.writerow([slug, full])
                            done.add(full)
                            baru += 1
            print(f"+{baru} link baru")
            halaman += 1


def stage3_dataset():
    df_links = pd.read_csv(F_LINKS).drop_duplicates(subset=["URL_Pertanyaan"])
    done = set()
    if os.path.exists(F_DATASET):
        done = set(pd.read_csv(F_DATASET)["URL"].dropna())
    else:
        with open(F_DATASET, "w", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow(["Poli_Tujuan", "URL", "Keluhan", "Jawaban_Dokter"])

    sisa = df_links[~df_links["URL_Pertanyaan"].isin(done)].reset_index(drop=True)
    print(f"\n[3] {len(sisa)} pertanyaan tersisa dari {len(df_links)} total")

    for i, row in sisa.iterrows():
        kategori, url = row["Kategori_Poli"], row["URL_Pertanyaan"]
        print(f"    [{i + 1}/{len(sisa)}] {url}")
        time.sleep(random.uniform(*SLEEP_RANGE))
        try:
            resp = requests.get(url, headers=HEADERS, timeout=20)
            if resp.status_code != 200:
                print(f"        diblokir (status {resp.status_code}), jeda 15s")
                time.sleep(15)
                continue

            soup = BeautifulSoup(resp.text, "html.parser")
            el_k = soup.find("detail-topic")
            el_j = soup.find("doctor-topic")
            teks_keluhan = el_k.get("member-topic-content") if el_k else ""
            teks_jawaban = el_j.get("doctor-topic-content") if el_j else ""

            keluhan = str(teks_keluhan).replace("\\n", " ").replace("\\u003c", "<").replace("\\u003e", ">")
            keluhan = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", keluhan)).strip(' "')
            jawaban = str(teks_jawaban).replace("\\n", " ").replace("\\u003c", "<").replace("\\u003e", ">")
            jawaban = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", jawaban)).strip(' "')

            if keluhan and jawaban:
                with open(F_DATASET, "a", newline="", encoding="utf-8") as f:
                    csv.writer(f).writerow([kategori, url, keluhan, jawaban])
        except Exception as e:
            print(f"        error: {e}")


if __name__ == "__main__":
    # --resume: 1_skin_kategori.csv and 2_skin_pertanyaan.csv are already
    # complete from a previous run -- skip straight to stage 3.
    if "--resume" not in sys.argv:
        stage1_kategori()
        stage2_links()
    stage3_dataset()
