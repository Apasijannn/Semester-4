import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TechNotes } from '../components/TechNotes'
import { RoadmapSection } from '../components/RoadmapSection'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { USER } from '../data/user'

/**
 * ============================================================
 * SettingsPage — preferensi app + catatan referensi pribadi.
 *
 * - Toggle animasi 3D (reduced motion) — sama dengan tombol
 *   di navbar, tapi dengan penjelasan.
 * - Tech Stack & Notes: catatan arsitektur (referensi pribadi)
 * - Status Pengembangan: progress semua modul + yang direncanakan
 * ============================================================
 */

export function SettingsPage() {
  const { reduced, toggle } = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mx-auto max-w-6xl px-5 py-10"
    >
      <Link
        to="/"
        className="font-display text-lg text-paper-dim transition-colors hover:text-paper"
      >
        ← Home
      </Link>

      <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Settings</h1>

      {/* ---------------- Preferensi ---------------- */}
      <div className="mt-8 max-w-2xl space-y-4">
        {/* Toggle animasi 3D */}
        <div className="sketchy flex items-center justify-between gap-4 border-2 border-paper/25 p-5">
          <div>
            <p className="font-semibold">Animasi 3D</p>
            <p className="mt-1 text-sm text-paper-dim">
              Matikan untuk pemakaian harian yang ringan: scene tetap tampil tapi
              statis (tanpa render loop), hemat baterai & nyaman di device pelan.
            </p>
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-pressed={!reduced}
            className={`sketchy-alt shrink-0 border-2 px-5 py-2 font-display text-xl transition-colors ${
              reduced
                ? 'border-paper/40 text-paper-dim'
                : 'border-mod-health bg-mod-health/15 text-mod-health'
            }`}
          >
            {reduced ? '◦ mati' : '✦ nyala'}
          </button>
        </div>

        {/* Profil singkat */}
        <div className="sketchy flex items-center justify-between gap-4 border-2 border-paper/25 p-5">
          <div>
            <p className="font-semibold">Nama panggilan</p>
            <p className="mt-1 text-sm text-paper-dim">
              Dipakai untuk greeting di Home.{' '}
              {/* TODO(backend): ambil dari Supabase Auth, edit di src/data/user.js */}
              Untuk sekarang diubah manual di <code className="rounded bg-night-soft px-1.5 py-0.5">src/data/user.js</code>.
            </p>
          </div>
          <p className="font-display text-2xl" style={{ color: '#f2d785' }}>
            {USER.name}
          </p>
        </div>
      </div>

      {/* ---------------- Catatan referensi pribadi ---------------- */}
      <TechNotes />
      <RoadmapSection />
    </motion.div>
  )
}
