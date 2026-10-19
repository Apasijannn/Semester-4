import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { extend, useFrame } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'

/**
 * ============================================================
 * SketchMatteMaterial — material khas Karsa.
 *
 * Kenapa custom shader, bukan MeshStandardMaterial?
 *  - Shading half-lambert + sedikit "step" => rasa ilustrasi/
 *    toon matte, bukan plastik 3D generik.
 *  - Rim-light fresnel dengan palet pastel yang HUE-nya
 *    berputar pelan (referensi A) — tidak bisa didapat dari
 *    material bawaan.
 *  - Grain noise prosedural di permukaan => kesan kertas /
 *    hand-drawn tanpa perlu texture file.
 *  - uTint = warna ambient dinamis (mengikuti modul aktif).
 * ============================================================
 */

const SketchMatteImpl = shaderMaterial(
  {
    uColor: new THREE.Color('#f6efdd'),
    uTint: new THREE.Color('#ffffff'),
    uTime: 0,
    uRimStrength: 0.9, // 0 = tanpa rim, ~1.2 = rim sangat terlihat
    uRimSpeed: 0.1, // kecepatan rotasi hue gradient rim
    uGrain: 0.035, // intensitas noise permukaan
  },
  /* glsl vertex */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = viewMatrix * worldPos;
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
  `,
  /* glsl fragment */ `
  uniform vec3 uColor;
  uniform vec3 uTint;
  uniform float uTime;
  uniform float uRimStrength;
  uniform float uRimSpeed;
  uniform float uGrain;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;

  /* Hash sederhana untuk grain kertas */
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  /* Palet pastel berputar (cos-palette, offset tinggi = pastel lembut) */
  vec3 pastel(float t) {
    return 0.78 + 0.22 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewDir);
    vec3 L = normalize(vec3(0.45, 0.85, 0.55)); // arah "matahari" soft

    /* Half-lambert lalu dilembutkan ke arah toon (2 langkah samar) */
    float diff = dot(N, L) * 0.5 + 0.5;
    float toon = smoothstep(0.25, 0.85, diff) * 0.8 + 0.2;
    diff = mix(diff, toon, 0.55);

    /* Bayangan di-tint warna ambient modul aktif */
    vec3 shade = mix(uTint * 0.5, vec3(1.0), diff);
    vec3 col = uColor * shade;

    /* Rim-light gradient pastel yang berputar pelan.
       Ikut posisi Y/X objek supaya gradasinya "mengalir" di badan */
    float fres = pow(1.0 - max(dot(N, V), 0.0), 2.4);
    vec3 rim = pastel(uTime * uRimSpeed + vWorldPos.y * 0.12 + vWorldPos.x * 0.05);
    col += rim * fres * uRimStrength;

    /* Grain kertas statis menempel di permukaan */
    float g = (hash(floor(vWorldPos.xy * 96.0) + floor(vWorldPos.z * 37.0)) - 0.5) * uGrain;
    col += g;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
  `,
)

extend({ SketchMatteImpl })

/**
 * Pemakaian:
 *   <mesh geometry={...}>
 *     <SketchMatteMaterial color="#b5e0c4" rim={0.7} />
 *   </mesh>
 *
 * props:
 *  - color : warna dasar objek
 *  - tint  : warna ambient dinamis (default putih = netral)
 *  - rim   : kekuatan rim-light gradient
 *  - grain : intensitas noise permukaan
 */
export function SketchMatteMaterial({
  color = '#f6efdd',
  tint = '#ffffff',
  rim = 0.9,
  rimSpeed = 0.1,
  grain = 0.035,
}) {
  const ref = useRef()
  /* Uniform warna harus objek THREE.Color (bukan string) */
  const colorObj = useMemo(() => new THREE.Color(color), [color])

  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.uTime = state.clock.elapsedTime
    /* Lerp tint agar transisi warna ambient antar-modul halus */
    ref.current.uTint.lerp(tempColor.set(tint), Math.min(delta * 4, 1))
  })

  return (
    <sketchMatteImpl
      ref={ref}
      key={SketchMatteImpl.key}
      uColor={colorObj}
      uRimStrength={rim}
      uRimSpeed={rimSpeed}
      uGrain={grain}
    />
  )
}

const tempColor = new THREE.Color()
