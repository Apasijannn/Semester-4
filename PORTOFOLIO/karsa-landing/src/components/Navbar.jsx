import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MODULES } from '../data/modules'
import { useReducedMotion } from '../hooks/useReducedMotion'

/**
 * ============================================================
 * Navbar — navigasi utama app (selalu tampil).
 *
 * Link per-modul dibangun dari MODULES, jadi menambah modul di
 * modules.js otomatis menambah menu di sini. Route aktif
 * ditandai pill berwarna pastel modulnya.
 *
 * Toggle ✦/◦ = animasi 3D on/off (useReducedMotion) — untuk
 * pemakaian harian di device pelan, matikan dari sini atau
 * dari halaman Settings.
 * ============================================================
 */

export function Navbar() {
  const { reduced, toggle } = useReducedMotion()

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-paper/10 bg-night/70 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
        {/* Wordmark = link ke Home */}
        <NavLink to="/" className="font-display text-3xl font-bold tracking-wide">
          Karsa<span className="text-mod-finance">.</span>
        </NavLink>

        {/* Link per-modul — scrollable di layar sempit */}
        <ul className="ml-2 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm">
          {MODULES.map((m) => (
            <li key={m.id} className="shrink-0">
              <NavLink
                to={m.route}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors ${
                    isActive ? 'text-ink' : 'text-paper-dim hover:text-paper'
                  }`
                }
                style={({ isActive }) => (isActive ? { background: m.color } : undefined)}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: m.color }}
                />
                <span className="hidden sm:inline">{m.short}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Toggle animasi 3D (reduced motion) */}
        <motion.button
          type="button"
          onClick={toggle}
          whileTap={{ scale: 0.92 }}
          title={reduced ? 'Animasi 3D: mati — klik untuk menyalakan' : 'Animasi 3D: nyala — klik untuk mematikan'}
          className={`sketchy shrink-0 border px-3 py-1.5 font-display text-lg leading-none transition-colors ${
            reduced ? 'border-paper/30 text-paper-dim' : 'border-paper/70 text-paper'
          }`}
        >
          {reduced ? '◦ statis' : '✦ animasi'}
        </motion.button>

        {/* Settings */}
        <NavLink
          to="/settings"
          title="Settings"
          className={({ isActive }) =>
            `shrink-0 font-display text-2xl leading-none transition-colors ${
              isActive ? 'text-paper' : 'text-paper-dim hover:text-paper'
            }`
          }
        >
          ⚙
        </NavLink>
      </nav>
    </header>
  )
}
