# Portfolio 3D Interaktif

Personal portfolio dengan scene 3D real-time — React + Vite + React Three Fiber + drei + Tailwind CSS v4 + Framer Motion. Semua objek 3D dibuat prosedural lewat code (tanpa asset eksternal), jadi ringan dan cepat dimuat.

## Menjalankan

```bash
npm install     # sekali saja
npm run dev     # buka http://localhost:5173
npm run build   # build produksi ke folder dist/
```

## ✏️ Yang perlu diisi manual

| File | Isi |
| --- | --- |
| `src/data/siteConfig.js` | Nama, role, bio, email, link sosial, **warna aksen**, daftar skill |
| `src/data/projects.js` | Daftar project (judul, kategori `dev/game/design`, deskripsi, tech stack, link demo/repo) |
| `index.html` | Judul tab & meta description |

Warna aksen cukup diganti di satu tempat (`siteConfig.accentColor`) — UI, objek 3D, dan bloom otomatis mengikuti.

## Struktur

```
src/
├── data/
│   ├── siteConfig.js      ← data pribadi (EDIT DI SINI)
│   └── projects.js        ← daftar project (EDIT DI SINI)
├── hooks/
│   ├── useScrollCamera.js ← sinkronisasi scroll ↔ pergerakan scene
│   └── useIsMobile.js     ← deteksi mobile untuk mode ringan
├── scene/                 ← semua yang dirender di dalam <Canvas>
│   ├── Scene.jsx          ← canvas utama, layout 3D per section, orbit controls
│   ├── HeroObject.jsx     ← centerpiece: torus knot + shell icosahedron wireframe
│   ├── ProjectCard3D.jsx  ← kartu project melayang (hover glow, klik → modal)
│   ├── ParticleField.jsx  ← partikel ambience latar
│   └── Effects.jsx        ← bloom + vignette + ACES tone mapping
└── ui/                    ← overlay HTML di atas canvas
    ├── Navbar.jsx, LoadingScreen.jsx, ProjectModal.jsx
    ├── SectionHero/About/Projects/Skills/Contact.jsx
    └── motion.js          ← preset animasi Framer Motion
```

## Menambah project baru

1. Tambahkan objek baru di array `projects` di `src/data/projects.js`.
2. Desktop memuat 3 kartu per baris; sampai 6 project tidak perlu mengubah apa pun.
   Lebih dari 6: besarkan `min-h` section di `src/ui/SectionProjects.jsx` dan
   sesuaikan posisi kartu di `getLayout()` (`src/scene/Scene.jsx`).

## Catatan teknis

- **Scroll ↔ 3D**: kamera diam; seluruh dunia 3D digeser mengikuti scroll (`ScrollRig`). Hasilnya sama seperti kamera bergerak antar section, tapi tetap kompatibel dengan OrbitControls.
- **Parallax berlapis** (terinspirasi landing page ilustratif): scene dibagi 4 lapisan kedalaman — hero object (terkuat, kontra kursor), lapisan tengah (burung + kartu + aksen), glow latar, dan partikel (searah kursor). Teks hero di DOM juga ikut bergeser halus (`useHeroParallax` di `SectionHero.jsx`). Faktor tiap lapisan bisa diubah di `ScrollRig` (`Scene.jsx`).
- **Ambient life**: kawanan "burung" geometris melintas pelan di hero (`FlyingFlock.jsx`) dan glow aksen yang bernapas di belakang centerpiece (`GlowBackdrop.jsx`).
- **Environment**: memakai `<Lightformer>` prosedural (tanpa internet). Ingin HDRI? Ganti dengan `<Environment preset="city" />` di `Scene.jsx` (butuh koneksi saat load).
- **Mobile**: partikel & detail geometri dikurangi, postprocessing dimatikan, orbit drag nonaktif agar scroll native lancar.
- **Ukuran teks kartu 3D**: jika terasa terlalu besar/kecil, ubah `distanceFactor` di `ProjectCard3D.jsx`.
