import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { siteConfig } from '../data/siteConfig.js'

// Tekstur radial-gradient dibuat prosedural — tanpa file gambar.
function makeGlowTexture(color) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const c = new THREE.Color(color)
  const rgb = `${(c.r * 255) | 0}, ${(c.g * 255) | 0}, ${(c.b * 255) | 0}`
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, `rgba(${rgb}, 0.55)`)
  g.addColorStop(0.4, `rgba(${rgb}, 0.16)`)
  g.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

/*
  Glow lembut warna aksen di belakang objek hero — padanan dari cahaya
  matahari terbenam di belakang gunung pada referensi. "Bernapas" pelan
  (scale + opacity) supaya scene terasa hidup meski tanpa input.
*/
export default function GlowBackdrop({ position = [0, 0, -5], scale = 7 }) {
  const ref = useRef()
  const texture = useMemo(() => makeGlowTexture(siteConfig.accentColor), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const s = scale * (1 + Math.sin(t * 0.35) * 0.045)
    ref.current.scale.set(s, s, 1)
    ref.current.material.opacity = 0.3 + Math.sin(t * 0.5) * 0.05
  })

  return (
    <mesh ref={ref} position={position}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.32}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
