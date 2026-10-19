/**
 * ============================================================
 * DATA MODUL KARSA — main UI aplikasi.
 *
 * >>> SESUAIKAN di sini: nama, route, quick status (dummy),
 * >>> endpoint API, status pengembangan, dan tech stack. <<<
 * Warna `color` harus sinkron dengan token --color-mod-* di
 * src/index.css agar UI Tailwind & scene 3D senada.
 *
 * `quick` = ringkasan cepat di Home Dashboard — SAAT INI DUMMY.
 * TODO(backend): ganti dengan fetch ke endpoint `api` tiap modul
 * (FastAPI), mis. GET {api}/summary → { headline, detail }.
 *
 * Menambah modul baru = tambah 1 objek ke MODULES (route ikut
 * terdaftar otomatis di App.jsx & Navbar) + bentuk 3D baru di
 * src/three/ModuleObjects.jsx (property `shape`).
 * ============================================================
 */

export const MODULES = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    short: 'Ringkasan',
    route: '/dashboard-detail',
    api: '/api/dashboard', // TODO(backend): endpoint FastAPI modul ini
    tagline: 'Semua modul, satu ringkasan.',
    description:
      'Ringkasan lintas-modul: agenda hari ini, kondisi badan, posisi keuangan, dan rutinitas yang belum dicatat.',
    quick: { headline: 'Hari cukup lancar', detail: '2 hal butuh perhatian hari ini' },
    features: [
      'Ringkasan harian lintas-modul, disusun otomatis',
      'Widget yang bisa disusun ulang',
      'Insight korelasi antar-modul (tidur vs produktivitas)',
    ],
    status: 'dikerjakan',
    note: 'Sedang refactor layout widget — versi grid statis sudah jalan, versi drag-and-drop masih setengah jadi.',
    tech: ['React + Vite', 'Supabase Realtime', 'Recharts'],
    color: '#efdfbe', // pastel netral/cream
    shape: 'dashboard',
  },
  {
    id: 'health',
    name: 'Health Manager',
    short: 'Health',
    route: '/health',
    api: '/api/health', // TODO(backend): endpoint FastAPI modul ini
    tagline: 'Tidur, air, gerak, mood.',
    description:
      'Pencatat tidur, hidrasi, olahraga, dan mood harian — dengan saran kebiasaan kecil dari pola datamu sendiri.',
    quick: { headline: 'Tidur 7j 20m semalam', detail: 'air 3/8 gelas · belum olahraga' },
    features: [
      'Tracking tidur, hidrasi, dan aktivitas harian',
      'Saran kebiasaan mikro dari pola data sendiri',
      'Pengingat yang lembut, bukan alarm yang menghakimi',
    ],
    status: 'selesai',
    note: 'v1 stabil dan dipakai harian. Skema datanya jadi acuan modul-modul berikutnya.',
    tech: ['FastAPI', 'Supabase (Postgres)', 'Pandas'],
    color: '#b5e0c4', // pastel hijau/mint
    shape: 'heart',
  },
  {
    id: 'finance',
    name: 'Finance Manager',
    short: 'Finance',
    route: '/finance',
    api: '/api/finance', // TODO(backend): endpoint FastAPI modul ini
    tagline: 'Catatan uang tanpa drama.',
    description:
      'Pencatat pengeluaran dengan kategorisasi otomatis via agent, amplop budget bulanan, dan proyeksi saldo.',
    quick: { headline: '3 transaksi belum dikategorikan', detail: 'budget makan sisa 46%' },
    features: [
      'Kategorisasi pengeluaran otomatis via agent AI',
      'Amplop budget bulanan sederhana',
      'Proyeksi saldo sampai akhir bulan',
    ],
    status: 'selesai',
    note: 'v1 jalan. Akurasi kategorisasi masih ~sedang — mau diberi few-shot examples dari koreksian sendiri.',
    tech: ['FastAPI', 'LangGraph', 'Supabase (Postgres)'],
    color: '#f2d785', // pastel kuning/emas
    shape: 'coins',
  },
  {
    id: 'tasks',
    name: 'Task Manager',
    short: 'Tasks',
    route: '/tasks',
    api: '/api/tasks', // TODO(backend): endpoint FastAPI modul ini
    tagline: 'Prioritas hari ini.',
    description:
      'To-do list yang paham prioritas: tugas besar dipecah agent jadi langkah kecil, lalu dijadwalkan di sela waktumu.',
    quick: { headline: '5 task pending', detail: 'deadline terdekat: Laporan PBO · 19.00' },
    features: [
      'Pemecahan tugas besar jadi sub-langkah (agent)',
      'Penjadwalan di sela slot kosong kalender',
      'Mode fokus pomodoro sederhana',
    ],
    status: 'dikerjakan',
    note: 'Graph dekomposisi tugas sudah jalan; sinkronisasi dua-arah Google Calendar masih bermasalah di edge case.',
    tech: ['FastAPI', 'LangGraph', 'Google Calendar API'],
    color: '#a9c7e8', // pastel biru
    shape: 'checklist',
  },
  {
    id: 'skincare',
    name: 'Skincare AI',
    short: 'Skincare',
    route: '/skincare',
    api: '/api/skincare', // TODO(backend): endpoint FastAPI modul ini
    tagline: 'Rutinitas AM/PM terpandu.',
    description:
      'Analisis kondisi kulit dari foto, penyusun rutinitas AM/PM dari produk yang ada, dan cek konflik kandungan.',
    quick: { headline: 'Rutinitas malam belum dicatat', detail: 'reapply sunscreen 3 jam lalu' },
    features: [
      'Prototipe analisis kulit dari foto (vision model)',
      'Penyusun rutinitas AM/PM dari daftar produk',
      'Cek konflik kandungan antar-produk',
    ],
    status: 'dikerjakan',
    note: 'Prototipe notebook menjanjikan; belum diangkat jadi service. Deteksi konflik masih tabel aturan manual.',
    tech: ['FastAPI', 'Claude API (vision)', 'Supabase'],
    color: '#eec5cf', // pastel sage/pink
    shape: 'jar',
  },
]

/**
 * Modul yang BELUM dibangun — tampil di halaman Settings
 * (Status Pengembangan). >>> Tambah ide modul berikutnya di sini. <<<
 */
export const PLANNED_MODULES = [
  {
    id: 'fitness',
    name: 'Fitness Assistant',
    description:
      'Rencana: program latihan adaptif yang membaca data Health Manager — menyesuaikan intensitas dengan kualitas tidur & jadwal.',
    status: 'rencana',
    color: '#c9b8e8',
  },
]

/* Meta tampilan untuk tiap status pengembangan.
   `label` = badge pendek di card; `long` = keterangan di settings/detail */
export const STATUS_META = {
  selesai: { label: 'selesai', long: 'selesai · dipakai harian', symbol: '✓', color: '#b5e0c4' },
  dikerjakan: { label: 'dikerjakan', long: 'sedang dikerjakan', symbol: '~', color: '#f2d785' },
  rencana: { label: 'rencana', long: 'direncanakan', symbol: '◌', color: '#cfc5ab' },
}

/* Warna dasar scene — dipakai beberapa komponen 3D */
export const BASE_COLORS = {
  ink: '#241e15',
  paper: '#f6efdd',
  night: '#171410',
}
