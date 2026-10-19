import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * ============================================================
 * LoadingScreen — boot state app, bertema hand-drawn:
 * progress bar berupa garis sketsa yang "digambar" progresif
 * (stroke-dashoffset mengikuti progress).
 *
 * Dibuat singkat (±1 detik) karena ini app harian, bukan
 * landing page — cukup untuk WebGL warm-up. Semua aset 3D
 * prosedural, tidak ada file model/texture yang diunduh.
 * TODO(backend): kalau nanti boot perlu fetch data awal
 * (profil, quick status), kaitkan progress ke fetch tsb.
 * ============================================================
 */

export function LoadingScreen({ onDone }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let value = 0
    const id = setInterval(() => {
      /* Naik acak biar terasa "digambar tangan", bukan linear */
      value = Math.min(100, value + 11 + Math.random() * 18)
      setProgress(Math.round(value))
      if (value >= 100) {
        clearInterval(id)
        setTimeout(onDone, 300)
      }
    }, 85)
    return () => clearInterval(id)
  }, [onDone])

  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-night"
    >
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-6xl font-bold"
      >
        Karsa<span className="text-mod-finance">.</span>
      </motion.p>

      {/* Garis sketsa yang terisi progresif */}
      <svg viewBox="0 0 220 20" className="mt-8 w-56" aria-hidden="true">
        {/* Bayangan garis (belum digambar) */}
        <path
          d="M4 12 C 30 6, 55 16, 82 10 S 140 5, 168 12 S 200 14, 216 9"
          fill="none"
          stroke="#56503f"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 7"
        />
        {/* Garis terisi mengikuti progress */}
        <path
          d="M4 12 C 30 6, 55 16, 82 10 S 140 5, 168 12 S 200 14, 216 9"
          fill="none"
          stroke="#f2d785"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - progress / 100}
          style={{ transition: 'stroke-dashoffset 0.15s ease-out' }}
        />
      </svg>

      <p className="mt-4 font-display text-2xl text-paper-dim">
        menyiapkan modul… {progress}%
      </p>
    </motion.div>
  )
}
