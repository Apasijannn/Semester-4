// ============================================================
// ✏️ DAFTAR PROJECT — tambah/edit project di array `projects`.
//
// Tiap project:
//   id          : string unik
//   title       : judul project
//   category    : 'dev' | 'game' | 'design'  (menentukan label + glyph 3D di kartu)
//   year        : tahun (string, boleh dikosongkan dengan null)
//   description : deskripsi singkat (tampil di kartu 3D + modal detail)
//   techStack   : array nama teknologi
//   demoUrl     : link demo (null jika tidak ada)
//   repoUrl     : link repository (null jika tidak ada)
//
// Catatan layout: grid 3D di desktop memuat 3 kartu per baris.
// Jika project lebih dari 6, tambah tinggi section di SectionProjects.jsx
// (min-h) supaya ada ruang scroll untuk baris tambahan.
// ============================================================

export const CATEGORY_META = {
  dev: { label: 'Software / Web' },
  game: { label: 'Game Dev' },
  design: { label: 'UI/UX Design' },
}

export const projects = [
  {
    id: 'inventory-app',
    title: 'Inventory Manager',
    category: 'dev',
    year: '2025',
    description:
      'Full-stack web app for tracking stock, suppliers, and purchase orders with role-based access.',
    techStack: ['React', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
    demoUrl: 'https://example.com', // ✏️ ganti dengan link demo asli
    repoUrl: 'https://github.com/username/repo', // ✏️ ganti dengan link repo asli
  },
  {
    id: 'campus-api',
    title: 'Campus Events API',
    category: 'dev',
    year: '2025',
    description:
      'REST API powering a campus event platform — auth, scheduling, and real-time notifications.',
    techStack: ['Node.js', 'Express', 'MongoDB', 'Socket.IO'],
    demoUrl: null,
    repoUrl: 'https://github.com/username/repo',
  },
  {
    id: 'dungeon-crawler',
    title: 'Ashen Depths',
    category: 'game',
    year: '2024',
    description:
      'A 2D roguelike dungeon crawler with procedural levels, built for a game jam in 72 hours.',
    techStack: ['Unity', 'C#', 'Aseprite'],
    demoUrl: 'https://username.itch.io/game', // ✏️ link itch.io / demo playable
    repoUrl: 'https://github.com/username/repo',
  },
  {
    id: 'rhythm-runner',
    title: 'Pulse Runner',
    category: 'game',
    year: '2025',
    description:
      'Endless runner where obstacles sync to the beat of the music. Custom audio-analysis system.',
    techStack: ['Godot', 'GDScript'],
    demoUrl: null,
    repoUrl: 'https://github.com/username/repo',
  },
  {
    id: 'finance-app-ui',
    title: 'Ledger — Finance App',
    category: 'design',
    year: '2025',
    description:
      'End-to-end UI/UX case study for a personal finance app: research, wireframes, and hi-fi prototype.',
    techStack: ['Figma', 'Design System', 'Prototyping'],
    demoUrl: 'https://figma.com/@username', // ✏️ link Figma / Behance / Dribbble
    repoUrl: null,
  },
  {
    id: 'coffee-brand',
    title: 'Kopi Senja Rebrand',
    category: 'design',
    year: '2024',
    description:
      'Visual identity and landing page redesign for a local coffee brand — typography-first direction.',
    techStack: ['Figma', 'Illustrator', 'Webflow'],
    demoUrl: 'https://example.com',
    repoUrl: null,
  },
]
