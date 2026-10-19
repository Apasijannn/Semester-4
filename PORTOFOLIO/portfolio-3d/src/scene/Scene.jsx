import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Lightformer, Float } from '@react-three/drei'
import HeroObject from './HeroObject.jsx'
import ProjectCard3D from './ProjectCard3D.jsx'
import ParticleField from './ParticleField.jsx'
import FlyingFlock from './FlyingFlock.jsx'
import GlowBackdrop from './GlowBackdrop.jsx'
import Effects from './Effects.jsx'
import { projects } from '../data/projects.js'
import { siteConfig } from '../data/siteConfig.js'
import { useScrollCamera, damp, SECTION_GAP } from '../hooks/useScrollCamera.js'
import { useIsMobile } from '../hooks/useIsMobile.js'

const BG = '#0e0f12'

/*
  Posisi world-space elemen 3D untuk tiap section.
  Konvensi: y(v) = posisi vertikal yang tepat berada di tengah layar
  saat pengguna sudah scroll sejauh `v` layar (lihat useScrollCamera).
  Section DOM: hero(0) → about(1) → projects(2..) → skills → contact.
*/
function getLayout(isMobile) {
  const y = (v) => -v * SECTION_GAP

  if (isMobile) {
    // mobile: kartu project disusun satu kolom, section projects = 240vh
    return {
      hero: { position: [0, 1.25, -0.5], scale: 0.6 },
      heroGlow: { position: [0, 1.4, -5], scale: 6 },
      aboutRing: { position: [0, y(1) - 2.4, -2.5], scale: 0.7 },
      cards: projects.map((_, i) => ({
        position: [0, y(2.4 + i * 0.38), 0],
        scale: 0.8,
      })),
      skillsGem: { position: [1.4, y(4.4) - 2.6, -2.5], scale: 0.6 },
      contactRing: { position: [0, y(5.4) + 2.2, -3], scale: 0.8 },
    }
  }

  // desktop: grid 3 kolom × 2 baris
  return {
    hero: { position: [2.7, 0.15, 0], scale: 1.08 },
    heroGlow: { position: [2.6, 0.2, -4.5], scale: 8 },
    aboutRing: { position: [-3.8, y(1), -1.5], scale: 1 },
    cards: projects.map((_, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      return {
        position: [(col - 1) * 2.75, y(2.08) + 0.95 - row * 1.9, col === 1 ? 0.15 : -0.1],
        scale: 1,
      }
    }),
    skillsGem: { position: [3.9, y(3), -1.5], scale: 1 },
    contactRing: { position: [0, y(4) + 0.2, -2.5], scale: 1 },
  }
}

/*
  Parallax berlapis ala landing page ilustratif (referensi):
  tiap lapisan bergeser mengikuti kursor dengan faktor berbeda —
  lapisan "dekat" bergerak paling banyak (kontra arah kursor),
  lapisan "jauh" sedikit searah — sehingga scene terasa punya kedalaman.
*/
function ParallaxLayer({ factor = 0.3, children }) {
  const ref = useRef()
  useFrame((state, delta) => {
    ref.current.position.x = damp(ref.current.position.x, state.pointer.x * factor, 2.5, delta)
    ref.current.position.y = damp(ref.current.position.y, state.pointer.y * factor * 0.6, 2.5, delta)
  })
  return <group ref={ref}>{children}</group>
}

// Aksen dekoratif: cincin tipis warna aksen (section About & Contact)
function AccentRing({ position, scale = 1 }) {
  const ref = useRef()
  useFrame((_, delta) => {
    ref.current.rotation.z += delta * 0.1
    ref.current.rotation.x += delta * 0.04
  })
  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.4}>
      <mesh ref={ref} position={position} scale={scale} rotation={[1.1, 0.4, 0]}>
        <torusGeometry args={[1.7, 0.012, 8, 96]} />
        <meshBasicMaterial color={siteConfig.accentColor} transparent opacity={0.35} />
      </mesh>
    </Float>
  )
}

// Aksen dekoratif: oktahedron wireframe (section Skills)
function AccentGem({ position, scale = 1 }) {
  const ref = useRef()
  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.15
    ref.current.rotation.x += delta * 0.06
  })
  return (
    <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.5}>
      <mesh ref={ref} position={position} scale={scale}>
        <octahedronGeometry args={[1.1, 0]} />
        <meshBasicMaterial wireframe color={siteConfig.accentColor} transparent opacity={0.3} />
      </mesh>
    </Float>
  )
}

