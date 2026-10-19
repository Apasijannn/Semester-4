import { motion } from 'framer-motion'
import { siteConfig } from '../data/siteConfig.js'
import { fadeUp } from './motion.js'

export default function SectionContact() {
  return (
    <section
      id="contact"
      className="pointer-events-none relative flex min-h-screen flex-col items-center justify-center"
    >
      <div className="pointer-events-auto mx-auto max-w-2xl px-6 text-center">
        <motion.p {...fadeUp} className="section-eyebrow">
          04 — Contact
        </motion.p>

        <motion.h2 {...fadeUp} className="section-title">
          Let&apos;s build something together.
        </motion.h2>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
          className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted"
        >
          Have a project in mind, a role to fill, or just want to talk shop? My inbox is always
          open.
        </motion.p>

        <motion.div {...fadeUp} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.25 }} className="mt-10">
          <a href={`mailto:${siteConfig.email}`} className="btn-accent">
            {siteConfig.email}
          </a>
        </motion.div>

        <motion.ul
          {...fadeUp}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.35 }}
          className="mt-12 flex justify-center gap-8 text-sm text-muted"
        >
          {siteConfig.socials.map((s) => (
            <li key={s.label}>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-accent"
              >
                {s.label}
              </a>
            </li>
          ))}
        </motion.ul>
      </div>

      <footer className="pointer-events-auto absolute bottom-6 text-center text-[11px] tracking-wide text-muted/70">
        © {new Date().getFullYear()} {siteConfig.name} — built with React Three Fiber
      </footer>
    </section>
  )
}
