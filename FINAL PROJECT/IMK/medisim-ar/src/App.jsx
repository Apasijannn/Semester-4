import { useState, useEffect, useRef } from 'react'
import './index.css'
import SplashScreen from './screens/SplashScreen'
import ScanningScreen from './screens/ScanningScreen'
import SurfaceDetectedScreen from './screens/SurfaceDetectedScreen'
import DomainSelectionScreen from './screens/DomainSelectionScreen'
import Domain1VitalSigns from './screens/Domain1VitalSigns'
import Domain2WoundCare from './screens/Domain2WoundCare'
import Domain3IVLine from './screens/Domain3IVLine'
import CompletionScreen from './screens/CompletionScreen'

export const SCREENS = {
  SPLASH: 'splash',
  SCANNING: 'scanning',
  SURFACE_DETECTED: 'surface_detected',
  DOMAIN_SELECTION: 'domain_selection',
  DOMAIN_1: 'domain_1',
  DOMAIN_2: 'domain_2',
  DOMAIN_3: 'domain_3',
  COMPLETION: 'completion',
}

// ── Generate barrel distortion displacement map on canvas ────────────────────
// Creates a radial map where each pixel encodes its own outward displacement
// direction, producing a subtle fisheye / concave-display warp effect.
function useBarrelMap() {
  const [href, setHref] = useState(null)

  useEffect(() => {
    const W = 218, H = 100   // low-res map (SVG scales it up)
    const canvas = document.createElement('canvas')
    canvas.width  = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    const img = ctx.createImageData(W, H)

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const nx = x / (W - 1) - 0.5   // −0.5 … 0.5
        const ny = y / (H - 1) - 0.5
        const r2 = nx * nx + ny * ny    //  0 … ≈0.5 at corners
        // Barrel coefficient k: push pixels outward proportional to r²
        const k  = 0.9
        const dx = nx * r2 * k         // signed displacement, x
        const dy = ny * r2 * k         // signed displacement, y
        // Encode as 0-255: 128 = no shift, <128 = negative, >128 = positive
        const R = Math.max(0, Math.min(255, Math.round(127.5 + dx * 255)))
        const G = Math.max(0, Math.min(255, Math.round(127.5 + dy * 255)))
        const i = (y * W + x) * 4
        img.data[i]     = R
        img.data[i + 1] = G
        img.data[i + 2] = 128
        img.data[i + 3] = 255
      }
    }

    ctx.putImageData(img, 0, 0)
    setHref(canvas.toDataURL())
  }, [])

  return href
}

export default function App() {
  const [screen, setScreen]             = useState(SCREENS.SPLASH)
  const [completionData, setCompletionData] = useState(null)
  const [scanTarget, setScanTarget]     = useState(null)
  const barrelMap                       = useBarrelMap()

  const navigate = (to, data = null) => {
    if (data?.targetScreen) setScanTarget(data.targetScreen)
    if (data?.domainName)   setCompletionData(data)
    setScreen(to)
  }

  const props = { navigate, SCREENS, scanTarget }

  return (
    <>
      {/* ── Hidden SVG filter definitions ── */}
      <svg
        aria-hidden
        focusable="false"
        style={{ position: 'fixed', width: 0, height: 0, overflow: 'hidden', top: 0, left: 0 }}
      >
        <defs>
          <filter
            id="ar-lens"
            x="-4%" y="-4%" width="108%" height="108%"
            color-interpolation-filters="sRGB"
          >
            {barrelMap && (
              <feImage
                href={barrelMap}
                result="disp-map"
                x="0" y="0" width="874" height="402"
                preserveAspectRatio="none"
              />
            )}
            {barrelMap && (
              <feDisplacementMap
                in="SourceGraphic"
                in2="disp-map"
                scale="28"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            )}
          </filter>
        </defs>
      </svg>

      {/* ── Main display — barrel filter applied once to whole viewport ── */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{ filter: barrelMap ? 'url(#ar-lens)' : 'none' }}
      >
        {/* Screen content */}
        {screen === SCREENS.SPLASH           && <SplashScreen {...props} />}
        {screen === SCREENS.SCANNING         && <ScanningScreen {...props} />}
        {screen === SCREENS.SURFACE_DETECTED && <SurfaceDetectedScreen {...props} />}
        {screen === SCREENS.DOMAIN_SELECTION && <DomainSelectionScreen {...props} />}
        {screen === SCREENS.DOMAIN_1         && <Domain1VitalSigns {...props} />}
        {screen === SCREENS.DOMAIN_2         && <Domain2WoundCare {...props} />}
        {screen === SCREENS.DOMAIN_3         && <Domain3IVLine {...props} />}
        {screen === SCREENS.COMPLETION       && <CompletionScreen {...props} data={completionData} />}

        {/* ── Concave glass depth overlay ── */}
        <div className="concave-glass" />

        {/* ── Lens vignette — heavy dark edges ── */}
        <div className="lens-vignette" />

        {/* ── Subtle display scanlines ── */}
        <div className="lens-scanlines" />

        {/* ── HUD frame — teal breathing border ── */}
        <div className="hud-frame" />
      </div>
    </>
  )
}
