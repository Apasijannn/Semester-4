import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { siteConfig } from '../data/siteConfig.js'

// Sebaran titik acak dalam kotak lebar, selalu di belakang konten (z < -2)
// supaya tidak pernah lewat terlalu dekat dengan kamera.
function makePositions(count) {
  const arr = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    arr[i * 3] = (Math.random() - 0.5) * 26 // x
    arr[i * 3 + 1] = (Math.random() - 0.5) * 20 // y
    arr[i * 3 + 2] = -2 - Math.random() * 11 // z
  }
  return arr
}

/*
  Ambience latar: dua lapis partikel halus (abu netral + sedikit aksen)
  dengan additive blending dan drift sangat pelan. Jumlah partikel
  dikurangi otomatis di mobile (lihat Scene.jsx).
*/
export default function ParticleField({ count = 800 }) {
  const group = useRef()
  const accent = useRef()

  const mainPositions = useMemo(() => makePositions(count), [count])
  const accentPositions = useMemo(() => makePositions(Math.max(20, Math.floor(count / 7))), [count])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    group.current.rotation.y = Math.sin(t * 0.04) * 0.06
    group.current.position.x = Math.sin(t * 0.05) * 0.5
    accent.current.rotation.y = -Math.sin(t * 0.03) * 0.08
  })

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[mainPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color="#8f939c"
          transparent
          opacity={0.4}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <points ref={accent}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[accentPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color={siteConfig.accentColor}
          transparent
          opacity={0.45}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
