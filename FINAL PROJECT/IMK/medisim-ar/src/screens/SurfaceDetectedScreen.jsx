import { motion } from 'framer-motion'
import { BG_ROOM_PLAIN } from '../data/domains'

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

// Corner bracket markers — same positions as ScanningScreen
const BRACKETS = [
  { key: 'tl', style: { left:  'calc(14% - 14px)', top:    'calc(47% - 14px)' }, d: 'M14 0 L0 0 L0 14' },
  { key: 'tr', style: { right: 'calc(2%  - 14px)', top:    'calc(47% - 14px)' }, d: 'M0 0 L14 0 L14 14' },
  { key: 'bl', style: { left:  'calc(14% - 14px)', bottom: 'calc(3%  - 14px)' }, d: 'M0 0 L0 14 L14 14' },
  { key: 'br', style: { right: 'calc(2%  - 14px)', bottom: 'calc(3%  - 14px)' }, d: 'M0 14 L14 14 L14 0' },
]

export default function SurfaceDetectedScreen({ navigate, SCREENS, scanTarget }) {
  const handleTap = () => navigate(scanTarget || SCREENS.DOMAIN_SELECTION)

  return (
    <div
      className="relative w-full h-full overflow-hidden cursor-pointer"
      onClick={handleTap}
    >
      {/* Background — clean, no dark overlay */}
      <img src={BG_ROOM_PLAIN} alt="" className="absolute inset-0 w-full h-full object-cover" />

      {/* ── Teal table overlay with white dot grid ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="absolute overflow-hidden"
        style={{
          left: '14%', top: '47%', right: '2%', bottom: '3%',
          background: 'rgba(0,166,147,0.52)',
          border: '2px dashed rgba(255,255,255,0.90)',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.80) 2.5px, transparent 2.5px)',
          backgroundSize: '22px 22px',
        }}
      />

      {/* ── Corner bracket markers ── */}
      {BRACKETS.map(({ key, style, d }) => (
        <div key={key} className="absolute pointer-events-none" style={style}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d={d} stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ))}

      {/* ── Status card — same position as scanning card ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        style={{
          position: 'absolute',
          top: 68,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          background: 'rgba(255, 251, 251, 0.82)',
          backdropFilter: 'blur(7.5px)',
          WebkitBackdropFilter: 'blur(7.5px)',
          borderRadius: 10,
          boxShadow: '0px 4px 16px rgba(0,0,0,0.15)',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minWidth: 240,
          pointerEvents: 'none',
        }}
      >
        {/* Teal circle checkmark icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.25, type: 'spring', damping: 14, stiffness: 280 }}
          style={{ flexShrink: 0 }}
        >
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <circle cx="15" cy="15" r="13" stroke="#009985" strokeWidth="2.2" fill="none" />
            <motion.path
              d="M8.5 15 L13 19.5 L21.5 10.5"
              stroke="#009985"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
            />
          </svg>
        </motion.div>

        <div>
          <p style={{
            fontFamily: "'Open Sans', 'Inter', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            color: '#009985',
            margin: 0,
            lineHeight: 1.2,
          }}>
            Surface Detected
          </p>
          <p style={{
            fontFamily: "'Open Sans', 'Inter', sans-serif",
            fontWeight: 300,
            fontSize: 11.5,
            color: '#555',
            margin: 0,
            marginTop: 2,
          }}>
            Tap to place patient
          </p>
        </div>
      </motion.div>

      {/* Top-right icons */}
      <div className="absolute flex items-center gap-1.5" style={{ top: 10, right: 12, zIndex: 10 }}>
        <SettingsIcon />
        <MenuDotsIcon />
      </div>
    </div>
  )
}
