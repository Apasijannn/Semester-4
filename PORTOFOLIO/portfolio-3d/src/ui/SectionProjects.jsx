import { motion } from 'framer-motion'
import { fadeUp } from './motion.js'

/*
  Section ini hanya berisi heading — kartu project dirender sebagai
  objek 3D melayang di canvas (lihat scene/ProjectCard3D.jsx), diposisikan
  sejajar dengan section ini lewat ScrollRig.

  Tinggi section:
  - Desktop : 100vh (grid 3×2 muat satu layar)
  - Mobile  : 240vh — kartu disusun satu kolom, jadi butuh ruang scroll.
  Jika project lebih dari 6, besarkan nilai min-h di bawah dan sesuaikan
  layout kartu di scene/Scene.jsx (getLayout).
*/
export default function SectionProjects() {
  return (
    <section id="projects" className="pointer-events-none relative min-h-[240vh] md:min-h-screen">
      <div className="mx-auto max-w-6xl px-6 pt-28 text-center md:pt-32">
        <motion.div {...fadeUp} className="pointer-events-auto inline-block">
          <p className="section-eyebrow">02 — Selected Work</p>
          <h2 className="section-title">Projects across three crafts.</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
            Software, games, and interface design. Hover a card to focus it — click to see the
            full details.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
