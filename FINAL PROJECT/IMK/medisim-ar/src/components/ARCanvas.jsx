import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Map body part → approximate 3D world position (camera at (0,2.2,3.8) looking at (0,-0.3,0))
const BODY_PART_POSITIONS = {
  finger:     new THREE.Vector3( 1.85, -0.58, 0.15),
  upperArm:   new THREE.Vector3( 0.75,  0.08, 0.05),
  mouth:      new THREE.Vector3( 1.55,  0.52, 0.00),
  forearm:    new THREE.Vector3( 1.25, -0.28, 0.08),
  innerElbow: new THREE.Vector3( 0.65, -0.08, 0.05),
}

function buildPatientBody(scene) {
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe8c9a0, roughness: 0.7, metalness: 0 })
  const clothMat = new THREE.MeshStandardMaterial({ color: 0xc8d8e8, roughness: 0.8 })
  const group = new THREE.Group()

  // Torso (lying down, z-axis = length of body)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 1.7), clothMat)
  torso.position.set(0, -0.58, -0.1)
  group.add(torso)

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), skinMat)
  head.position.set(0, -0.48, -1.05)
  group.add(head)

  // Right arm (extended slightly outward for IV/BP access)
  const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 1.3, 10), skinMat)
  armR.rotation.z = Math.PI / 2
  armR.position.set(0.92, -0.62, -0.05)
  group.add(armR)

  // Left arm (along body)
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 1.2, 10), skinMat)
  armL.rotation.z = Math.PI / 2
  armL.position.set(-0.88, -0.62, -0.05)
  group.add(armL)

  // Legs
  const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 1.55, 10), clothMat)
  legR.position.set(0.18, -0.62, 0.82)
  group.add(legR)

  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 1.55, 10), clothMat)
  legL.position.set(-0.18, -0.62, 0.82)
  group.add(legL)

  // Examination bed surface
  const bedMat = new THREE.MeshStandardMaterial({ color: 0x3b7fc4, roughness: 0.4 })
  const bed = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 2.6), bedMat)
  bed.position.set(0, -0.72, -0.05)
  group.add(bed)

  group.rotation.x = 0.06
  scene.add(group)
}

export default function ARCanvas({ mode = 'simulation', bodyPart = 'finger' }) {
  const mountRef = useRef()

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const W = 874, H = 402
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100)
    camera.position.set(0, 2.2, 3.8)
    camera.lookAt(0, -0.3, 0)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.1))
    const blueKey = new THREE.PointLight(0x2563eb, 2.5, 10)
    blueKey.position.set(2, 3, 2)
    scene.add(blueKey)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.6)
    rimLight.position.set(-1, 2, -2)
    scene.add(rimLight)

    let ring = null, ringGlow = null
    const gridDots = []

    // ── Scanning mode: expanding dot grid ──────────────────────────────
    if (mode === 'scanning') {
      const cols = 12, rows = 7
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const geo = new THREE.SphereGeometry(0.038, 8, 8)
          const mat = new THREE.MeshBasicMaterial({ color: 0x00cc88, transparent: true, opacity: 0 })
          const dot = new THREE.Mesh(geo, mat)
          const cx = (i - (cols - 1) / 2) * 0.5
          const cz = (j - (rows - 1) / 2) * 0.44
          dot.position.set(cx, -0.78, cz)
          const dist = Math.sqrt(cx * cx + cz * cz)
          dot.userData.delay = dist * 0.55
          dot.userData.maxOpacity = 0.65 + Math.random() * 0.35
          scene.add(dot)
          gridDots.push(dot)
        }
      }
    }

    // ── Surface detected mode: settled grid + lock ring ────────────────
    if (mode === 'surface') {
      const cols = 12, rows = 7
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const geo = new THREE.SphereGeometry(0.032, 8, 8)
          const mat = new THREE.MeshBasicMaterial({ color: 0x00cc88, transparent: true, opacity: 0.55 })
          const dot = new THREE.Mesh(geo, mat)
          dot.position.set(
            (i - (cols - 1) / 2) * 0.5,
            -0.78,
            (j - (rows - 1) / 2) * 0.44
          )
          scene.add(dot)
          gridDots.push(dot)
        }
      }
      // Surface lock ring
      const lockGeo = new THREE.TorusGeometry(1.3, 0.035, 16, 80)
      const lockMat = new THREE.MeshBasicMaterial({ color: 0x00cc88, transparent: true, opacity: 0.9 })
      ring = new THREE.Mesh(lockGeo, lockMat)
      ring.rotation.x = -1.28
      ring.position.set(0, -0.68, 0)
      scene.add(ring)
    }

    // ── Simulation mode: 3D patient + AR highlight ring ─────────────────
    if (mode === 'simulation') {
      buildPatientBody(scene)

      const pos = BODY_PART_POSITIONS[bodyPart] || BODY_PART_POSITIONS.finger

      const ringGeo = new THREE.TorusGeometry(0.18, 0.018, 16, 80)
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        emissive: 0x2563eb,
        emissiveIntensity: 2.0,
        transparent: true,
        opacity: 0.95,
      })
      ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.copy(pos)
      ring.rotation.x = 0.22
      scene.add(ring)

      // Outer glow halo
      const glowGeo = new THREE.TorusGeometry(0.25, 0.006, 8, 80)
      const glowMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.28 })
      ringGlow = new THREE.Mesh(glowGeo, glowMat)
      ringGlow.position.copy(pos)
      ringGlow.rotation.x = 0.22
      scene.add(ringGlow)
    }

    const startTime = Date.now()

    const animate = () => {
      const animId = requestAnimationFrame(animate)
      el._animId = animId
      const t = (Date.now() - startTime) / 1000

      if (mode === 'scanning') {
        gridDots.forEach((dot) => {
          const phase = t - dot.userData.delay
          if (phase > 0) {
            const cycle = (phase % 2.8) / 2.8
            dot.material.opacity = dot.userData.maxOpacity * Math.sin(Math.PI * cycle)
          }
        })
      }

      if (mode === 'surface') {
        if (ring) {
          ring.material.opacity = 0.6 + 0.3 * Math.sin(t * 2.2)
          ring.scale.setScalar(1 + 0.035 * Math.sin(t * 3))
        }
        gridDots.forEach((d, i) => {
          d.material.opacity = 0.35 + 0.25 * Math.sin(t * 1.8 + i * 0.25)
        })
      }

      if (mode === 'simulation' && ring) {
        const s = 0.94 + 0.13 * Math.sin(t * Math.PI * 1.2)
        ring.scale.setScalar(s)
        ring.material.emissiveIntensity = 1.6 + 1.1 * Math.sin(t * Math.PI * 1.2)
        ring.material.opacity = 0.85 + 0.15 * Math.sin(t * Math.PI * 1.2)
        if (ringGlow) {
          ringGlow.scale.setScalar(1 + 0.18 * Math.sin(t * Math.PI))
          ringGlow.material.opacity = 0.12 + 0.22 * Math.abs(Math.sin(t * Math.PI))
        }
      }

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      if (el._animId) cancelAnimationFrame(el._animId)
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
      renderer.dispose()
      scene.clear()
    }
  }, [mode, bodyPart])

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 4 }}
    />
  )
}
