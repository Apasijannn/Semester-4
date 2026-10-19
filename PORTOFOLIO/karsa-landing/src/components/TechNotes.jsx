import { motion } from 'framer-motion'

/**
 * ============================================================
 * TechNotes — "Tech Stack & Notes".
 * Karena ini portal personal, detail arsitektur justru jadi
 * konten utama: apa yang dipakai di tiap lapisan + catatan
 * singkat kenapa/bagaimana.
 * >>> SESUAIKAN: isi NOTES dengan arsitektur Karsa yang
 * >>> sebenarnya (stack, alasan, pelajaran). <<<
 * ============================================================
 */

const NOTES = [
  {
    title: 'Frontend',
    color: '#a9c7e8',
    stack: ['React + Vite', 'Tailwind CSS', 'React Three Fiber'],
    note: 'Portal ini sendiri bagian dari eksperimen: objek 3D-nya prosedural semua, shading matte pakai shader custom — tanpa file model.',
  },
  {
    title: 'Backend',
    color: '#b5e0c4',
    stack: ['FastAPI', 'Python 3.12', 'Uvicorn'],
    note: 'Tiap modul jadi service kecil terpisah, satu router per domain — biar bisa dioprek dan di-deploy satu-satu tanpa saling ganggu.',
  },
  {
    title: 'Data',
    color: '#f2d785',
    stack: ['Supabase (Postgres)', 'Auth + RLS', 'Realtime'],
    note: 'Satu database untuk semua modul. Skema tabel harian dari Health Manager jadi acuan bentuk data modul-modul lain.',
  },
  {
    title: 'AI & Agents',
    color: '#eec5cf',
    stack: ['LangGraph', 'Claude API', 'Pydantic schema'],
    note: 'Agent kategorisasi transaksi & dekomposisi tugas dirakit sebagai graph — kubiasakan gambar alurnya di kertas dulu sebelum ngoding.',
  },
]

export function TechNotes() {
  return (
    <section id="tech-notes" className="relative py-24">
      <div className="mx-auto max-w-6xl px-5">
        <p className="font-display text-2xl text-mod-task">✳ di balik layar</p>
        <h2 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Tech Stack <span className="scribble-underline">& Notes</span>.
        </h2>
        <p className="mt-4 max-w-xl text-paper-dim">
          Catatan arsitektur singkat — apa yang kupakai di tiap lapisan Karsa,
          dan hal-hal yang kupelajari sambil jalan.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {NOTES.map((n, i) => (
            <motion.div
              key={n.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
              className={`${i % 2 ? 'sketchy-alt' : 'sketchy'} border-2 bg-night-soft/80 p-6`}
              style={{ borderColor: n.color }}
            >
              <h3 className="font-display text-2xl" style={{ color: n.color }}>
                {n.title}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {n.stack.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-paper/25 px-3 py-1 text-sm text-paper/85"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-paper-dim">{n.note}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
