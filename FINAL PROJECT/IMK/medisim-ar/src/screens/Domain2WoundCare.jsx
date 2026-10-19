import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BG_ROOM, PATIENT_GROUP, DOMAINS, MEDI_MESSAGES } from '../data/domains'
import MediAIPanel from '../components/MediAIPanel'
import ARHighlightRing from '../components/ARHighlightRing'
import ARCanvas from '../components/ARCanvas'
import ConfirmationModal from '../components/ConfirmationModal'

const domain = DOMAINS[1]
const steps  = domain.steps
const msgs   = MEDI_MESSAGES['wound-care']

function StepDots({ total, current }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`step-dot ${i < current ? 'completed' : i === current ? 'active' : 'pending'}`} />
      ))}
    </div>
  )
}

function TimerHUD({ secs }) {
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  return (
    <div className="timer-hud flex items-center gap-1.5 px-2 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
      <span className="font-mono font-bold text-white" style={{ fontSize: 10.5 }}>{mm}:{ss}</span>
    </div>
  )
}

export default function Domain2WoundCare({ navigate, SCREENS }) {
  const [phase, setPhase]         = useState('entry')
  const [stepIdx, setStepIdx]     = useState(0)
  const [done, setDone]           = useState([])
  const [showModal, setShowModal] = useState(false)
  const [secs, setSecs]           = useState(0)

  useEffect(() => {
    if (phase !== 'step') return
    const t = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  const currentStep = steps[stepIdx]
  const supplies    = currentStep.suppliesNeeded || []
  const mediMsgs    = phase === 'entry' ? msgs[0] : (msgs[stepIdx + 1] || msgs[0])

  const handleNext = () => {
    if (!done.includes(stepIdx)) setDone((d) => [...d, stepIdx])
    if (stepIdx < steps.length - 1) setStepIdx((i) => i + 1)
    else setShowModal(true)
  }

  const handleFinish = () => {
    const mm = String(Math.floor(secs / 60)).padStart(2, '0')
    const ss = String(secs % 60).padStart(2, '0')
    navigate(SCREENS.COMPLETION, {
      domainName:  domain.name,
      domainId:    domain.id,
      completion:  { ...domain.completion, timeTaken: `${mm}:${ss}` },
      mediSummary: msgs[4],
    })
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <img src={BG_ROOM} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.28)' }} />

      <img src={PATIENT_GROUP} alt="" className="absolute pointer-events-none"
        style={{ left: '26%', top: 0, height: '100%', width: 'auto', objectFit: 'contain', zIndex: 2 }} />

      {phase === 'step' && <ARCanvas mode="simulation" bodyPart={currentStep.arBodyPart} />}
      {phase === 'step' && <ARHighlightRing bodyPart={currentStep.arBodyPart} />}

      <MediAIPanel messages={mediMsgs} />

      {/* ── ENTRY ── */}
      {phase === 'entry' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass absolute rounded-2xl flex flex-col"
          style={{ left: 10, top: 10, bottom: 10, width: 270, padding: 14, zIndex: 15 }}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: domain.accentBg }}>
              {domain.icon}
            </div>
            <div>
              <p className="font-extrabold text-gray-900" style={{ fontSize: 13 }}>{domain.name}</p>
              <p className="text-gray-400" style={{ fontSize: 9 }}>3 Steps · ~6 min</p>
            </div>
          </div>

          <div className="rounded-xl p-2.5 mb-2.5"
            style={{ background: domain.accentBg, border: `1px solid ${domain.accentBorder}` }}>
            <p className="text-gray-700 leading-snug" style={{ fontSize: 9.5 }}>{domain.entryDesc}</p>
          </div>

          <div className="rounded-xl p-2.5 mb-3" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <p className="font-semibold text-gray-600 mb-1" style={{ fontSize: 9 }}>Patient Complaint</p>
            <p className="text-gray-700 leading-snug" style={{ fontSize: 9 }}>{domain.patient.complaint}</p>
          </div>

          <div className="flex-1" />
          <button onClick={() => setPhase('step')}
            className="w-full py-2 rounded-xl font-bold text-white"
            style={{ fontSize: 12, background: '#009985', boxShadow: '0 4px 12px rgba(0,153,133,0.3)' }}>
            Begin Simulation
          </button>
        </motion.div>
      )}

      {/* ── SIMULATION ── */}
      {phase === 'step' && (
        <>
          {/* Top-left domain nav */}
          <div className="absolute flex items-center gap-1.5 z-20" style={{ left: 163, top: 8 }}>
            <button
              onClick={() => navigate(SCREENS.DOMAIN_SELECTION)}
              className="timer-hud flex items-center gap-1 px-2 py-1 rounded-lg"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 2L3 5l3 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Wound Care
            </button>
          </div>

          {/* Timer */}
          <div className="absolute z-20" style={{ right: 204, top: 8 }}>
            <TimerHUD secs={secs} />
          </div>

          {/* Patient info — far left */}
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass absolute rounded-xl"
            style={{ left: 8, top: 8, width: 148, bottom: 8, zIndex: 15, overflow: 'hidden' }}
          >
            <div className="p-2.5 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-sm flex-shrink-0">👤</div>
                <div>
                  <p className="font-bold text-gray-900" style={{ fontSize: 10 }}>{domain.patient.name}</p>
                  <p className="text-gray-500" style={{ fontSize: 7.5 }}>
                    {domain.patient.age}y · {domain.patient.gender}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 leading-snug" style={{ fontSize: 7.5 }}>{domain.patient.complaint}</p>
            </div>

            {/* Wound info */}
            <div className="p-2.5 border-b border-gray-100">
              <p className="font-bold text-gray-700 mb-1.5" style={{ fontSize: 9 }}>Wound Inspection</p>
              {Object.entries(domain.woundInfo).map(([k, v]) => (
                <div key={k} className="flex justify-between mb-1">
                  <span className="text-gray-400 capitalize" style={{ fontSize: 7.5 }}>{k}</span>
                  <span className="font-semibold text-gray-700" style={{ fontSize: 7.5 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Checklist preview */}
            <div className="p-2.5">
              <p className="font-bold text-gray-700 mb-1.5" style={{ fontSize: 9 }}>Supplies</p>
              {supplies.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5 mb-1">
                  <div className={`supply-check ${s.done ? 'done' : ''}`} />
                  <span style={{ fontSize: 7.5, color: s.done ? '#009985' : '#666' }}>{s.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Center-right: wound detail + checklist */}
          <motion.div
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass absolute rounded-xl"
            style={{ right: 204, top: 34, width: 162, zIndex: 15, bottom: 104 }}
          >
            <div className="p-2.5">
              <p className="font-bold text-gray-700 mb-2" style={{ fontSize: 9 }}>Wound Status</p>

              {/* Wound visual indicator */}
              <div
                className="rounded-xl p-2 mb-2.5 text-center"
                style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)' }}
              >
                <p style={{ fontSize: 18 }}>🩹</p>
                <p className="font-bold text-amber-700" style={{ fontSize: 10.5 }}>Left Forearm</p>
                <div className="flex justify-center gap-2 mt-1">
                  <span className="text-gray-500" style={{ fontSize: 7.5 }}>4 cm</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-500" style={{ fontSize: 7.5 }}>Superficial</span>
                </div>
              </div>

              {/* Supply checklist */}
              <p className="font-bold text-gray-700 mb-1.5" style={{ fontSize: 9 }}>Supply Checklist</p>
              <div className="flex flex-col gap-1.5">
                {supplies.map((s) => (
                  <AnimatePresence key={s.name}>
                    <motion.div
                      className="flex items-center gap-2 rounded-lg px-2 py-1"
                      style={{ background: s.done ? 'rgba(0,153,133,0.08)' : 'rgba(0,0,0,0.03)' }}
                      animate={{ backgroundColor: s.done ? 'rgba(0,153,133,0.08)' : 'rgba(0,0,0,0.03)' }}
                    >
                      <div className={`supply-check ${s.done ? 'done' : ''}`} />
                      <span
                        style={{ fontSize: 8.5, color: s.done ? '#009985' : '#555', textDecoration: s.done ? 'line-through' : 'none', opacity: s.done ? 0.75 : 1 }}
                      >
                        {s.name}
                      </span>
                      {s.done && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto text-green-500"
                          style={{ fontSize: 9 }}
                        >
                          ✓
                        </motion.span>
                      )}
                    </motion.div>
                  </AnimatePresence>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Step panel — bottom center */}
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIdx}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="glass absolute rounded-xl"
              style={{ bottom: 8, left: 163, right: 372, height: 88, zIndex: 15 }}
            >
              <div className="p-3 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <StepDots total={steps.length} current={stepIdx} />
                    <span className="text-gray-400" style={{ fontSize: 7.5 }}>
                      Step {stepIdx + 1} of {steps.length}
                    </span>
                  </div>
                  <p className="font-bold text-gray-800 leading-snug" style={{ fontSize: 10 }}>
                    {currentStep.title}
                  </p>
                  <p className="text-gray-500 leading-snug" style={{ fontSize: 8.5 }}>
                    {currentStep.desc}
                  </p>
                </div>
                <div className="flex gap-1.5 justify-end">
                  {stepIdx > 0 && (
                    <button onClick={() => setStepIdx((i) => i - 1)}
                      className="btn-back px-3 py-1.5 font-semibold text-gray-700" style={{ fontSize: 10 }}>
                      ← Back
                    </button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNext}
                    className="btn-next px-4 py-1.5 font-bold text-white rounded-lg"
                    style={{ fontSize: 10 }}
                  >
                    {stepIdx < steps.length - 1 ? 'Next →' : 'Finish ✓'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </>
      )}

      <ConfirmationModal open={showModal} onCancel={() => setShowModal(false)} onFinish={handleFinish} />
    </div>
  )
}
