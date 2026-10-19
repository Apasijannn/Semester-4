import { motion } from 'framer-motion'
import { siteConfig } from '../data/siteConfig.js'
import { fadeUp } from './motion.js'

export default function SectionAbout() {
  return (
    <section id="about" className="pointer-events-none relative flex min-h-screen items-center">
      <div className="mx-auto w-full max-w-6xl px-6">
        {/* teks di kanan; aksen 3D (cincin) mengisi sisi kiri di desktop */}
        <div className="pointer-events-auto ml-auto max-w-2xl">
          <motion.div {...fadeUp}>
            <p className="section-eyebrow">01 — About</p>
            <h2 className="section-title">Engineering meets craft.</h2>
          </motion.div>

          {siteConfig.bio.map((paragraph, i) => (
            <motion.p
              key={i}
              {...fadeUp}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 + i * 0.1 }}
              className="mt-6 text-base leading-relaxed text-muted"
            >
              {paragraph}
            </motion.p>
          ))}

          <motion.dl
            {...fadeUp}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            className="mt-12 grid grid-cols-1 gap-6 border-t border-white/10 pt-8 sm:grid-cols-3"
          >
            {siteConfig.highlights.map((h) => (
              <div key={h.label}>
                <dt className="text-[11px] uppercase tracking-[0.25em] text-muted">{h.label}</dt>
                <dd className="mt-2 text-sm text-paper">{h.value}</dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </div>
    </section>
  )
}
