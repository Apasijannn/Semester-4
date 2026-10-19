import { motion } from 'framer-motion'
import { MODULES, PLANNED_MODULES, STATUS_META } from '../data/modules'

/**
 * ============================================================
 * RoadmapSection — "Status Pengembangan" (pengganti CTA).
 *
 * Kartu kertas berisi daftar semua modul + statusnya:
 * selesai / sedang dikerjakan / direncanakan. Modul yang belum
 * dibangun (mis. Fitness Assistant) diambil dari
 * PLANNED_MODULES di src/data/modules.js.
 * >>> SESUAIKAN status & catatan di src/data/modules.js. <<<
 * ============================================================
 */

/* Urutkan: selesai dulu, lalu dikerjakan, terakhir rencana */
const ORDER = { selesai: 0, dikerjakan: 1, rencana: 2 }
const ALL_ITEMS = [...MODULES, ...PLANNED_MODULES].sort(
  (a, b) => ORDER[a.status] - ORDER[b.status],
)

export function RoadmapSection() {
  return (
    <section id="roadmap" className="relative px-5 py-28">
      <motion.div
        initial={{ opacity: 0, y: 40, rotate: -0.5 }}
        whileInView={{ opacity: 1, y: 0, rotate: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="sketchy relative mx-auto max-w-3xl border-2 border-ink bg-paper px-6 py-12 text-ink sm:px-12"
      >
        {/* Doodle dekorasi */}
        <span className="absolute -top-5 left-8 font-display text-4xl text-mod-finance">✳</span>
        <span className="absolute -bottom-4 right-10 font-display text-3xl text-mod-task">✦</span>

        <p className="font-display text-2xl text-ink-soft">catatan progress — diperbarui manual</p>
        <h2 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Status Pengembangan
        </h2>

        <ul className="mt-10 space-y-6">
          {ALL_ITEMS.map((item, i) => {
            const meta = STATUS_META[item.status]
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: 'easeOut' }}
                className="flex items-start gap-4"
              >
                {/* Simbol status ala coretan checklist */}
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink font-display text-xl leading-none"
                  style={{ background: meta.color }}
                >
                  {meta.symbol}
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-baseline gap-x-3">
                    <span className="text-lg font-semibold">{item.name}</span>
                    <span className="font-display text-lg text-ink-soft">{meta.long}</span>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                    {item.note ?? item.description}
                  </p>
                </div>
              </motion.li>
            )
          })}
        </ul>

        <p className="mt-10 border-t-2 border-dashed border-ink/25 pt-5 font-display text-xl text-ink-soft">
          Ide modul berikutnya kutampung dulu di sini sebelum digambar. ✍
        </p>
      </motion.div>
    </section>
  )
}
