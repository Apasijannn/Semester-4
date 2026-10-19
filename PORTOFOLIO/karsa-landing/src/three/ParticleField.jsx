import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { extend, useFrame } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'

/**
 * ============================================================
 * ParticleField — awan partikel organik (referensi C).
 *
 * Ribuan titik membentuk shell/awan lepas mengelilingi maskot,
 * warna neon-pastel (kuning-ungu-cyan) dengan glow tipis.
 * Glow dicapai lewat additive blending + falloff radial di
 * sprite — TANPA post-processing bloom, supaya ringan dan
 * glow-nya benar-benar hanya di titik partikel.
 *
 * Parallax mouse: seluruh group menoleh sangat halus mengikuti
 * pointer (subtle, bukan efek dominan).
 * ============================================================
 */

const PARTICLE_COLORS = ['#f2d785', '#c5a8e8', '#9adce8'] // kuning, ungu, cyan pastel

const ParticleMatImpl = shaderMaterial(
  { uTime: 0, uSize: 4.0 },
  /* glsl vertex */ `
  uniform float uTime;
  uniform float uSize;
  attribute float aPhase;
  attribute float aScale;
  attribute vec3 aColor;
  varying vec3 vColor;

  void main() {
    vColor = aColor;
    vec3 p = position;
    /* Undulasi halus — tiap partikel bernafas dengan fase sendiri */
    p += 0.10 * vec3(
      sin(uTime * 0.45 + aPhase),
      cos(uTime * 0.38 + aPhase * 1.31),
      sin(uTime * 0.30 + aPhase * 0.73)
    );
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    /* Titik kecil (±3–14px) — kalau kebesaran, additive blending
       menumpuk jadi putih menutupi scene */
    gl_PointSize = uSize * aScale * (14.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
  `,
  /* glsl fragment */ `
  varying vec3 vColor;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    /* Inti kecil terang + halo lembut = glow tipis per titik */
    float core = smoothstep(0.16, 0.02, d);
    float halo = smoothstep(0.5, 0.08, d) * 0.25;
    float a = core + halo;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
    #include <colorspace_fragment>
  }
  `,
)

extend({ ParticleMatImpl })

/* `reduced` = matikan undulasi + parallax (partikel jadi statis) */
export function ParticleField({ count = 1800, radius = 3.1, reduced = false }) {
  const group = useRef()
  const mat = useRef()

  const { positions, phases, scales, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    const scales = new Float32Array(count)
    const colors = new Float32Array(count * 3)
    const c = new THREE.Color()

    for (let i = 0; i < count; i++) {
      /* Arah acak di bola */
      const theta = Math.random() * Math.PI * 2
      const cosPhi = Math.random() * 2 - 1
      const sinPhi = Math.sqrt(1 - cosPhi * cosPhi)
      const dir = new THREE.Vector3(
        sinPhi * Math.cos(theta),
        cosPhi,
        sinPhi * Math.sin(theta),
      )

      /* Radius dimodulasi "noise" sum-of-sines => bentuk organik
         (gumpalan seperti awan data / otak, bukan bola sempurna) */
      const n =
        Math.sin(dir.x * 3.1 + dir.y * 1.7) * 0.5 +
        Math.sin(dir.y * 2.3 - dir.z * 2.9) * 0.35 +
        Math.sin(dir.z * 4.1 + dir.x * 1.3) * 0.25
      const r = radius * (1 + 0.28 * n) + Math.random() * 1.4

      positions[i * 3 + 0] = dir.x * r
      positions[i * 3 + 1] = dir.y * r * 0.72 /* sedikit gepeng, komposisi lanskap */
      positions[i * 3 + 2] = dir.z * r - 0.6 /* dorong ke belakang maskot */

      phases[i] = Math.random() * Math.PI * 2
      scales[i] = 0.35 + Math.random() * Math.random() * 1.3

      c.set(PARTICLE_COLORS[i % PARTICLE_COLORS.length])
      /* Variasi kecerahan biar tidak seragam */
      const v = 0.65 + Math.random() * 0.35
      colors[i * 3 + 0] = c.r * v
      colors[i * 3 + 1] = c.g * v
      colors[i * 3 + 2] = c.b * v
    }
    return { positions, phases, scales, colors }
  }, [count, radius])

  useFrame((state, delta) => {
    if (reduced) return
    if (mat.current) mat.current.uTime = state.clock.elapsedTime
    if (!group.current) return
    /* Rotasi idle sangat pelan + parallax mengikuti mouse (subtle).
       Faktor lerp di-clamp ≤ 1 agar tidak overshoot saat frame hitch */
    const k = Math.min(delta * 2, 1)
    group.current.rotation.y += delta * 0.02
    const tx = -state.pointer.y * 0.12
    const tz = state.pointer.x * 0.06
    group.current.rotation.x += (tx - group.current.rotation.x) * k
    group.current.rotation.z += (tz - group.current.rotation.z) * k
  })

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
          <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
          <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        </bufferGeometry>
        <particleMatImpl
          ref={mat}
          key={ParticleMatImpl.key}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