/*
  ScrollRig: menggeser seluruh konten 3D mengikuti scroll dengan damping
  halus, lalu membaginya menjadi lapisan-lapisan parallax kursor.
  Partikel diberi faktor scroll lebih kecil supaya terasa jauh.
*/
function ScrollRig({ isMobile, onSelectProject }) {
  const world = useRef()
  const bg = useRef()
  const scroll = useScrollCamera()
  const layout = getLayout(isMobile)

  useFrame((_, delta) => {
    const s = scroll.current
    s.current = damp(s.current, s.target, 4, delta)
    world.current.position.y = s.current * SECTION_GAP
    bg.current.position.y = s.current * SECTION_GAP * 0.12
  })

  return (
    <>
      <group ref={world}>
        {/* lapisan terdekat: centerpiece hero — parallax paling kuat */}
        <ParallaxLayer factor={-0.55}>
          <HeroObject {...layout.hero} isMobile={isMobile} />
        </ParallaxLayer>

        {/* lapisan tengah: burung, kartu project, dan aksen tiap section */}
        <ParallaxLayer factor={-0.25}>
          <FlyingFlock count={isMobile ? 3 : 6} />
          <AccentRing {...layout.aboutRing} />
          {projects.map((p, i) => (
            <ProjectCard3D
              key={p.id}
              project={p}
              {...layout.cards[i]}
              onSelect={onSelectProject}
              dense={isMobile}
            />
          ))}
          <AccentGem {...layout.skillsGem} />
          <AccentRing {...layout.contactRing} />
        </ParallaxLayer>

        {/* lapisan jauh: glow "matahari terbenam" di belakang hero */}
        <ParallaxLayer factor={-0.1}>
          <GlowBackdrop {...layout.heroGlow} />
        </ParallaxLayer>
      </group>

      {/* latar terjauh: partikel — bergerak sedikit SEARAH kursor */}
      <group ref={bg}>
        <ParallaxLayer factor={0.2}>
          <ParticleField count={isMobile ? 250 : 850} />
        </ParallaxLayer>
      </group>
    </>
  )
}

export default function Scene({ onSelectProject }) {
  const isMobile = useIsMobile()

  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 45 }}
      dpr={[1, isMobile ? 1.5 : 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      // pan-y: sentuhan vertikal di mobile tetap men-scroll halaman
      style={{ touchAction: 'pan-y' }}
    >
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 14, 30]} />

      {/* pencahayaan lembut tanpa shadow berat */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={0.7} />

      <Suspense fallback={null}>
        {/*
          Environment map prosedural via Lightformer — memberi refleksi
          "studio" elegan pada material metalik TANPA butuh koneksi internet.
          Alternatif berbasis HDRI (butuh internet): <Environment preset="city" />
        */}
        <Environment resolution={256}>
          <Lightformer intensity={1.8} position={[0, 5, 2]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
          <Lightformer intensity={0.9} position={[-6, 1, -1]} rotation-y={Math.PI / 2} scale={[14, 2, 1]} />
          <Lightformer intensity={0.9} position={[6, -1, -1]} rotation-y={-Math.PI / 2} scale={[14, 2, 1]} />
          <Lightformer color={siteConfig.accentColor} intensity={0.5} position={[0, 1, -6]} scale={[9, 4, 1]} />
        </Environment>

        <ScrollRig isMobile={isMobile} onSelectProject={onSelectProject} />

        {/* postprocessing (bloom + vignette + ACES) hanya di desktop */}
        {!isMobile && <Effects />}
      </Suspense>

      {/*
        Orbit terbatas: hanya rotasi kecil dengan damping, tanpa zoom/pan
        supaya komposisi dan scroll halaman tidak terganggu.
        Di mobile dinonaktifkan agar scroll native tetap lancar.
      */}
      <OrbitControls
        makeDefault
        enabled={!isMobile}
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.35}
        dampingFactor={0.06}
        minAzimuthAngle={-0.3}
        maxAzimuthAngle={0.3}
        minPolarAngle={Math.PI / 2 - 0.25}
        maxPolarAngle={Math.PI / 2 + 0.25}
      />
    </Canvas>
  )
}
