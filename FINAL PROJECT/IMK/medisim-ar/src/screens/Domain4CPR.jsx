import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Timer from '../components/Timer'
import MediAIPanel from '../components/MediAIPanel'
import ConfirmationModal from '../components/ConfirmationModal'
import ARHighlightRing from '../components/ARHighlightRing'

const BG = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'

const STEPS = [
  {
    id: 1,
    title: 'Check Responsiveness',
    icon: '👋',
    instruction: 'Tap shoulders firmly and shout "Are you okay?" Check for breathing for no more than 10 seconds.',
    highlight: { x: 185, y: 300, size: 90 },
    mediMsg: 'Check responsiveness immediately! Tap the shoulders firmly, shout loudly. Simultaneously check for breathing — look for chest rise for no more than 10 seconds. Call for AED if available. No pulse detected.',
  },
  {
    id: 2,
    title: 'Position Hands',
    icon: '🤲',
    instruction: 'Place heel of dominant hand on center of chest (lower half of sternum). Interlace fingers.',
    highlight: { x: 185, y: 355, size: 80 },
    mediMsg: 'Position your hands correctly — heel of hand on lower half of the sternum, NOT on the ribs. Interlace fingers and keep arms straight. Lock elbows. Your body weight should drive the compressions, not your arms.',
  },
  {
    id: 3,
    title: 'Chest Compressions (30x)',
    icon: '💪',
    instruction: 'Push hard and fast: 5–6cm depth at 100–120 BPM. Count aloud.',
    highlight: { x: 185, y: 360, size: 85 },
    mediMsg: 'Perform 30 chest compressions at 100–120 BPM. Push down at least 5cm, allow full chest recoil between compressions. Don\'t lean on the chest. Keep a consistent rhythm — the metronome will guide you.',
    isCPR: true,
  },
  {
    id: 4,
    title: 'Rescue Breaths (2x)',
    icon: '💨',
    instruction: 'Tilt head, lift chin. Pinch nose. Give 2 rescue breaths, 1 second each. Watch for chest rise.',
    highlight: { x: 185, y: 290, size: 70 },
    mediMsg: 'After 30 compressions, give 2 rescue breaths. Head-tilt chin-lift, pinch the nose, seal your lips around the mouth. Each breath should take 1 second and produce visible chest rise. Then back to compressions immediately!',
  },
]

