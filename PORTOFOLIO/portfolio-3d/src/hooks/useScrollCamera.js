import { useEffect, useRef } from 'react'

/*
  Sinkronisasi scroll halaman ↔ pergerakan kamera/scene.

  Teknik yang dipakai: kamera tetap diam (supaya tidak bentrok dengan
  OrbitControls), dan sebagai gantinya seluruh "dunia" 3D digeser ke atas
  mengikuti scroll — hasil visualnya identik dengan kamera yang bergerak
  turun antar section, tapi tetap bisa di-orbit dengan mulus.

  SECTION_GAP = jarak vertikal (world unit) yang ditempuh scene untuk
  setiap 100vh scroll. Nilai 7.5 ≈ tinggi frustum kamera di z=0
  (fov 45°, jarak 9), sehingga 1 layar scroll ≈ 1 layar pergeseran 3D.
*/
export const SECTION_GAP = 7.5

export function useScrollCamera() {
  const scroll = useRef({ target: 0, current: 0 })

  useEffect(() => {
    const onScroll = () => {
      // progress scroll dalam satuan "layar" (1 = satu tinggi viewport)
      scroll.current.target = window.scrollY / window.innerHeight
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return scroll
}

// Exponential smoothing yang konsisten di semua frame rate.
export function damp(current, target, lambda, delta) {
  return current + (target - current) * (1 - Math.exp(-lambda * delta))
}
