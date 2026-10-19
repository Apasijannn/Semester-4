import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { siteConfig } from '../data/siteConfig.js'
import { damp } from '../hooks/useScrollCamera.js'

/*
  Centerpiece hero: torus knot metalik gelap yang berotasi pelan,
  dibungkus dua shell icosahedron wireframe (satu warna aksen, satu abu)
  yang berputar berlawanan arah. Semuanya geometri prosedural — tanpa
  asset eksternal. Parallax halus mengikuti posisi kursor.
*/
export default function HeroObject({ position = [0, 0, 0], scale = 1, isMobile = false }) {
  const knot = useRef()
  const shellA = useRef()
  const shellB = useRef()
  const parallax = useRef()

  useFrame((state, delta) => {
    knot.current.rotation.x += delta * 0.12
    knot.current.rotation.y += delta * 0.18
    shellA.current.rotation.y -= delta * 0.06
    shellA.current.rotation.z += delta * 0.04
    shellB.current.rotation.y += delta * 0.03
    shellB.current.rotation.x -= delta * 0.05

    parallax.current.rotation.y = damp(parallax.current.rotation.y, state.pointer.x * 0.25, 3, delta)
    parallax.current.rotation.x = damp(parallax.current.rotation.x, -state.pointer.y * 0.15, 3, delta)
  })

  // detail geometri diturunkan di mobile agar tetap ringan
  const tube = isMobile ? [110, 14] : [200, 28]
  const shellDetail = isMobile ? 0 : 1

  return (
    <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.55}>
      <group position={position} scale={scale}>
        <group ref={parallax}>
          <mesh ref={knot}>
            <torusKnotGeometry args={[1.02, 0.28, tube[0], tube[1]]} />
            <meshStandardMaterial
              color="#22252c"
              metalness={0.92}
              roughness={0.16}
              envMapIntensity={1.5}
              emissive={siteConfig.accentColor}
              emissiveIntensity={0.05}
            />
          </mesh>

          <mesh ref={shellA} scale={2.15}>
            <icosahedronGeometry args={[1, shellDetail]} />
            <meshBasicMaterial wireframe color={siteConfig.accentColor} transparent opacity={0.14} />
          </mesh>

          <mesh ref={shellB} scale={2.55}>
            <icosahedronGeometry args={[1, 0]} />
            <meshBasicMaterial wireframe color="#5a5f6a" transparent opacity={0.1} />
          </mesh>
        </group>
      </group>
    </Float>
  )
}
