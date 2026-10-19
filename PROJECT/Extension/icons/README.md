# Icons

Letakkan file icon di folder ini agar extension memiliki ikon yang benar:

- `icon-128.png` — 128x128 px (wajib, dipakai di `manifest.json` dan notifikasi)

Opsional, untuk tampilan lebih rapi di berbagai ukuran toolbar:

- `icon-16.png` — 16x16 px
- `icon-48.png` — 48x48 px

Jika hanya menyediakan `icon-128.png`, extension tetap berjalan normal karena
`manifest.json` saat ini hanya mereferensikan ukuran 128px.
