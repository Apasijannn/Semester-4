import { motion } from 'framer-motion'
import { siteConfig } from '../data/siteConfig.js'
import { fadeUp } from './motion.js'

export default function SectionSkills() {
  return (
    <section id="skills" className="pointer-events-none relative flex min-h-screen items-center">
      <div className="mx-auto w-full max-w-6xl px-6">
        <motion.div {...fadeUp} className="pointer-events-auto">
          <p className="section-eyebrow">03 — Skills</p>
          <h2 className="section-title">Tools of the trade.</h2>
        </motion.div>

        <div className="pointer-events-auto mt-12 grid gap-6 md:grid-cols-3">
          {siteConfig.skills.map((groupItem, i) => (
            <motion.div
              key={groupItem.group}
              {...fadeUp}
              transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.12 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-sm"
            >
              <h3 className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
                {groupItem.group}
              </h3>
              <ul className="mt-5 flex flex-wrap gap-2">
                {groupItem.items.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-paper/80"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
