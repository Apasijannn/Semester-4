import { motion } from 'framer-motion'
import { AR_POSITIONS } from '../data/domains'

export default function ARHighlightRing({ bodyPart = 'finger' }) {
  const pos = AR_POSITIONS[bodyPart] || AR_POSITIONS.finger

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: pos.left,
        top: pos.top,
        transform: 'translate(-50%, -50%)',
        width: pos.size,
        height: pos.size,
        zIndex: 10,
      }}
    >
      {/* Outer glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: -8,
          border: '1.5px solid rgba(37,99,235,0.3)',
          background: 'rgba(37,99,235,0.05)',
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Main ring */}
      <motion.div
        className="absolute inset-0 rounded-full ar-ring"
        animate={{ scale: [0.95, 1.06, 0.95] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Inner dot */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: '38%',
          background: 'rgba(37,99,235,0.7)',
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
