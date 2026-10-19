import { createContext, createElement, useCallback, useContext, useMemo, useState } from 'react'
import { MODULES } from '../data/modules'

/**
 * ============================================================
 * useModuleHover — sinkronisasi "modul yang sedang disorot".
 *
 * Menyinkronkan:
 *  - card yang di-hover / difokus carousel di Home
 *  - warna ambient/tint scene 3D (maskot, card, background)
 *  - index aktif carousel navigasi (Prev/Next, drag, dots)
 *
 * Catatan: ini murni state UI (bukan data modul) — data quick
 * status dsb. tetap dari src/data/modules.js / backend.
 * ============================================================
 */

const ModuleHoverContext = createContext(null)

export function ModuleHoverProvider({ children }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const next = useCallback(
    () => setActiveIndex((i) => (i + 1) % MODULES.length),
    [],
  )
  const prev = useCallback(
    () => setActiveIndex((i) => (i - 1 + MODULES.length) % MODULES.length),
    [],
  )

  const value = useMemo(
    () => ({
      modules: MODULES,
      activeIndex,
      setActiveIndex,
      hoveredIndex,
      setHoveredIndex,
      activeModule: MODULES[activeIndex],
      /* Warna yang sedang "berkuasa": hover menang atas fokus carousel,
         supaya ambient light langsung merespons saat hover card */
      focusColor: MODULES[hoveredIndex ?? activeIndex].color,
      next,
      prev,
    }),
    [activeIndex, hoveredIndex, next, prev],
  )

  return createElement(ModuleHoverContext.Provider, { value }, children)
}

export function useModuleHover() {
  const ctx = useContext(ModuleHoverContext)
  if (!ctx) {
    throw new Error('useModuleHover harus dipakai di dalam <ModuleHoverProvider>')
  }
  return ctx
}
