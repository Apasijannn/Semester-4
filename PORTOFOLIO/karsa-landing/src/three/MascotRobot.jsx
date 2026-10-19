import { useRef } from 'react'
import * as THREE from 'three'
import { extend, useFrame } from '@react-three/fiber'
import { Outlines, RoundedBox, shaderMaterial } from '@react-three/drei'
import { SketchMatteMaterial } from './SketchMatteMaterial'

/**
 * ============================================================
 * MascotRobot — maskot Karsa, dibangun dari primitive geometry
 * mengikuti referensi ilustrasi (robot chibi hand-drawn):
 *
 *  - kepala dome oval besar (proporsi chibi), badan telur kecil
 *  - panel telinga mint, antena bola emas, panel dada mint
 *  - bahu emas, sendi charcoal, band kaki mint→pink
 *  - mata oval hitam + highlight putih, senyum garis, blush pink
 *  - outline sketsa charcoal (inverted hull via drei <Outlines>)
 *  - drop shadow blur lembut di bawah (shader radial)
 *
 * Pose default: melayang, condong ke depan, kedua tangan terbuka
 * menyambut, kaki kanan ditekuk ke belakang — pose ini di-set
 * statis di JSX sehingga mode reduced-motion tetap menampilkan
 * pose referensi.
 *
 * Idle animation (mati saat `reduced`):
 *  - floating bob naik-turun + lean halus
 *  - tangan bergoyang pelan, kaki belakang mengayun
 *  - kepala sesekali miring seperti "mendengarkan" + ikut pointer
 *  - mata berkedip, shadow ikut "bernafas" berlawanan arah bob
 *
 * Reusable: <MascotRobot tint={...} scale={...} reduced={...} />
 * >>> SESUAIKAN warna di konstanta C di bawah. <<<
 * ============================================================
 */

/* Palet maskot — selaras dengan token pastel di src/index.css */
const C = {
  cream: '#f4edda',
  creamDim: '#eee3c9',
  mint: '#b8e0c8',
  gold: '#eecd74',
  pink: '#f2bcc7',
  charcoal: '#4a4034',
  ink: '#241e15',
}

const OUTLINE = { thickness: 0.028, color: '#4a4034', opacity: 0.85, transparent: true }

/* ---- Drop shadow: lingkaran dengan gradasi alpha radial ---- */
const ShadowBlobImpl = shaderMaterial(
  { uOpacity: 0.3, uColor: new THREE.Color('#100d09') },
  /* glsl vertex */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  /* glsl fragment */ `
  uniform float uOpacity;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float d = distance(vUv, vec2(0.5));
    float a = pow(smoothstep(0.5, 0.02, d), 1.7) * uOpacity;
    if (a < 0.005) discard;
    gl_FragColor = vec4(uColor, a);
  }
  `,
)
extend({ ShadowBlobImpl })

/* Satu mata: oval hitam + highlight putih (ikut kedip induknya) */
function Eye({ x }) {
  return (
    <group position={[x, 0, 0.93]}>
      <mesh scale={[0.8, 1.1, 0.35]}>
        <sphereGeometry args={[0.14, 20, 20]} />
        <meshBasicMaterial color={C.ink} />
      </mesh>
      {/* Kilau kecil di kanan-atas mata */}
      <mesh position={[0.045, 0.055, 0.06]}>
        <sphereGeometry args={[0.038, 12, 12]} />
        <meshBasicMaterial color="#fdfaf2" />
      </mesh>
    </group>
  )
}

/* Lengan: bahu emas → capsule cream → ring siku → tangan sarung-tangan */
function Arm({ tint }) {
  return (
    <>
      <mesh>
        <sphereGeometry args={[0.16, 18, 18]} />
        <SketchMatteMaterial color={C.gold} tint={tint} rim={0.35} />
      </mesh>
      <mesh position={[0, -0.24, 0]}>
        <capsuleGeometry args={[0.105, 0.24, 6, 14]} />
        <SketchMatteMaterial color={C.cream} tint={tint} rim={0.4} />
        <Outlines {...OUTLINE} />
      </mesh>
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 0.06, 14]} />
        <SketchMatteMaterial color={C.charcoal} tint={tint} rim={0.2} />
      </mesh>
      {/* Telapak sederhana tanpa jari (mitten) */}
      <mesh position={[0, -0.58, 0.02]} scale={[1.05, 0.85, 0.6]}>
        <sphereGeometry args={[0.17, 18, 18]} />
        <SketchMatteMaterial color={C.cream} tint={tint} rim={0.45} />
        <Outlines {...OUTLINE} />
      </mesh>
    </>
  )
}

