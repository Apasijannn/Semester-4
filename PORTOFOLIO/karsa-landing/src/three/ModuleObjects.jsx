import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { SketchMatteMaterial } from './SketchMatteMaterial'

/**
 * ============================================================
 * ModuleObjects — objek 3D mini playful/toylike per modul
 * (referensi D), semuanya matte hand-drawn.
 *
 * Dipakai oleh ModuleCard3D (versi kecil di card carousel)
 * dan FeatureSplit (versi besar di section detail).
 *
 * Menambah modul baru? Tambahkan case baru di SHAPES lalu
 * referensikan lewat property `shape` di src/data/modules.js.
 * ============================================================
 */

/* ---------- Bentuk: grid widget (Dashboard) ---------- */
function DashboardShape({ color, tint }) {
  return (
    <group>
      {[
        { p: [-0.42, 0.42, 0], s: [0.7, 0.7, 0.3] },
        { p: [0.45, 0.35, 0.06], s: [0.55, 0.55, 0.3] },
        { p: [-0.38, -0.45, 0.04], s: [0.6, 0.5, 0.3] },
        { p: [0.42, -0.42, 0], s: [0.62, 0.62, 0.3] },
      ].map((b, i) => (
        <RoundedBox key={i} args={b.s} radius={0.08} position={b.p}>
          <SketchMatteMaterial
            color={i % 2 ? '#f6efdd' : color}
            tint={tint}
            rim={0.8}
          />
        </RoundedBox>
      ))}
    </group>
  )
}

/* ---------- Bentuk: hati (Health Manager) ---------- */
function HeartShape({ color, tint }) {
  const geo = useMemo(() => {
    const x = 0
    const y = 0
    const s = new THREE.Shape()
    s.moveTo(x + 5, y + 5)
    s.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y)
    s.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7)
    s.bezierCurveTo(x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19)
    s.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7)
    s.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y)
    s.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5)
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 4.5,
      bevelEnabled: true,
      bevelThickness: 1.4,
      bevelSize: 1.4,
      bevelSegments: 4,
      steps: 1,
    })
    g.center()
    return g
  }, [])

  /* Bentuk hati three.js digambar terbalik => putar 180° */
  return (
    <mesh geometry={geo} rotation={[0, 0, Math.PI]} scale={0.055}>
      <SketchMatteMaterial color={color} tint={tint} rim={0.9} />
    </mesh>
  )
}

/* ---------- Bentuk: tumpukan koin (Finance Manager) ---------- */
function CoinsShape({ color, tint }) {
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[i * 0.06 - 0.12, -0.55 + i * 0.19, 0]}
          rotation={[0, i * 0.5, 0]}
        >
          <cylinderGeometry args={[0.52, 0.52, 0.16, 28]} />
          <SketchMatteMaterial color={color} tint={tint} rim={0.85} />
        </mesh>
      ))}
      {/* Satu koin berdiri, menyender ke tumpukan */}
      <mesh position={[0.45, 0.28, 0.15]} rotation={[Math.PI / 2, 0, -0.45]}>
        <cylinderGeometry args={[0.5, 0.5, 0.14, 28]} />
        <SketchMatteMaterial color="#f6efdd" tint={tint} rim={0.9} />
      </mesh>
    </group>
  )
}

/* ---------- Bentuk: papan tugas + centang (Task Manager) ---------- */
function ChecklistShape({ color, tint }) {
  const tickGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.85, 0.2)
    s.lineTo(-0.2, -0.45)
    s.lineTo(0.85, 0.6)
    s.lineTo(0.6, 0.85)
    s.lineTo(-0.2, 0.05)
    s.lineTo(-0.6, 0.45)
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2,
      steps: 1,
    })
    g.center()
    return g
  }, [])

  return (
    <group>
      {/* Papan clipboard */}
      <RoundedBox args={[1.35, 1.7, 0.16]} radius={0.09} position={[0, 0, -0.15]}>
        <SketchMatteMaterial color="#f6efdd" tint={tint} rim={0.75} />
      </RoundedBox>
      {/* Penjepit atas */}
      <RoundedBox args={[0.5, 0.22, 0.24]} radius={0.07} position={[0, 0.82, -0.1]}>
        <SketchMatteMaterial color={color} tint={tint} rim={0.85} />
      </RoundedBox>
      {/* Centang besar */}
      <mesh geometry={tickGeo} scale={0.62} position={[0, -0.08, 0.12]}>
        <SketchMatteMaterial color={color} tint={tint} rim={1.0} />
      </mesh>
    </group>
  )
}

/* ---------- Bentuk: jar krim (Skincare AI) ---------- */
function JarShape({ color, tint }) {
  return (
    <group>
      {/* Badan jar */}
      <mesh position={[0, -0.28, 0]}>
        <cylinderGeometry args={[0.62, 0.55, 0.85, 28]} />
        <SketchMatteMaterial color={color} tint={tint} rim={0.85} />
      </mesh>
      {/* Tutup */}
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.66, 0.66, 0.3, 28]} />
        <SketchMatteMaterial color="#f6efdd" tint={tint} rim={0.9} />
      </mesh>
      {/* Gelembung kecil di sekitar (kesan lembut) */}
      <mesh position={[0.75, 0.55, 0.15]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <SketchMatteMaterial color="#f6efdd" tint={tint} rim={1.1} />
      </mesh>
      <mesh position={[-0.7, 0.05, 0.3]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <SketchMatteMaterial color={color} tint={tint} rim={1.1} />
      </mesh>
    </group>
  )
}

const SHAPES = {
  dashboard: DashboardShape,
  heart: HeartShape,
  coins: CoinsShape,
  checklist: ChecklistShape,
  jar: JarShape,
}

/**
 * ModuleObject — wrapper animasi untuk semua bentuk.
 *  - selalu berputar sangat pelan (idle)
 *  - hovered => bounce + putaran lebih hidup
 *  - active  => sedikit lebih besar
 *  - reduced => tanpa animasi sama sekali (statis, hemat resource)
 */
export function ModuleObject({
  shape,
  color,
  tint = '#ffffff',
  hovered = false,
  active = false,
  scale = 1,
  reduced = false,
}) {
  const group = useRef()
  const Shape = SHAPES[shape] ?? DashboardShape
  const targetScale = scale * (active ? 1.12 : 1) * (hovered ? 1.05 : 1)

  useFrame((state, delta) => {
    if (!group.current || reduced) return
    const t = state.clock.elapsedTime
    const g = group.current

    /* Putaran idle pelan; lebih cepat saat hover */
    g.rotation.y += delta * (hovered ? 1.6 : 0.35)

    /* Bounce ringan saat hover */
    const targetY = hovered ? Math.sin(t * 6) * 0.09 : 0
    g.position.y += (targetY - g.position.y) * Math.min(delta * 8, 1)

    /* Scale-up halus saat jadi card aktif */
    g.scale.x += (targetScale - g.scale.x) * Math.min(delta * 6, 1)
    g.scale.y = g.scale.x
    g.scale.z = g.scale.x
  })

  return (
    /* Mode reduced: scale final dipasang langsung, tanpa lerp */
    <group ref={group} scale={reduced ? targetScale : undefined}>
      <Shape color={color} tint={tint} />
    </group>
  )
}
