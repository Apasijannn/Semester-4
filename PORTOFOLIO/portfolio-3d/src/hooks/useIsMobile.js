import { useEffect, useState } from 'react'

const QUERY = '(max-width: 767px)'

// Deteksi viewport mobile — dipakai untuk mengurangi kompleksitas 3D
// (jumlah partikel, detail geometri, postprocessing) dan menonaktifkan
// orbit drag supaya scroll native tetap nyaman di layar sentuh.
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const onChange = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