/* Kaki: paha cream → ring charcoal → band mint → band pink → ujung bulat */
function Leg({ tint }) {
  return (
    <>
      <mesh position={[0, -0.1, 0]}>
        <capsuleGeometry args={[0.135, 0.2, 6, 14]} />
        <SketchMatteMaterial color={C.cream} tint={tint} rim={0.4} />
        <Outlines {...OUTLINE} />
      </mesh>
      <mesh position={[0, -0.27, 0]}>
        <cylinderGeometry args={[0.135, 0.13, 0.05, 14]} />
        <SketchMatteMaterial color={C.charcoal} tint={tint} rim={0.2} />
      </mesh>
      <mesh position={[0, -0.36, 0]}>
        <cylinderGeometry args={[0.135, 0.128, 0.13, 14]} />
        <SketchMatteMaterial color={C.mint} tint={tint} rim={0.35} />
      </mesh>
      <mesh position={[0, -0.47, 0]}>
        <cylinderGeometry args={[0.128, 0.12, 0.09, 14]} />
        <SketchMatteMaterial color={C.pink} tint={tint} rim={0.35} />
      </mesh>
      <mesh position={[0, -0.53, 0]} scale={[1, 0.6, 1]}>
        <sphereGeometry args={[0.12, 14, 14]} />
        <SketchMatteMaterial color={C.creamDim} tint={tint} rim={0.35} />
      </mesh>
    </>
  )
}