export default function Domain4CPR({ navigate, SCREENS }) {
  const [step, setStep] = useState(0)
  const [showAlert, setShowAlert] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [compressionCount, setCompressionCount] = useState(0)
  const [cprActive, setCprActive] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTimeElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setTimeout(() => setShowAlert(false), 3000)
  }, [])

  useEffect(() => {
    if (STEPS[step].isCPR && !cprActive) {
      setCprActive(true)
      const interval = setInterval(() => {
        setCompressionCount(c => {
          if (c >= 30) {
            clearInterval(interval)
            setCprActive(false)
            return 30
          }
          return c + 1
        })
      }, 545)
      return () => clearInterval(interval)
    }
  }, [step])

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
      if (!STEPS[step + 1].isCPR) setCompressionCount(0)
    } else {
      setShowModal(true)
    }
  }

  const handleFinish = () => {
    const mm = String(Math.floor(timeElapsed / 60)).padStart(2, '0')
    const ss = String(timeElapsed % 60).padStart(2, '0')
    navigate(SCREENS.COMPLETION, {
      domain: 'CPR & Emergency',
      steps: STEPS.length,
      accuracy: 88,
      time: `${mm}:${ss}`,
      errors: 2,
      mediMsg: 'CPR protocol completed for Zidan! 30:2 ratio maintained, compression depth adequate. Return of spontaneous circulation — ROSC achieved. Prepare for post-resuscitation care and advanced airway.',
    })
  }

  const mm = String(Math.floor(timeElapsed / 60)).padStart(2, '0')
  const ss = String(timeElapsed % 60).padStart(2, '0')

  return (
    <div className="relative w-full h-screen flex flex-col overflow-hidden">
      <div className="absolute inset-0">
        <img src={BG} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/45" />
      </div>

      {/* Emergency Alert */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="absolute top-0 left-0 right-0 z-50 bg-red-600 px-4 py-3 flex items-center gap-3 shadow-xl"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-2xl"
            >
              🚨
            </motion.div>
            <div>
              <div className="text-white font-bold text-sm">EMERGENCY — NO PULSE DETECTED</div>
              <div className="text-red-200 text-xs">Initiating CPR protocol for Zidan</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ARHighlightRing
        x={STEPS[step].highlight.x}
        y={STEPS[step].highlight.y}
        size={STEPS[step].highlight.size}
        color="#ef4444"
        label={step === 2 ? 'Compression Zone' : step === 3 ? 'Airway' : 'Check Here'}
      />

      {/* Timer - prominent */}
      <div className="absolute top-10 right-2 z-20 mt-1">
        <div className="glass rounded-2xl px-3 py-2 shadow-xl border-2 border-red-400/30">
          <div className="flex items-center gap-1.5">
            <motion.div
              className="w-2.5 h-2.5 rounded-full bg-red-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <span className="font-mono font-black text-base text-gray-900">{mm}:{ss}</span>
          </div>
          <div className="text-[8px] text-gray-500 text-center">Emergency Timer</div>
        </div>
      </div>

      {/* Patient status */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-10 left-3 z-20 w-36"
      >
        <div className="glass rounded-2xl p-3 shadow-xl border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-sm">🆘</div>
            <div>
              <div className="text-gray-900 font-bold text-xs">Zidan</div>
              <div className="text-red-600 text-[9px] font-semibold">Unresponsive</div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {[['Pulse', 'ABSENT', 'red'], ['Breathing', 'ABSENT', 'red'], ['Pupils', 'Dilated', 'amber']].map(([k, v, c]) => (
              <div key={k} className="flex justify-between items-center">
                <span className="text-gray-500 text-[8px]">{k}</span>
                <span className={`text-${c}-600 text-[8px] font-bold`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* CPR Metronome */}
      {STEPS[step].isCPR && (
        <div className="absolute top-52 left-1/2 -translate-x-1/2 z-20">
          <div className="flex flex-col items-center gap-2">
            <motion.div
              className="w-16 h-16 rounded-full bg-red-500/90 border-4 border-red-400 flex items-center justify-center shadow-2xl shadow-red-500/50 text-white font-black text-xl"
              animate={{ scale: [1, 1.15, 1], boxShadow: ['0 0 0 0 rgba(239,68,68,0.7)', '0 0 0 20px rgba(239,68,68,0)', '0 0 0 0 rgba(239,68,68,0)'] }}
              transition={{ duration: 0.545, repeat: Infinity, ease: 'easeInOut' }}
            >
              {compressionCount}
            </motion.div>
            <div className="glass rounded-full px-3 py-1 text-[10px] font-bold text-gray-800">
              110 BPM ♩
            </div>
          </div>
        </div>
      )}

      {/* Medi AI */}
      <MediAIPanel message={STEPS[step].mediMsg} step={step} />

      {/* Step panel */}
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-3 right-3 z-20"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          {STEPS.map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-300"
              style={{ width: i === step ? 20 : 8, height: 8, background: i <= step ? '#ef4444' : 'rgba(255,255,255,0.3)' }}
            />
          ))}
        </div>

        <div className="glass rounded-2xl p-4 shadow-xl border border-red-100">
          <div className="rounded-xl p-2.5 mb-3 bg-red-50 border border-red-200 flex items-start gap-3">
            <span className="text-2xl">{STEPS[step].icon}</span>
            <div>
              <div className="text-red-800 font-bold text-xs">{STEPS[step].title}</div>
              <div className="text-red-700 text-[10px] leading-snug mt-0.5">{STEPS[step].instruction}</div>
            </div>
          </div>

          {STEPS[step].isCPR && (
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="text-gray-600 text-[10px]">Compressions</div>
              <div className="flex gap-1">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-3 rounded-full transition-all duration-200"
                    style={{ background: i < compressionCount ? '#ef4444' : '#e5e7eb' }}
                  />
                ))}
              </div>
              <div className="text-red-600 font-bold text-xs">{compressionCount}/30</div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="text-gray-500 text-[10px]">Step {step + 1} of {STEPS.length}</div>
            <div className="flex gap-2">
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="px-3 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-medium">Back</button>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md hover:bg-red-700"
              >
                {step < STEPS.length - 1 ? 'Next →' : 'Finish'}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <ConfirmationModal open={showModal} onCancel={() => setShowModal(false)} onFinish={handleFinish} />
    </div>
  )
}
