import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { siteConfig } from '../data/siteConfig.js'

const LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Skills', href: '#skills' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 1.6, ease: 'easeOut' }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled ? 'border-b border-white/5 bg-ink/70 backdrop-blur-md' : ''
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#hero" className="text-sm font-semibold tracking-[0.3em] text-paper">
          {siteConfig.shortName}
          <span className="text-accent">.</span>
        </a>

        <ul className="hidden gap-8 text-sm text-muted md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="nav-link">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* mobile: satu tombol kontak sebagai pengganti menu */}
        <a
          href="#contact"
          className="rounded-full border border-accent/50 px-4 py-1.5 text-xs tracking-wider text-accent transition-colors hover:bg-accent hover:text-ink md:hidden"
        >
          Contact
        </a>
      </nav>
    </motion.header>
  )
}
