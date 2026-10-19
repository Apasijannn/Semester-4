import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Float, Html, useCursor } from '@react-three/drei'
import { siteConfig } from '../data/siteConfig.js'
import { CATEGORY_META } from '../data/projects.js'

const ACCENT = siteConfig.accentColor
const _scale = new THREE.Vector3()

// Glyph wireframe kecil sesuai kategori project (dev/game/design)
function CategoryGlyph({ category, hovered }) {
  const ref = useRef()
  useFrame((_, delta) => {
    ref.current.rotation.y += delta * (hovered ? 1.2 : 0.4)
  })
  return (
    <mesh ref={ref} position={[0, 0.42, 0.1]} scale={0.16}>
      {category === 'dev' && <boxGeometry args={[1, 1, 1]} />}
      {category === 'game' && <octahedronGeometry args={[0.8, 0]} />}
      {category === 'design' && <torusGeometry args={[0.55, 0.2, 8, 24]} />}
      <meshBasicMaterial wireframe color={ACCENT} transparent opacity={hovered ? 0.95 : 0.55} />
    </mesh>
  )
}

/*
  Kartu project 3D melayang (drei <Float>).
  - Hover  : scale-up halus + glow emissive warna aksen
  - Klik   : buka modal detail (state di-lift ke App lewat onSelect)
  - Teks   : drei <Html> screen-space agar selalu tajam.
    Jika ukuran teks terasa terlalu besar/kecil, sesuaikan `distanceFactor`.
*/
export default function ProjectCard3D({ project, position, scale = 1, onSelect, dense = false }) {
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  const group = useRef()
  const body = useRef()
  const strip = useRef()

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-9 * delta)
    const s = scale * (hovered ? 1.06 : 1)
    group.current.scale.lerp(_scale.set(s, s, s), k)

    const mat = body.current.material
    mat.emissiveIntensity += ((hovered ? 0.45 : 0.06) - mat.emissiveIntensity) * k
    strip.current.material.opacity += ((hovered ? 1 : 0.45) - strip.current.material.opacity) * k
  })

  return (
    <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.3}>
      <group
        ref={group}
        position={position}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation()
          // abaikan klik yang sebenarnya adalah drag orbit
          if (e.delta < 8) onSelect(project)
        }}
      >
        {/* panel utama */}
        <mesh ref={body}>
          <boxGeometry args={[2.3, 1.35, 0.07]} />
          <meshStandardMaterial
            color="#171a20"
            metalness={0.55}
            roughness={0.4}
            envMapIntensity={0.9}
            emissive={ACCENT}
            emissiveIntensity={0.06}
          />
        </mesh>

        {/* garis aksen di tepi bawah kartu */}
        <mesh ref={strip} position={[0, -0.635, 0.045]}>
          <planeGeometry args={[2.3, 0.035]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.45} />
        </mesh>

        <CategoryGlyph category={project.category} hovered={hovered} />

        {/* teks kartu — pointer-events dimatikan agar hover/klik jatuh ke mesh */}
        <Html
          center
          position={[0, -0.14, 0.1]}
          distanceFactor={9}
          zIndexRange={[10, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className={`pointer-events-none select-none text-center ${dense ? 'w-36' : 'w-44'}`}>
            <p className="mb-1 text-[9px] uppercase tracking-[0.25em] text-accent/90">
              {CATEGORY_META[project.category].label}
            </p>
            <h3 className={`font-semibold text-paper ${dense ? 'text-[13px]' : 'text-[15px]'}`}>
              {project.title}
            </h3>
            <p className={`mt-1 leading-snug text-muted line-clamp-2 ${dense ? 'text-[9px]' : 'text-[11px]'}`}>
              {project.description}
            </p>
          </div>
        </Html>
      </group>
    </Float>
  )
}
