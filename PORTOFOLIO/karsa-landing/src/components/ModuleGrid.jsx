import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ModuleCard3D } from '../three/ModuleCard3D'
import { useModuleHover } from '../hooks/useModuleHover'
import { STATUS_META } from '../data/modules'

/**
 * ============================================================
 * ModuleGrid — navigasi utama antar-modul (carousel card 3D).
 *
 * Ini BUKAN showcase: klik card = benar-benar pindah route ke
 * halaman modulnya (react-router). Drag/swipe untuk menelusuri,
 * Prev/Next untuk keyboard-less browsing, hover untuk preview
 * quick status + tint ambient ke warna pastel modul.
 * ============================================================
 */

const GAP = 28

export function ModuleGrid() {
  const navigate = useNavigate()
  const { modules, activeIndex, setActiveIndex, hoveredIndex, setHoveredIndex, next, prev } =
    useModuleHover()

  /* Ukur lebar viewport carousel untuk menghitung posisi track */
  const viewportRef = useRef(null)
  const [viewportW, setViewportW] = useState(0)
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const measure = () => setViewportW(el.offsetWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const cardW = viewportW < 640 ? 220 : 260
  /* Posisi track supaya card fokus selalu di tengah viewport */
  const trackX = viewportW / 2 - cardW / 2 - activeIndex * (cardW + GAP)

  /* Guard: jangan anggap drag sebagai klik */
  const dragging = useRef(false)

  const openModule = (m, i) => {
    if (dragging.current) return
    setActiveIndex(i)
    navigate(m.route) // <-- routing sungguhan ke halaman modul
  }

  return (
    <div className="relative">
      {/* ---- Viewport carousel ---- */}
      <div ref={viewportRef} className="relative w-full overflow-hidden">
        <motion.div
          className="flex cursor-grab items-stretch py-3 active:cursor-grabbing"
          style={{ gap: GAP }}
          animate={{ x: trackX }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragStart={() => (dragging.current = true)}
          onDragEnd={(_, { offset, velocity }) => {
            if (offset.x < -70 || velocity.x < -400) next()
            else if (offset.x > 70 || velocity.x > 400) prev()
            /* Beri jeda sebelum klik dianggap valid lagi */
            setTimeout(() => (dragging.current = false), 80)
          }}
        >
          {modules.map((m, i) => {
            const active = i === activeIndex
            const hovered = i === hoveredIndex
            return (
              <motion.article
                key={m.id}
                role="link"
                aria-label={`Buka modul ${m.name}`}
                onHoverStart={() => setHoveredIndex(i)}
                onHoverEnd={() => setHoveredIndex(null)}
                onClick={() => openModule(m, i)}
                animate={{
                  scale: active ? 1.05 : 0.92,
                  opacity: active || hovered ? 1 : 0.6,
                  y: active ? -6 : 0,
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                className="sketchy shrink-0 cursor-pointer border-2 bg-night-soft/80 p-4 pb-5 select-none"
                style={{ width: cardW, borderColor: m.color }}
              >
                {/* Scene 3D mini modul */}
                <div className="h-36 sm:h-44">
                  <ModuleCard3D module={m} hovered={hovered} active={active} />
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">{m.name}</h3>
                  <span
                    className="shrink-0 rounded-full border px-2 py-0.5 font-display text-sm leading-none"
                    style={{
                      borderColor: STATUS_META[m.status].color,
                      color: STATUS_META[m.status].color,
                    }}
                  >
                    {STATUS_META[m.status].symbol} {STATUS_META[m.status].label}
                  </span>
                </div>

                {/* Quick status (dummy) — TODO(backend): dari {m.api}/summary */}
                <p className="mt-1 text-sm text-paper/85">{m.quick.headline}</p>

                {/* Preview detail saat hover / fokus */}
                <AnimatePresence initial={false}>
                  {(hovered || active) && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden text-sm text-paper-dim"
                    >
                      <span className="block pt-1">{m.quick.detail}</span>
                      <span
                        className="mt-2 block font-display text-lg"
                        style={{ color: m.color }}
                      >
                        buka modul →
                      </span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.article>
            )
          })}
        </motion.div>
      </div>

      {/* ---- Navigasi Previous / Next + indikator titik ---- */}
      <div className="mt-6 flex items-center justify-center gap-6">
        <motion.button
          type="button"
          onClick={prev}
          whileHover={{ scale: 1.06, rotate: -2 }}
          whileTap={{ scale: 0.94 }}
          className="sketchy border-2 border-paper/70 px-5 py-1.5 font-display text-lg"
          aria-label="Modul sebelumnya"
        >
          ← Prev
        </motion.button>

        <div className="flex gap-2.5">
          {modules.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Fokus ke modul ${m.name}`}
              className="h-3 w-3 rounded-full border transition-all duration-300"
              style={{
                borderColor: m.color,
                background: i === activeIndex ? m.color : 'transparent',
                transform: i === activeIndex ? 'scale(1.25) rotate(45deg)' : 'none',
              }}
            />
          ))}
        </div>

        <motion.button
          type="button"
          onClick={next}
          whileHover={{ scale: 1.06, rotate: 2 }}
          whileTap={{ scale: 0.94 }}
          className="sketchy-alt border-2 border-paper/70 px-5 py-1.5 font-display text-lg"
          aria-label="Modul berikutnya"
        >
          Next →
        </motion.button>
      </div>
    </div>
  )
}
