import { motion } from 'framer-motion'
import { BG_ROOM_PLAIN, DOMAINS } from '../data/domains'

// ── Figma icon assets (from node 449:1022) ───────────────────────────────────
// Vital Signs — hugeicons/activity-04 (elements inner layer)
const ICON_VITAL = 'https://www.figma.com/api/mcp/asset/54e9e63f-52b8-4609-9fb1-c309f68610c1'
// Wound Care — Line Duotone/Adhesive Plaster (5 stacked vector layers)
const ICON_WOUND_V1 = 'https://www.figma.com/api/mcp/asset/2a04da0d-4412-4944-a99e-a211b95b08ee'
const ICON_WOUND_V2 = 'https://www.figma.com/api/mcp/asset/bb09b279-95b2-40c0-a46a-9fb2798ab47f'
const ICON_WOUND_V3 = 'https://www.figma.com/api/mcp/asset/b71c60fb-b715-4bb3-8080-976c89dedb7e'
const ICON_WOUND_V4 = 'https://www.figma.com/api/mcp/asset/26b9763a-0b62-419a-9d57-55ebdaf453e2'
const ICON_WOUND_V5 = 'https://www.figma.com/api/mcp/asset/79e3ee8f-65ff-4e80-aa96-f1c1dc281a56'
// IV Line — hugeicons/blood-bottle (elements inner layer, mirrored)
const ICON_IV = 'https://www.figma.com/api/mcp/asset/204e7932-ee59-4bb9-b38f-dc647b12271b'

// ── Top-right icons (identical to SplashScreen) ──────────────────────────────
function SettingsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function MenuDotsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="2.5" width="19" height="19" rx="4" stroke="#555" strokeWidth="1.4" />
      <circle cx="12" cy="7.5"  r="1.4" fill="#555" />
      <circle cx="12" cy="12"   r="1.4" fill="#555" />
      <circle cx="12" cy="16.5" r="1.4" fill="#555" />
    </svg>
  )
}

// ── Domain icon components — reconstructed from Figma inset/layer data ────────
function VitalSignsIcon() {
  return (
    <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: '10.42%' }}>
        <div style={{ position: 'absolute', inset: '-2.43%' }}>
          <img alt="" src={ICON_VITAL}
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'fill' }} />
        </div>
      </div>
    </div>
  )
}

function WoundCareIcon() {
  return (
    <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0, overflow: 'clip' }}>
      {[ICON_WOUND_V1, ICON_WOUND_V2].map((src, i) => (
        <div key={i} style={{ position: 'absolute', inset: '8.33%' }}>
          <div style={{ position: 'absolute', inset: '-1.73%' }}>
            <img alt="" src={src} style={{ display: 'block', width: '100%', height: '100%' }} />
          </div>
        </div>
      ))}
      <div style={{ position: 'absolute', top: '37.2%', right: '33.03%', bottom: '33.03%', left: '37.2%' }}>
        <img alt="" src={ICON_WOUND_V3}
          style={{ position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%' }} />
      </div>
      <div style={{ position: 'absolute', top: '33.33%', right: '29.17%', bottom: '29.17%', left: '33.33%' }}>
        <img alt="" src={ICON_WOUND_V4}
          style={{ position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%' }} />
      </div>
      <div style={{ position: 'absolute', top: '48.8%', right: '44.63%', bottom: '44.63%', left: '48.8%' }}>
        <img alt="" src={ICON_WOUND_V5}
          style={{ position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%' }} />
      </div>
    </div>
  )
}

function IVLineIcon() {
  return (
    <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0, overflow: 'clip' }}>
      <div style={{
        position: 'absolute', top: '8.33%', bottom: '8.33%', left: '16.67%', right: '16.67%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ transform: 'scaleX(-1)', position: 'relative', width: '100%', height: '100%' }}>
          <div style={{ position: 'absolute', top: '-2.31%', right: '-2.89%', bottom: '-2.31%', left: '-2.88%' }}>
            <img alt="" src={ICON_IV} style={{ display: 'block', width: '100%', height: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Icon + navigation mapping ─────────────────────────────────────────────────
const DOMAIN_CONFIG = [
  { id: 'vital-signs', screen: 'DOMAIN_1', icon: <VitalSignsIcon /> },
  { id: 'wound-care',  screen: 'DOMAIN_2', icon: <WoundCareIcon /> },
  { id: 'iv-line',     screen: 'DOMAIN_3', icon: <IVLineIcon /> },
]

// ── Screen ────────────────────────────────────────────────────────────────────
export default function DomainSelectionScreen({ navigate, SCREENS }) {
  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
      {/* Background — same clean clinic room, no dark overlay */}
      <img src={BG_ROOM_PLAIN} alt="" className="absolute inset-0 w-full h-full object-cover" />

      {/* Top-right icons */}
      <div className="absolute flex items-center gap-1.5" style={{ top: 10, right: 12, zIndex: 10 }}>
        <SettingsIcon />
        <MenuDotsIcon />
      </div>

      {/* ── Main card: 383 × 329px centered (from Figma landscape coords) ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative',
          zIndex: 5,
          background: 'rgba(233, 233, 233, 0.80)',
          backdropFilter: 'blur(7.5px)',
          WebkitBackdropFilter: 'blur(7.5px)',
          borderRadius: 10,
          boxShadow: '0px 10px 30px 0px rgba(0,0,0,0.15)',
          width: 383,
          height: 329,
          padding: '20px 18px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* Title */}
        <p style={{
          fontFamily: "'Open Sans', 'Inter', sans-serif",
          fontWeight: 700,
          fontSize: 24,
          color: '#1da291',
          margin: 0,
          lineHeight: 1.1,
          textAlign: 'center',
        }}>
          Select a Domain
        </p>

        {/* Subtitle */}
        <p style={{
          fontFamily: "'Open Sans', 'Inter', sans-serif",
          fontWeight: 300,
          fontSize: 12,
          color: '#000',
          margin: 0,
          textAlign: 'center',
        }}>
          Choose a clinical skill to start simulation
        </p>

        {/* 3 Domain cards — horizontal row */}
        <div style={{
          display: 'flex',
          gap: 14,
          flex: 1,
          width: '100%',
          alignItems: 'stretch',
        }}>
          {DOMAIN_CONFIG.map((cfg, i) => {
            const domain = DOMAINS.find((d) => d.id === cfg.id)
            return (
              <motion.button
                key={cfg.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 1.025, boxShadow: '0px 8px 20px 0px rgba(0,0,0,0.22)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(SCREENS.SCANNING, { targetScreen: SCREENS[cfg.screen] })}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.85)',
                  borderRadius: 10,
                  boxShadow: '0px 4px 4px 0px rgba(0,0,0,0.25)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: '14px 8px',
                }}
              >
                {cfg.icon}

                <p style={{
                  fontFamily: "'Open Sans', 'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#000',
                  textAlign: 'center',
                  margin: 0,
                  lineHeight: 1.25,
                }}>
                  {cfg.id === 'iv-line' ? (
                    <>IV Line<br />Placement</>
                  ) : domain.name}
                </p>

                <p style={{
                  fontFamily: "'Open Sans', 'Inter', sans-serif",
                  fontWeight: 300,
                  fontSize: 11.5,
                  color: '#000',
                  textAlign: 'center',
                  margin: 0,
                  lineHeight: 1.4,
                }}>
                  {domain.description}
                </p>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
