import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ReducedMotionProvider } from './hooks/useReducedMotion'
import { ModuleHoverProvider } from './hooks/useModuleHover'
import { Navbar } from './components/Navbar'
import { HomeDashboard } from './pages/HomeDashboard'
import { ModulePage } from './pages/ModulePage'
import { SettingsPage } from './pages/SettingsPage'
import { LoadingScreen } from './components/LoadingScreen'
import { MODULES } from './data/modules'

/**
 * ============================================================
 * KARSA — main UI aplikasi (bukan landing page).
 *
 * Routing:
 *  /                 → HomeDashboard (maskot 3D + greeting +
 *                      quick status + navigasi modul)
 *  /health, /finance, /tasks, /skincare, /dashboard-detail
 *                    → ModulePage (template per modul; route
 *                      terdaftar otomatis dari MODULES)
 *  /settings         → preferensi (toggle animasi 3D) +
 *                      Tech Notes + Status Pengembangan
 *
 * Yang paling sering perlu DISESUAIKAN:
 *  - Konten, quick status, & endpoint modul : src/data/modules.js
 *  - Nama untuk greeting                    : src/data/user.js
 *  - Koneksi backend (FastAPI)              : cari "TODO(backend)"
 * ============================================================
 */

/* Reset scroll tiap pindah route — rasa "pindah halaman" app */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  /* Boot state app — loading screen hand-drawn sekali di awal */
  const [booting, setBooting] = useState(true)

  return (
    <ReducedMotionProvider>
      <ModuleHoverProvider>
        <AnimatePresence>
          {booting && <LoadingScreen onDone={() => setBooting(false)} />}
        </AnimatePresence>

        {/* Noise kertas di seluruh app (kesan retro/hand-drawn) */}
        <div className="grain-overlay" aria-hidden="true" />

        {!booting && (
          <>
            <ScrollToTop />
            <Navbar />
            <main className="pt-16">
              <Routes>
                <Route path="/" element={<HomeDashboard />} />
                {/* Route per-modul, otomatis dari data MODULES */}
                {MODULES.map((m) => (
                  <Route
                    key={m.id}
                    path={m.route}
                    element={<ModulePage key={m.id} module={m} />}
                  />
                ))}
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <footer className="border-t border-paper/10 py-6 text-center text-xs text-paper-dim">
              Karsa — UI pribadi <span className="font-display text-base">✍</span>
            </footer>
          </>
        )}
      </ModuleHoverProvider>
    </ReducedMotionProvider>
  )
}
