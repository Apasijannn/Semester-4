# DOMUS — Smart Home Dashboard

Aplikasi web simulasi Smart Home berbasis antarmuka **switch scanning** untuk pengguna dengan keterbatasan motorik. Dibangun sebagai implementasi dari prototype Figma untuk mata kuliah Interaksi Manusia dan Komputer (IMK).

## Demo

> Deploy via GitHub Pages — tambahkan URL di sini setelah deploy.

## Fitur

- **Auto-scanning** — sistem secara otomatis berpindah fokus antar tombol setiap 2 detik
- **Switch selection** — pengguna menekan `Space` atau `Enter` untuk memilih tombol yang sedang difokus
- **SVG ring indicator** — ring progress mengisi penuh selama 2 detik pada tombol yang sedang di-scan
- **8 layar** — Dashboard, AC Controls, Lamp Controls, Door Controls, TV Controls, Volume, Channel, Success
- **Responsive landscape** — kompatibel dengan tablet dalam orientasi landscape
- **Dark theme** — antarmuka gelap dengan aksen kuning (#CCFF00)

## Layar

| Layar | Fungsi |
|---|---|
| Dashboard | Navigasi ke semua perangkat |
| AC Controls | ON/OFF, Temp Up, Temp Down |
| Lamp Controls | ON/OFF |
| Door Controls | Lock, Unlock |
| TV Controls | ON/OFF, navigasi ke Volume & Channel |
| Volume | Volume Up, Volume Down |
| Channel | Next / Prev Channel |
| Success | Konfirmasi aksi berhasil (auto-redirect 1.8 detik) |

## Teknologi

- HTML5
- CSS3 (Grid, Custom Properties, SVG animation)
- Vanilla JavaScript (ES6)
- [Bootstrap Icons 1.11.3](https://icons.getbootstrap.com/)

Tidak menggunakan framework apapun — pure HTML/CSS/JS.

## Cara Menjalankan Secara Lokal

Cukup buka file `index.html` di browser. Tidak ada build step atau dependency yang perlu diinstall.

```
index.html   ← buka file ini
```

## Cara Menggunakan

1. Aplikasi otomatis mulai **men-scan** tombol dari kiri ke kanan, atas ke bawah
2. Perhatikan ring kuning yang mengisi pada tombol yang sedang difokus
3. Tekan **Space** atau **Enter** saat tombol yang diinginkan sedang aktif untuk memilihnya
4. Layar Success akan muncul sebentar, lalu kembali ke layar kontrol

## Struktur File

```
├── index.html      # Semua layar (SPA — 8 div.screen)
├── style.css       # Styling, grid layout, animasi ring
├── app.js          # Logic auto-scan, state perangkat, navigasi
└── .nojekyll       # Diperlukan agar GitHub Pages tidak menjalankan Jekyll
```

## Desain

Prototype dibuat di Figma oleh tim sebagai bagian dari tugas akhir mata kuliah IMK Semester 4.
