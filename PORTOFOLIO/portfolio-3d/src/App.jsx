import { useCallback, useEffect, useState } from 'react'
import Scene from './scene/Scene.jsx'
import Navbar from './ui/Navbar.jsx'
import LoadingScreen from './ui/LoadingScreen.jsx'
import SectionHero from './ui/SectionHero.jsx'
import SectionAbout from './ui/SectionAbout.jsx'
import SectionProjects from './ui/SectionProjects.jsx'
import SectionSkills from './ui/SectionSkills.jsx'
import SectionContact from './ui/SectionContact.jsx'
import ProjectModal from './ui/ProjectModal.jsx'
import { siteConfig } from './data/siteConfig.js'

/*
  Arsitektur halaman:
  - Canvas 3D dipasang fixed memenuhi layar, di lapisan paling belakang (z-0).
  - Konten HTML biasa (section-section) di atasnya (z-10) dengan
    pointer-events-none pada wrapper — jadi drag/hover tembus ke canvas,
    kecuali pada elemen interaktif yang diberi pointer-events-auto.
  - Scroll halaman menggerakkan scene 3D lewat ScrollRig (scene/Scene.jsx).
*/
export default function App() {
  const [activeProject, setActiveProject] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const handleFinish = useCallback(() => setLoaded(true), [])

  // Satu sumber warna aksen: siteConfig.accentColor menimpa CSS variable
  // sehingga UI (Tailwind) dan objek 3D selalu senada.
  useEffect(() => {
    document.documentElement.style.setProperty('--color-accent', siteConfig.accentColor)
  }, [])

  return (
    <>
      <LoadingScreen onFinish={handleFinish} />

      {/* canvas 3D — fade in setelah loading screen selesai */}
      <div
        className={`fixed inset-0 z-0 overflow-hidden transition-opacity duration-1000 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Scene onSelectProject={setActiveProject} />
      </div>

      {/* vignette CSS untuk mobile (desktop memakai postprocessing Vignette) */}
      <div className="vignette pointer-events-none fixed inset-0 z-[5] md:hidden" />

      <Navbar />

      <main className="relative z-10">
        <SectionHero />
        <SectionAbout />
        <SectionProjects />
        <SectionSkills />
        <SectionContact />
      </main>

      <ProjectModal project={activeProject} onClose={() => setActiveProject(null)} />
    </>
  )
}
