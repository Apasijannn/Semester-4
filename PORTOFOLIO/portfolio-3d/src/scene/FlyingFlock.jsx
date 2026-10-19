import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { siteConfig } from '../data/siteConfig.js'

/*
  "Kawanan burung" versi geometris — segitiga kecil warna aksen yang
  melintas sangat pelan di area hero, terinspirasi burung bangau pada
  referensi desain (landing page ilustratif). Tiap burung punya
  kecepatan, ketinggian, dan fase kepakan acak, lalu loop dari kiri
  ke kanan tanpa henti.
*/
export default function FlyingFlock({ count = 6 }) {
  const refs = useRef([])

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        y: 0.8 + Math.random() * 2.6, // ketinggian jelajah
        z: -3 - Math.random() * 3, // kedalaman (selalu di belakang teks hero)
        speed: 0.22 + Math.random() * 0.18,
        phase: Math.random() * Math.PI * 2,
        offset: Math.random() * 26,
        scale: 0.055 + Math.random() * 0.04,
      })),
    [count],
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    seeds.forEach((s, i) => {
      const bird = refs.current[i]
      if (!bird) return
      bird.position.x = ((s.offset + t * s.speed) % 26) - 13 // loop kiri → kanan
      bird.position.y = s.y + Math.sin(t * 1.4 + s.phase) * 0.18 // naik-turun halus
      bird.position.z = s.z
      // miring mengikuti arah "kepakan" — cone menghadap sumbu x
      bird.rotation.z = -Math.PI / 2 + Math.sin(t * 1.4 + s.phase) * 0.25
    })
  })

  return (
    <group>
      {seeds.map((s, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} scale={s.scale}>
          <coneGeometry args={[1, 2.4, 3]} />
          <meshBasicMaterial color={siteConfig.accentColor} transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  )
}
