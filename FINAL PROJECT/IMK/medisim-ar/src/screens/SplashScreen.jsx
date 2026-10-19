import { motion } from 'framer-motion'
import { BG_ROOM_PLAIN } from '../data/domains'

// Logo image from Figma (image 4 node — 93×93 teal cross mark)
const LOGO_IMG = 'https://www.figma.com/api/mcp/asset/4c58ed41-a7a4-4823-9218-19f366247f98'

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

export default function SplashScreen({ navigate, SCREENS }) {
  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
      {/* ── Room background — no tint, exact Figma photo ── */}
      <img
        src={BG_ROOM_PLAIN}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* ── Top-right icons (settings + menu) ── */}
      <div className="absolute flex items-center gap-1.5" style={{ top: 10, right: 12, zIndex: 10 }}>
        <SettingsIcon />
        <MenuDotsIcon />
      </div>

      {/* ── Center card ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative',
          zIndex: 5,
          background: 'rgba(255, 251, 251, 0.80)',
          backdropFilter: 'blur(7.5px)',
          WebkitBackdropFilter: 'blur(7.5px)',
          borderRadius: 10,
          boxShadow: '0px 10px 4px 0px rgba(0,0,0,0.25)',
          width: 300,
          padding: '28px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        {/* Logo row: image + "MediSim AR" */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={LOGO_IMG}
            alt="MediSim logo"
            style={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0 }}
          />
          <div style={{ lineHeight: 1 }}>
            <span style={{
              fontFamily: "'Open Sans', 'Inter', sans-serif",
              fontWeight: 700,
              fontSize: 30,
              color: '#009985',
              letterSpacing: -0.5,
            }}>
              MediSim
            </span>
            <span style={{
              fontFamily: "'Open Sans', 'Inter', sans-serif",
              fontWeight: 300,
              fontSize: 30,
              color: '#7a7474',
              letterSpacing: -0.5,
            }}>
              {' '}AR
            </span>
          </div>
        </div>

        {/* Subtitle */}
        <p style={{
          fontFamily: "'Open Sans', 'Inter', sans-serif",
          fontWeight: 300,
          fontSize: 14,
          color: '#000',
          textAlign: 'center',
          margin: 0,
        }}>
          Practice - Learn - Save Lives
        </p>

        {/* Start button */}
        <motion.button
          whileHover={{ background: 'rgba(100, 175, 165, 0.80)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(SCREENS.DOMAIN_SELECTION)}
          style={{
            background: 'rgba(127, 193, 183, 0.68)',
            borderRadius: 5,
            boxShadow: '0px 4px 4px 0px rgba(0,0,0,0.25)',
            padding: '8px 0',
            width: 135,
            fontSize: 14,
            color: '#000',
            fontFamily: "'Open Sans', 'Inter', sans-serif",
            fontWeight: 400,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Start
        </motion.button>
      </motion.div>
    </div>
  )
}
