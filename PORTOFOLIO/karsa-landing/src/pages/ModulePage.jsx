import { Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { ModuleObject } from '../three/ModuleObjects'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { STATUS_META } from '../data/modules'

/**
 * ============================================================
 * ModulePage — template reusable halaman tiap modul.
 *
 * Layout split (kiri konten, kanan visual 3D). Tanpa particle
 * field — di halaman kerja, fokus ke konten. Canvas kanan
 * ringan (satu objek), dan ikut mati animasinya saat
 * reduced-motion.
 *
 * TODO(backend): area "Konten modul" di bawah adalah tempat
 * fitur asli modul (form input, list, chart). Sambungkan ke
 * FastAPI lewat endpoint `module.api` — mis.:
 *   GET  {module.api}/summary   → quick status
 *   GET  {module.api}/items     → data utama modul
 *   POST {module.api}/items     → tambah entri baru
 * ============================================================
 */

export function ModulePage({ module: m }) {
  const { reduced } = useReducedMotion()

  const object = (
    <ModuleObject shape={m.shape} color={m.color} tint={m.color} active scale={1.4} reduced={reduced} />
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mx-auto max-w-6xl px-5 py-10"
    >
      {/* Breadcrumb */}
      <Link
        to="/"
        className="font-display text-lg text-paper-dim transition-colors hover:text-paper"
      >
        ← Home
      </Link>

      <div className="mt-4 grid items-start gap-10 lg:grid-cols-2">
        {/* ---------------- Kiri: konten fungsional ---------------- */}
        <div>
          <p className="font-display text-2xl" style={{ color: m.color }}>
            ✳ {m.tagline}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-bold uppercase leading-none tracking-tight sm:text-5xl">
              {m.name}
            </h1>
            <span
              className="rounded-full border px-3 py-1 font-display text-lg leading-none"
              style={{ borderColor: STATUS_META[m.status].color, color: STATUS_META[m.status].color }}
            >
              {STATUS_META[m.status].symbol} {STATUS_META[m.status].long}
            </span>
          </div>

          <p className="mt-4 max-w-lg text-paper-dim">{m.description}</p>

          {/* Quick status hari ini (dummy) */}
          <div
            className="sketchy-alt mt-6 border-2 p-4"
            style={{ borderColor: m.color, background: `${m.color}14` }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-paper-dim">
              status hari ini
            </p>
            {/* TODO(backend): GET {m.api}/summary */}
            <p className="mt-1 text-lg font-semibold">{m.quick.headline}</p>
            <p className="text-sm text-paper-dim">{m.quick.detail}</p>
          </div>

          {/* Area konten utama modul — masih placeholder */}
          <div className="mt-6 rounded-xl border-2 border-dashed border-paper/25 p-6 text-center">
            <p className="font-display text-2xl text-paper-dim">
              ✎ konten modul akan tampil di sini
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-paper-dim">
              {/* TODO(backend): sambungkan ke FastAPI */}
              Belum tersambung ke backend. Endpoint yang direncanakan:{' '}
              <code className="rounded bg-night-soft px-1.5 py-0.5 text-paper/80">
                {m.api}/items
              </code>
            </p>
          </div>

          {/* Yang sudah jalan di modul ini */}
          <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-paper-dim">
            yang sudah jalan
          </p>
          <ul className="mt-3 space-y-2.5">
            {m.features.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span className="font-display text-2xl leading-none" style={{ color: m.color }}>
                  ✓
                </span>
                <span className="text-paper/90">{f}</span>
              </li>
            ))}
          </ul>

          {/* Catatan dev + tech stack */}
          <p
            className="mt-7 max-w-lg border-l-2 pl-4 font-display text-xl leading-snug text-paper-dim"
            style={{ borderColor: m.color }}
          >
            “{m.note}”
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {m.tech.map((t) => (
              <span
                key={t}
                className="rounded-full border border-paper/25 px-3 py-1 text-sm text-paper/80"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ---------------- Kanan: visual 3D modul ---------------- */}
        <div
          className="sticky top-20 hidden h-105 transition-colors duration-700 lg:block"
          style={{
            background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${m.color}30 0%, transparent 70%)`,
          }}
        >
          <Canvas
            camera={{ position: [0, 0.2, 4.2], fov: 40 }}
            dpr={[1, 1.75]}
            frameloop={reduced ? 'demand' : 'always'}
            gl={{ antialias: true, alpha: true }}
            style={{ background: 'transparent' }}
          >
            <Suspense fallback={null}>
              {reduced ? (
                object
              ) : (
                <Float speed={1.8} rotationIntensity={0.35} floatIntensity={0.8}>
                  {object}
                </Float>
              )}
            </Suspense>
          </Canvas>
        </div>
      </div>
    </motion.div>
  )
}
