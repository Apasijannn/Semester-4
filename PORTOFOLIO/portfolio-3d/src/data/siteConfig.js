// ============================================================
// ✏️ DATA PRIBADI — edit semua nilai di file ini sesuai profilmu.
// Satu-satunya tempat untuk nama, bio, kontak, warna aksen, dan skill.
// ============================================================

export const siteConfig = {
  // ✏️ Nama & peran yang tampil di Hero
  name: 'Ghazanfar Latief',
  shortName: 'GL', // dipakai sebagai logo di navbar & loading screen
  role: 'Software Developer · Game Developer · UI/UX Designer',
  tagline:
    'I build software, games, and interfaces — crafted with equal care for logic and aesthetics.',

  // ✏️ Bio untuk section About (tiap string = satu paragraf)
  bio: [
    "I'm a multidisciplinary creator working across software development, game development, and UI/UX design. I enjoy the space where engineering meets craft — building things that work reliably and feel effortless to use.",
    'Currently studying and shipping projects that span the web, playable experiences, and design systems. This portfolio itself is one of them: a hand-built 3D space rendered in real time in your browser.',
  ],

  // ✏️ Highlight singkat yang tampil di bawah bio
  highlights: [
    { label: 'Focus', value: 'Web · Games · Design' },
    { label: 'Based in', value: 'Indonesia' },
    { label: 'Status', value: 'Open for collaboration' },
  ],

  // ✏️ Kontak & sosial media — ganti "username" dengan akunmu
  email: 'ghazanfarlatief6@gmail.com',
  socials: [
    { label: 'GitHub', url: 'https://github.com/username' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/username' },
    { label: 'Instagram', url: 'https://instagram.com/username' },
  ],

  // ✏️ Warna aksen tunggal — dipakai oleh UI, objek 3D, dan bloom sekaligus.
  //    Alternatif elegan: '#3E6DE0' (deep blue), '#B4833E' (bronze), '#7A9E7E' (sage)
  accentColor: '#C8A15B',

  // ✏️ Skill / tech stack per kelompok (tampil di section Skills)
  skills: [
    {
      group: 'Software & Web',
      items: ['JavaScript / TypeScript', 'React', 'Node.js', 'Python', 'REST API', 'SQL'],
    },
    {
      group: 'Game Development',
      items: ['Unity', 'C#', 'Godot', 'Game Design', 'Three.js / WebGL'],
    },
    {
      group: 'Design & UI/UX',
      items: ['Figma', 'Wireframing', 'Prototyping', 'Design Systems', 'Typography'],
    },
  ],
}
