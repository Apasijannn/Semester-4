import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { siteConfig } from '../data/siteConfig.js'

// delay awal menunggu loading screen selesai fade
const enter = (delay) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease: 'easeOut' },
})

/*
  Parallax kursor untuk teks hero (lapisan DOM) — pasangan dari parallax
  3D di dalam canvas. Teks bergeser sedikit berlawanan arah kursor,
  memperkuat ilusi kedalaman ala landing page referensi.
*/
function useHeroParallax() {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  useEffect(() => {
    const onMove = (e) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1)
      my.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [mx, my])

  const spring = { stiffness: 40, damping: 15, mass: 0.6 }
  return {
    x: useSpring(useTransform(mx, [-1, 1], [12, -12]), spring),
    y: useSpring(useTransform(my, [-1, 1], [8, -8]), spring),
  }
}

/*
  Judul display raksasa yang menimpa objek 3D di belakangnya —
  tiap kata jadi satu baris, tiap huruf muncul berjenjang dari bawah
  (masked reveal), seperti tipografi besar pada referensi.
*/
function DisplayTitle({ text, baseDelay = 1.6 }) {
  return (
    <h1
      aria-label={text}
      className="pointer-events-none select-none text-[clamp(3.2rem,13vw,9.5rem)] font-bold uppercase leading-[0.95] tracking-tight text-paper"
    >
      {text.split(' ').map((word, w) => (
        <span key={w} className="block overflow-hidden">
          {word.split('').map((letter, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ y: '105%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              transition={{
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
                delay: baseDelay + w * 0.18 + i * 0.03,
              }}
            >
              {letter}
            </motion.span>
          ))}
        </span>
      ))}
    </h1>
  )
}

export default function SectionHero() {
  const parallax = useHeroParallax()

  return (
    <section id="hero" className="pointer-events-none relative flex min-h-screen items-center overflow-hidden">
      <div className="mx-auto w-full max-w-6xl px-6">
        {/* seluruh blok teks ikut parallax kursor secara halus */}
        <motion.div style={{ x: parallax.x, y: parallax.y }}>
          <motion.p
            {...enter(1.5)}
            className="pointer-events-auto mb-6 text-xs uppercase tracking-[0.35em] text-accent"
          >
            Software · Games · Design
          </motion.p>

          <DisplayTitle text={siteConfig.name} baseDelay={1.6} />

          <motion.p
            {...enter(2.1)}
            className="pointer-events-auto mt-8 max-w-md text-base leading-relaxed text-muted"
          >
            {siteConfig.tagline}
          </motion.p>

          <motion.div {...enter(2.25)} className="pointer-events-auto mt-10 flex flex-wrap gap-4">
            <a href="#projects" className="btn-accent">
              View Projects
            </a>
            <a href="#contact" className="btn-ghost">
              Get in Touch
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* indikator scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.9, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="h-10 w-px animate-pulse bg-gradient-to-b from-transparent via-muted to-transparent" />
      </motion.div>
    </section>
  )
}
