import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Scene } from '../three/Scene'
import { ModuleGrid } from '../components/ModuleGrid'
import { useModuleHover } from '../hooks/useModuleHover'
import { MODULES } from '../data/modules'
import { USER } from '../data/user'

/**
 * ============================================================
 * HomeDashboard — halaman utama app (route "/").
 *
 * Bukan landing page: ini "meja kerja" harian.
 *  - Maskot 3D + particle tetap jadi centerpiece identitas
 *  - Greeting personal + jam & tanggal berjalan
 *  - Quick status tiap modul (DUMMY — lihat TODO di bawah)
 *  - ModuleGrid = navigasi utama (klik card => buka modul)
 *
 * TODO(backend): quick status diambil dari modules.js (dummy).
 * Ganti dengan fetch paralel ke `${m.api}/summary` (FastAPI)
 * saat backend siap — bentuk respons: { headline, detail }.
 * ============================================================
 */

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    /* Update tiap 10 detik — cukup untuk jam menit, hemat render */
    const id = setInterval(() => setNow(new Date()), 10_000)
    return () => clearInterval(id)
  }, [])
  return now
}

function greetingFor(hour) {
  if (hour < 4) return 'Selamat malam'
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 19) return 'Selamat sore'
  return 'Selamat malam'
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (d = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 0.25 + d, ease: 'easeOut' },
  }),
}

export function HomeDashboard() {
  const { focusColor } = useModuleHover()
  const now = useClock()

  const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const date = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <>
      {/* ================= Area atas: scene + greeting ================= */}
      <section className="relative h-[68svh] min-h-120">
        {/* Gradasi ambience — ikut warna modul yang sedang disorot */}
        <div
          className="absolute inset-0 transition-[background] duration-700"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 42%, ${focusColor}1f 0%, transparent 65%)`,
          }}
        />
        <div className="absolute inset-0">
          <Scene />
        </div>

        {/* Greeting + jam (kiri-atas) */}
        <div className="pointer-events-none absolute left-5 top-6 sm:left-10">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0}
            className="font-display text-2xl"
            style={{ color: focusColor }}
          >
            ✳ {date}
          </motion.p>
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0.1}
            className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl"
          >
            {greetingFor(now.getHours())}, {USER.name}.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0.2}
            className="mt-2 text-lg text-paper-dim"
          >
            <span className="font-semibold text-paper">{time}</span> · semua modul siap.
          </motion.p>
        </div>
      </section>

      {/* ================= Quick status tiap modul ================= */}
      <section className="relative mx-auto -mt-14 max-w-6xl px-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {MODULES.map((m, i) => (
            <motion.div
              key={m.id}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0.3 + i * 0.06}
            >
              <Link
                to={m.route}
                className="sketchy block h-full border bg-night-soft/85 p-3 backdrop-blur-sm transition-transform hover:-translate-y-1"
                style={{ borderColor: `${m.color}88` }}
              >
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-paper-dim">
                  <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
                  {m.short}
                </p>
                {/* TODO(backend): ganti dummy dengan GET {m.api}/summary */}
                <p className="mt-1.5 text-sm font-semibold leading-snug text-paper">
                  {m.quick.headline}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-paper-dim">{m.quick.detail}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= Navigasi modul (card 3D) ================= */}
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-14">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Modul</h2>
          <p className="font-display text-lg text-paper-dim">
            klik card untuk membuka ✎
          </p>
        </div>
        <ModuleGrid />
      </section>
    </>
  )
}
