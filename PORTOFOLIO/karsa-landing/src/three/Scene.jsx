import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MascotRobot } from './MascotRobot'
import { ParticleField } from './ParticleField'
import { SketchMatteMaterial } from './SketchMatteMaterial'
import { useModuleHover } from '../hooks/useModuleHover'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { MODULES } from '../data/modules'

/**
 * ============================================================
 * Scene — canvas utama Home Dashboard.
 *
 * - Hanya dipasang di route "/" — halaman modul memakai canvas
 *   kecil sendiri, jadi scene berat ini tidak membebani
 *   navigasi harian antar-modul.
 * - Maskot: MascotRobot (chibi, dari referensi ilustrasi).
 *   Ring orbit + orb warna modul adalah DEKORASI scene, bukan
 *   bagian maskot — hapus <OrbitDecor/> kalau ingin tampilan
 *   persis seperti referensi (karakter + shadow saja).
 * - Mode reduced-motion: frameloop "demand", partikel statis
 *   & lebih sedikit, semua idle animation mati.
 * ============================================================
 */

const ORB_COLORS = [MODULES[1].color, MODULES[3].color, MODULES[4].color]

/* Ring gradient + orb kecil warna modul yang mengorbit maskot */
function OrbitDecor({ tint, reduced }) {
  const ring = useRef()
  const orbs = useRef()

  useFrame((state) => {
    if (reduced) return
    const t = state.clock.elapsedTime
    if (ring.current) ring.current.rotation.z = t * 0.15
    if (orbs.current) orbs.current.rotation.y = t * 0.4
  })

  return (
    <group>
      <group ref={ring} rotation={[1.25, 0.2, 0]}>
        <mesh>
          <torusGeometry args={[1.85, 0.032, 12, 80]} />
          <SketchMatteMaterial color="#8f8672" tint={tint} rim={1.4} rimSpeed={0.16} />
        </mesh>
      </group>
      <group ref={orbs}>
        {ORB_COLORS.map((c, i) => {
          const a = (i / ORB_COLORS.length) * Math.PI * 2
          return (
            <mesh
              key={c}
              position={[Math.cos(a) * 2.15, Math.sin(a * 2) * 0.35, Math.sin(a) * 2.15]}
            >
              <sphereGeometry args={[0.08 + i * 0.02, 16, 16]} />
              <SketchMatteMaterial color={c} tint={tint} rim={1.1} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

export function Scene() {
  const { focusColor } = useModuleHover()
  const { reduced } = useReducedMotion()

  /* Kurangi jumlah partikel di perangkat kecil / mode reduced */
  const particleCount = useMemo(() => {
    const mobile =
      typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
    if (reduced) return mobile ? 220 : 500
    return mobile ? 650 : 1800
  }, [reduced])

  return (
    <Canvas
      camera={{ position: [0, 0.3, 6.2], fov: 42 }}
      dpr={[1, 2]}
      frameloop={reduced ? 'demand' : 'always'}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <ParticleField count={particleCount} reduced={reduced} />
        <group position={[0, 0.35, 0]}>
          <MascotRobot tint={focusColor} scale={0.72} reduced={reduced} />
          {/* Ring & orb mengelilingi badan (bukan wajah) */}
          <group position={[0, -0.75, 0]}>
            <OrbitDecor tint={focusColor} reduced={reduced} />
          </group>
        </group>
      </Suspense>
    </Canvas>
  )
}
