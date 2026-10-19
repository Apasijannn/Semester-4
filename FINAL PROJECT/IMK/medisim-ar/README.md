# MediSim AR

An AR glasses medical simulation app with AI assistant **Medi AI**.  
Designed for landscape wide-FOV AR headsets (HoloLens / Vision Pro style).

Built with **React + Vite · Tailwind CSS v4 · Framer Motion · Three.js**

---

## Screens

| Screen | Figma Node | Description |
|--------|------------|-------------|
| Splash | 436:3075 | Room background, holographic card, Start |
| Scanning | 465:1688 | AR dot-grid surface scan with progress |
| Surface Detected | 449:626 | Surface lock ring, tap to place patient |
| Domain Selection | 449:1022 | 3 horizontal domain cards (landscape) |
| Vital Signs Entry | 436:3092 | Domain entry card |
| Vital Signs Step 1–3 | 449:657–452:809 | HR → BP → Temp |
| Vital Signs Complete | 452:906 | Results + confetti |
| Wound Care Entry | 471:1236 | Domain entry card |
| Wound Care Step 1–3 | 452:1014–452:1558 | Irrigate → Antiseptic → Dress |
| Wound Care Complete | 452:1903 | Results + confetti |
| IV Line Entry | 471:1302 | Domain entry card |
| IV Line Step 1–3 | 459:1981–462:1363 | Tourniquet → Insert → Secure |
| IV Line Complete | 462:1571 | Results + confetti |

---

## Patient

**Zidan · 25y · Male**

| Domain | Complaint |
|--------|-----------|
| Vital Signs | Chest tightness and mild shortness of breath after physical activity |
| Wound Care | Laceration on the left forearm from a sharp object |
| IV Line | Collapsed during marathon — severe heat exhaustion and acute dehydration |

---

## AR Glasses Layout (landscape 874 × 402 px)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Patient Info] │ ◄ Domain      [Timer] │  ← AR canvas + patient body → │ [Medi AI] │
│  narrow 150px  │                       │                                │  tall 188 │
│                │         [Center-right vitals/wound/iv panel]           │           │
│                │  [Step Panel: instruction + Back/Next]                 │           │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in a browser at **874 × 402** (landscape).

> **Tip**: Use Chrome DevTools → set device to custom 874 × 402 for the AR headset view.

---

## Build

```bash
npm run build
```

---

## Deploy to GitHub Pages

1. Create a GitHub repo, push this project.
2. Run:
   ```bash
   npm run deploy
   ```
3. Your app will be live at `https://<username>.github.io/medisim-ar/`

> The `vite.config.js` sets `base: '/medisim-ar/'` for correct asset paths.  
> The `package.json` has `predeploy` and `deploy` scripts using `gh-pages`.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 19 + Vite 8 | UI framework + dev server |
| Tailwind CSS v4 | Utility styling |
| Framer Motion | Panel animations, transitions |
| Three.js | 3D patient body + AR highlight ring |
| canvas-confetti | Completion screen confetti burst |
| gh-pages | GitHub Pages deployment |
| Google Fonts (Inter) | Typography |

---

## Asset Sources

| Asset | Source |
|-------|--------|
| Hospital room background | Unsplash (permanent CDN URL) |
| Patient body overlay | Figma MCP asset (7-day CDN) |
| Equipment images | Figma MCP asset (7-day CDN) |
| 3D patient mesh | Three.js (inline, no external) |

---

*MediSim AR · Educational Medical Training · v2.4*
