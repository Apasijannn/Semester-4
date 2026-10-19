import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CATEGORY_META } from '../data/projects.js'

/*
  Modal detail project — muncul saat kartu 3D diklik.
  Tutup dengan: tombol ✕, klik backdrop, atau tombol Escape.
*/
export default function ProjectModal({ project, onClose }) {
  useEffect(() => {
    if (!project) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden' // kunci scroll saat modal terbuka
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [project, onClose])

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/80 p-6 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-ink-soft p-8 shadow-2xl"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-5 top-5 text-muted transition-colors hover:text-paper"
            >
              ✕
            </button>

            <p className="text-[11px] uppercase tracking-[0.3em] text-accent">
              {CATEGORY_META[project.category].label}
              {project.year && <span className="text-muted"> · {project.year}</span>}
            </p>

            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-paper">
              {project.title}
            </h3>

            <p className="mt-4 text-sm leading-relaxed text-muted">{project.description}</p>

            <ul className="mt-6 flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <li
                  key={tech}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-paper/80"
                >
                  {tech}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-4">
              {project.demoUrl && (
                <a href={project.demoUrl} target="_blank" rel="noreferrer" className="btn-accent">
                  Live Demo ↗
                </a>
              )}
              {project.repoUrl && (
                <a href={project.repoUrl} target="_blank" rel="noreferrer" className="btn-ghost">
                  Repository ↗
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
