import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProgress } from '@react-three/drei'
import { siteConfig } from '../data/siteConfig.js'

// Durasi minimal loading screen (ms) — supaya intro terasa, bukan berkedip.
const MIN_DURATION = 1400

/*
  Loading screen minimalis: monogram + progress bar tipis.
  Progress digerakkan oleh timer (semua geometri di scene ini prosedural,
  jadi hampir tak ada asset yang di-download). Jika nanti kamu menambah
  asset eksternal (GLTF/HDRI), `useProgress` otomatis menahan layar ini
  sampai asset benar-benar selesai dimuat.
*/
export default function LoadingScreen({ onFinish }) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const { active } = useProgress()

  useEffect(() => {
    if (done) return
    const start = performance.now()
    let raf
    const tick = (now) => {
      const t = Math.min(1, (now - start) / MIN_DURATION)
      const eased = 1 - Math.pow(1 - t, 3)
      setProgress(Math.round(eased * 100))
      if (t < 1 || active) {
        raf = requestAnimationFrame(tick)
      } else {
        setDone(true)
        onFinish?.()
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, done, onFinish])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-7 bg-ink"
        >
          <span className="text-2xl font-semibold tracking-[0.35em] text-paper">
            {siteConfig.shortName}
            <span className="text-accent">.</span>
          </span>

          <div className="h-px w-48 overflow-hidden bg-white/10">
            <div
              className="h-full bg-accent transition-[width] duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <span className="text-[11px] tracking-[0.3em] text-muted">{progress}%</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
