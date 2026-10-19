import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { BG_ROOM_PLAIN } from '../data/domains'
import MediAIPanel from '../components/MediAIPanel'

const DOMAIN_COLORS = {
  'vital-signs': '#e53e3e',
  'wound-care':  '#d97706',
  'iv-line':     '#2563eb',
}

const DOMAIN_ICONS = {
  'vital-signs': '❤️',
  'wound-care':  '🩹',
  'iv-line':     '💉',
}

export default function CompletionScreen({ navigate, SCREENS, data }) {
  const launched = useRef(false)

  const domainId   = data?.domainId   || 'vital-signs'
  const domainName = data?.domainName || 'Simulation'
  const completion = data?.completion || {}
  const mediSummary = data?.mediSummary || []
  const color       = DOMAIN_COLORS[domainId] || '#2563eb'
  const icon        = DOMAIN_ICONS[domainId]  || '✅'

  useEffect(() => {
    if (launched.current) return
    launched.current = true
    const end = Date.now() + 2800
    const fire = () => {
      confetti({
        particleCount: 55,
        spread: 80,
        origin: { x: Math.random() * 0.6 + 0.2, y: 0.45 },
        colors: [color, '#009985', '#ffffff', '#fbbf24', '#60a5fa'],
        startVelocity: 32,
        scalar: 0.85,
        zIndex: 80,
        gravity: 0.9,
      })
      if (Date.now() < end) setTimeout(fire, 200)
    }
    setTimeout(fire, 300)
  }, [])

  const stats = [
    { label: 'Steps Done',  value: completion.stepsTotal || '3 / 3', icon: '✅' },
    { label: 'Accuracy',    value: completion.accuracy   || '92%',   icon: '🎯', color },
    { label: 'Time',        value: completion.timeTaken  || '05:00', icon: '⏱' },
    { label: 'Errors',      value: completion.errors     ?? '0',     icon: '⚠' },
  ]

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center">
      {/* Background */}
      <img src={BG_ROOM_PLAIN} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg,rgba(9,66,140,0.72) 0%,rgba(0,0,0,0.55) 100%)' }}
      />

      {/* Medi AI summary — docked right, full height */}
      <MediAIPanel messages={mediSummary} />

      {/* Wide centered results card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative z-10 rounded-2xl"
        style={{ left: 12, right: 204, marginLeft: 12, marginRight: 204, padding: '18px 20px' }}
      >
        <div className="flex items-center gap-5">
          {/* Left: badge + title */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0" style={{ width: 110 }}>
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 14, stiffness: 220 }}
              className="relative"
            >
              <motion.div
                className="absolute rounded-full"
                style={{ inset: -8, background: `${color}20`, border: `1px solid ${color}50` }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.08, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-2"
                style={{ background: color, borderColor: `${color}80`, boxShadow: `0 0 30px ${color}45` }}
              >
                <motion.svg
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <motion.path
                    d="M4 14 L11 21 L24 7"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  />
                </motion.svg>
              </div>
            </motion.div>

            <div className="text-center">
              <p className="text-white/55 font-medium uppercase tracking-widest" style={{ fontSize: 7 }}>
                Simulation Complete
              </p>
              <p className="font-extrabold text-white leading-tight" style={{ fontSize: 13 }}>
                {domainName}
              </p>
              <p style={{ fontSize: 18, marginTop: 2 }}>{icon}</p>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.12)' }} />

          {/* Stats grid */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex-1 grid grid-cols-4 gap-2"
          >
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="rounded-xl p-2.5 text-center"
                style={{
                  background: s.color ? `${s.color}12` : 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <p style={{ fontSize: 18 }}>{s.icon}</p>
                <p className="font-extrabold text-white" style={{ fontSize: 16 }}>{s.value}</p>
                <p className="text-white/50" style={{ fontSize: 7.5 }}>{s.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Divider */}
          <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.12)' }} />

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.75 }}
            className="flex flex-col gap-2 flex-shrink-0"
            style={{ width: 120 }}
          >
            <button
              onClick={() => navigate(SCREENS.DOMAIN_SELECTION)}
              className="w-full py-2 rounded-xl font-bold text-white"
              style={{ fontSize: 10.5, background: '#009985', boxShadow: '0 4px 12px rgba(0,153,133,0.35)' }}
            >
              Back to Menu
            </button>
            <button
              onClick={() => navigate(SCREENS.DOMAIN_SELECTION)}
              className="w-full py-2 rounded-xl font-semibold text-white/65 border border-white/20"
              style={{ fontSize: 10.5, background: 'rgba(255,255,255,0.06)' }}
            >
              Try Again
            </button>
            <p className="text-white/30 text-center" style={{ fontSize: 7.5 }}>
              Educational Use Only
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