export function MascotRobot({ tint = '#ffffff', scale = 1, reduced = false }) {
  const bob = useRef()
  const head = useRef()
  const eyes = useRef()
  const armL = useRef()
  const armR = useRef()
  const legL = useRef()
  const legR = useRef()
  const shadowGroup = useRef()
  const shadowMat = useRef()

  useFrame((state, delta) => {
    if (reduced) return
    const t = state.clock.elapsedTime
    /* Faktor lerp WAJIB di-clamp ≤ 1 — tanpa ini, saat frame hitch
       (delta besar) target ter-overshoot dan animasi bergetar */
    const k = Math.min(delta * 3, 1)

    /* Floating bob + lean halus (loopable) */
    if (bob.current) {
      bob.current.position.y = Math.sin(t * 1.1) * 0.12
      bob.current.rotation.z = Math.sin(t * 0.8) * 0.02
      bob.current.rotation.x = 0.06 + Math.sin(t * 0.9) * 0.012
    }

    /* Kepala (pivot di sendi leher): sesekali miring "mendengarkan"
       + menoleh halus ke pointer — sudut kecil supaya dome besar
       tidak terlihat lepas dari leher */
    if (head.current) {
      const tilt = Math.pow(Math.max(Math.sin(t * 0.22), 0), 8) * 0.14
      const ty = state.pointer.x * 0.18
      const tx = -state.pointer.y * 0.1
      head.current.rotation.z += (tilt - head.current.rotation.z) * Math.min(delta * 2, 1)
      head.current.rotation.y += (ty - head.current.rotation.y) * k
      head.current.rotation.x += (tx - head.current.rotation.x) * k
    }

    /* Kedip cepat (~0.25 dtk) tiap beberapa detik */
    if (eyes.current) {
      eyes.current.scale.y = 1 - 0.9 * Math.pow(Math.abs(Math.sin(t * 0.5)), 140)
    }

    /* Tangan bergoyang pelan, fase kiri-kanan sedikit beda */
    if (armL.current) armL.current.rotation.z = -0.9 + Math.sin(t * 1.4) * 0.05
    if (armR.current) armR.current.rotation.z = 0.9 - Math.sin(t * 1.4 + 0.6) * 0.05

    /* Kaki belakang mengayun ringan */
    if (legR.current) legR.current.rotation.x = 0.8 + Math.sin(t * 1.2) * 0.06
    if (legL.current) legL.current.rotation.x = -0.12 + Math.sin(t * 1.2 + Math.PI) * 0.04

    /* Shadow "bernafas" berlawanan arah bob */
    if (shadowGroup.current) {
      const s = 1 - Math.sin(t * 1.1) * 0.08
      shadowGroup.current.scale.set(s, 1, s)
    }
    if (shadowMat.current) {
      shadowMat.current.uOpacity = 0.3 - Math.sin(t * 1.1) * 0.06
    }
  })

  return (
    <group scale={scale}>
      {/* ==================== Tubuh yang mengambang ==================== */}
      <group ref={bob} rotation={[0.06, 0, 0]}>
        {/* ---- Kepala dome besar (chibi) ----
            Pivot rotasi di SENDI LEHER (y 0.28), bukan pusat dome —
            kalau pivot di pusat, yaw/tilt membuat kepala terlihat
            "lepas" bergeser dari leher. Konten di-offset +0.67
            sehingga pusat kepala tetap di y 0.95. */}
        <group ref={head} position={[0, 0.28, 0]}>
          <group position={[0, 0.67, 0]}>
          <mesh scale={[1.1, 0.92, 0.95]}>
            <sphereGeometry args={[1, 48, 48]} />
            <SketchMatteMaterial color={C.cream} tint={tint} rim={0.5} />
            <Outlines {...OUTLINE} />
          </mesh>

          {/* Panel telinga oval mint kiri-kanan */}
          <mesh position={[-1.04, -0.04, 0]} scale={[0.32, 1.06, 0.84]}>
            <sphereGeometry args={[0.5, 24, 24]} />
            <SketchMatteMaterial color={C.mint} tint={tint} rim={0.35} />
            <Outlines {...OUTLINE} />
          </mesh>
          <mesh position={[1.04, -0.04, 0]} scale={[0.32, 1.06, 0.84]}>
            <sphereGeometry args={[0.5, 24, 24]} />
            <SketchMatteMaterial color={C.mint} tint={tint} rim={0.35} />
            <Outlines {...OUTLINE} />
          </mesh>

          {/* Antena + bola emas */}
          <mesh position={[0, 1.05, 0]}>
            <cylinderGeometry args={[0.03, 0.045, 0.38, 10]} />
            <SketchMatteMaterial color={C.charcoal} tint={tint} rim={0.2} />
          </mesh>
          <mesh position={[0, 1.3, 0]}>
            <sphereGeometry args={[0.11, 18, 18]} />
            <SketchMatteMaterial color={C.gold} tint={tint} rim={0.5} />
            <Outlines {...OUTLINE} />
          </mesh>

          {/* Mata oval + highlight (berkedip lewat scale.y) */}
          <group ref={eyes} position={[0, -0.03, 0]}>
            <Eye x={-0.37} />
            <Eye x={0.37} />
          </group>

          {/* Senyum garis lengkung sederhana */}
          <mesh position={[0, -0.28, 0.9]} rotation={[0, 0, Math.PI * 1.15]}>
            <torusGeometry args={[0.12, 0.017, 8, 24, Math.PI * 0.7]} />
            <meshBasicMaterial color={C.charcoal} />
          </mesh>

          {/* Blush pipi pink */}
          <mesh position={[-0.62, -0.28, 0.72]} rotation={[0, -0.55, 0]} scale={[1, 0.72, 0.22]}>
            <sphereGeometry args={[0.1, 14, 14]} />
            <meshBasicMaterial color={C.pink} transparent opacity={0.6} />
          </mesh>
          <mesh position={[0.62, -0.28, 0.72]} rotation={[0, 0.55, 0]} scale={[1, 0.72, 0.22]}>
            <sphereGeometry args={[0.1, 14, 14]} />
            <meshBasicMaterial color={C.pink} transparent opacity={0.6} />
          </mesh>
          </group>
        </group>

        {/* ---- Leher (sendi charcoal) ---- */}
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.24, 0.26, 0.16, 16]} />
          <SketchMatteMaterial color={C.charcoal} tint={tint} rim={0.2} />
        </mesh>

        {/* ---- Badan telur kecil ---- */}
        <group position={[0, -0.55, 0]}>
          <mesh scale={[0.72, 0.8, 0.64]}>
            <sphereGeometry args={[1, 36, 36]} />
            <SketchMatteMaterial color={C.cream} tint={tint} rim={0.45} />
            <Outlines {...OUTLINE} />
          </mesh>
          {/* Panel dada mint (layar/indikator) — z harus > permukaan
              badan (0.63 di ketinggian ini), kalau tidak panel tenggelam */}
          <RoundedBox args={[0.42, 0.3, 0.08]} radius={0.04} position={[0, 0.12, 0.62]} rotation={[-0.12, 0, 0]}>
            <SketchMatteMaterial color={C.mint} tint={tint} rim={0.3} />
          </RoundedBox>
          {/* Pinggul charcoal */}
          <mesh position={[0, -0.62, 0]}>
            <cylinderGeometry args={[0.36, 0.3, 0.16, 18]} />
            <SketchMatteMaterial color={C.charcoal} tint={tint} rim={0.2} />
          </mesh>
        </group>

        {/* ---- Lengan terbuka menyambut (pose referensi) ---- */}
        {/* rx kecil saja — kalau lengan terlalu condong ke depan,
            dari kamera depan tampak foreshortened seperti putus */}
        <group ref={armL} position={[-0.68, -0.32, 0.06]} rotation={[-0.18, 0, -0.9]}>
          <Arm tint={tint} />
        </group>
        <group ref={armR} position={[0.68, -0.32, 0.06]} rotation={[-0.18, 0, 0.9]}>
          <Arm tint={tint} />
        </group>

        {/* ---- Kaki: kiri lurus, kanan ditekuk ke belakang ---- */}
        <group ref={legL} position={[-0.28, -1.18, 0]} rotation={[-0.12, 0, 0.05]}>
          <Leg tint={tint} />
        </group>
        <group ref={legR} position={[0.28, -1.18, -0.05]} rotation={[0.8, 0, -0.05]}>
          <Leg tint={tint} />
        </group>
      </group>

      {/* ==================== Drop shadow blur di lantai ==================== */}
      <group ref={shadowGroup} position={[0, -2.08, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1.15, 0.7, 1]}>
          <circleGeometry args={[1.05, 40]} />
          <shadowBlobImpl
            ref={shadowMat}
            key={ShadowBlobImpl.key}
            transparent
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  )
}
