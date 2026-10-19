import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { ModuleObject } from './ModuleObjects'
import { useReducedMotion } from '../hooks/useReducedMotion'

/**
 * ============================================================
 * ModuleCard3D — canvas mini reusable untuk satu card modul.
 *
 * Tiap card punya Canvas kecil sendiri (ringan: beberapa mesh
 * primitif saja). `tint` di-set ke warna modul ketika card
 * aktif/hover => "ambient light" scene ber-tint ke pastel
 * modul tsb.
 *
 * Mode reduced-motion: frameloop "demand" + tanpa Float —
 * objek tampil statis, tidak ada render loop per card.
 * ============================================================
 */

export function ModuleCard3D({ module, hovered, active }) {
  const { reduced } = useReducedMotion()

  const object = (
    <ModuleObject
      shape={module.shape}
      color={module.color}
      /* Ambient ber-tint warna modul saat aktif / hover */
      tint={active || hovered ? module.color : '#ffffff'}
      hovered={!reduced && hovered}
      active={active}
      reduced={reduced}
    />
  )

  return (
    <Canvas
      camera={{ position: [0, 0.2, 3.4], fov: 40 }}
      dpr={[1, 1.5]}
      frameloop={reduced ? 'demand' : 'always'}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent', touchAction: 'pan-y' }}
    >
      <Suspense fallback={null}>
        {reduced ? (
          object
        ) : (
          <Float speed={hovered ? 3 : 1.6} rotationIntensity={0.2} floatIntensity={0.5}>
            {object}
          </Float>
        )}
      </Suspense>
    </Canvas>
  )
}
