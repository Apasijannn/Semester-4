import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/**
 * ============================================================
 * useReducedMotion — toggle animasi 3D on/off untuk pemakaian
 * harian (dan device kentang).
 *
 * Saat `reduced` = true:
 *  - Canvas 3D pindah ke frameloop "demand" (render sekali,
 *    tidak ada loop 60fps di background)
 *  - Float/idle/orbit/particle animation dimatikan
 *  - Scene tetap tampil (statis) supaya identitas visual tetap
 *
 * Default mengikuti prefers-reduced-motion sistem; pilihan user
 * disimpan di localStorage sehingga konsisten antar-sesi.
 * ============================================================
 */

const STORAGE_KEY = 'karsa:reduced-motion'

const ReducedMotionContext = createContext(null)

function initialValue() {
  if (typeof window === 'undefined') return false
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved !== null) return saved === '1'
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function ReducedMotionProvider({ children }) {
  const [reduced, setReduced] = useState(initialValue)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, reduced ? '1' : '0')
  }, [reduced])

  const toggle = useCallback(() => setReduced((r) => !r), [])

  const value = useMemo(() => ({ reduced, setReduced, toggle }), [reduced, toggle])
  return createElement(ReducedMotionContext.Provider, { value }, children)
}

export function useReducedMotion() {
  const ctx = useContext(ReducedMotionContext)
  if (!ctx) {
    throw new Error('useReducedMotion harus dipakai di dalam <ReducedMotionProvider>')
  }
  return ctx
}
