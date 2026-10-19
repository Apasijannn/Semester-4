import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BG_ROOM, PATIENT_GROUP, EQUIP, DOMAINS, MEDI_MESSAGES } from '../data/domains'
import ConfirmationModal from '../components/ConfirmationModal'

const domain = DOMAINS[0]
const steps  = domain.steps
const msgs   = MEDI_MESSAGES['vital-signs']

// ── Equipment images per step ─────────────────────────────────────────────────
const STEP_EQUIP = [EQUIP.HAND_FINGER, EQUIP.BP_HAND, EQUIP.THERMOMETER]

// ── Vitals reveal config (matches vitalsPanel revealStep in domains.js) ───────
const VITALS = [
  { label: 'HR',   value: '98',     unit: 'bpm',  color: '#16a34a', revealStep: 0 },
  { label: 'BP',   value: '148/92', unit: 'mmHg', color: '#d97706', revealStep: 1 },
  { label: 'Temp', value: '37.1',   unit: '°C',   color: '#16a34a', revealStep: 2 },
]

// ── Shared icons ──────────────────────────────────────────────────────────────
function HRIcon({ size = 26 }) {
  return (
    <svg width={size} height={size * 0.92} viewBox="0 0 26 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M13 22S2 15.5 2 8.5a6.5 6.5 0 0 1 11-4.69A6.5 6.5 0 0 1 24 8.5c0 7-11 13.5-11 13.5z" fill="#e53e3e"/>
      <path d="M5.5 12 L8 12 L9.5 8.5 L11.5 15.5 L13 11 L14.5 12 L17 12" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function BPIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="13" cy="14" r="7.5" stroke="#c0392b" strokeWidth="2" fill="none"/>
      <path d="M13 6.5 L13 3.5" stroke="#c0392b" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 3.5 L16 3.5" stroke="#c0392b" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="13" cy="14" r="3" fill="#c0392b" fillOpacity="0.25" stroke="#c0392b" strokeWidth="1.5"/>
    </svg>
  )
}
function TempIcon({ size = 20 }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 20 28" fill="none" style={{ flexShrink: 0 }}>
      <path d="M10 18V6.5a3.5 3.5 0 0 0-7 0V18a6 6 0 1 0 7 0z" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <circle cx="6.5" cy="22" r="4" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="1.5"/>
      <line x1="6.5" y1="18.5" x2="6.5" y2="13" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}
function PatientCardIcon() {
  return (
    <svg width="32" height="28" viewBox="0 0 32 28" fill="none">
      <rect x="1" y="2" width="30" height="24" rx="4" stroke="#009985" strokeWidth="2" fill="none"/>
      <circle cx="11" cy="11" r="4" stroke="#009985" strokeWidth="1.8" fill="none"/>
      <path d="M4 24c0-4 3.1-6 7-6s7 2 7 6" stroke="#009985" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <line x1="22" y1="9"  x2="29" y2="9"  stroke="#009985" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="22" y1="13" x2="27" y2="13" stroke="#009985" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="22" y1="17" x2="28" y2="17" stroke="#009985" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
function LoadingSpinner() {
  return (
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
      style={{ width: 15, height: 15, flexShrink: 0 }}>
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="7.5" r="5.5" stroke="#e5e7eb" strokeWidth="2"/>
        <path d="M7.5 2 A5.5 5.5 0 0 1 13 7.5" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </motion.div>
  )
}
function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}
function MenuDotsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="2.5" width="19" height="19" rx="4" stroke="#555" strokeWidth="1.4"/>
      <circle cx="12" cy="7.5"  r="1.4" fill="#555"/>
      <circle cx="12" cy="12"   r="1.4" fill="#555"/>
      <circle cx="12" cy="16.5" r="1.4" fill="#555"/>
    </svg>
  )
}

// ── ECG waveform for Heart Rate card ─────────────────────────────────────────
function ECGWave() {
  return (
    <svg width="200" height="28" viewBox="0 0 200 28" fill="none" style={{ display: 'block', marginTop: 6 }}>
      <path d="M0 14 L32 14 L42 4 L52 26 L62 14 L70 7 L78 14 L200 14"
        stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Step progress circles ─────────────────────────────────────────────────────
function StepCircles({ total, current }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: 20, height: 20, borderRadius: '50%',
          background: i <= current ? '#2563eb' : 'white',
          border: `2px solid ${i <= current ? '#2563eb' : '#9ca3af'}`,
          transition: 'all 0.3s',
        }} />
      ))}
    </div>
  )
}

// ── Medi AI intro messages (Indonesian) ──────────────────────────────────────
const MEDI_INTRO = [
  "Halo! Saya Medi, asisten informasi kesehatan berbahasa Indonesia.",
  "Ketik pertanyaan kesehatan Anda dan saya akan membantu.",
  "Catatan: Saya bukan dokter. Selalu konsultasikan kondisi Anda dengan tenaga medis profesional.",
]

// ── Shared panels (used in both intro & step phases) ─────────────────────────

function PatientVitalsPanel({ done, showBegin, onBegin }) {
  return (
    <div style={{
      background: 'rgba(255,251,251,0.93)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderRadius: 14,
      boxShadow: '0 4px 24px rgba(0,0,0,0.14)',
      display: 'flex',
      overflow: 'hidden',
    }}>
      {/* Patient column */}
      <div style={{ flex: '0 0 142px', padding: '14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <PatientCardIcon />
          <span style={{ fontFamily: "'Open Sans','Inter',sans-serif", fontWeight: 700, fontSize: 16, color: '#009985' }}>
            Patient
          </span>
        </div>
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 10 }}>
          <p style={{ fontFamily: "'Open Sans','Inter',sans-serif", fontWeight: 700, fontSize: 18, color: '#111', margin: 0 }}>
            {domain.patient.name}
          </p>
          <p style={{ fontFamily: "'Open Sans','Inter',sans-serif", fontSize: 11, color: '#888', margin: '3px 0 10px' }}>
            Age {domain.patient.age} &nbsp;&nbsp; {domain.patient.gender}
          </p>
          <p style={{ fontFamily: "'Open Sans','Inter',sans-serif", fontSize: 10, color: '#888', margin: '0 0 2px' }}>Complaint :</p>
          <p style={{
            fontFamily: "'Open Sans','Inter',sans-serif", fontSize: 10, color: '#555',
            lineHeight: 1.45, margin: 0,
            display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {domain.patient.complaint}
          </p>
        </div>
      </div>

      {/* Vertical divider */}
      <div style={{ width: 1, background: 'rgba(0,0,0,0.10)', margin: '12px 0' }} />

      {/* Vitals Signs column */}
      <div style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontFamily: "'Open Sans','Inter',sans-serif", fontWeight: 700, fontSize: 16, color: '#009985', margin: '0 0 14px' }}>
          Vitals Signs
        </p>
        {[
          { icon: <HRIcon />, ...VITALS[0] },
          { icon: <BPIcon />, ...VITALS[1] },
          { icon: <TempIcon />, ...VITALS[2] },
        ].map((v, i) => {
          const revealed = done.includes(v.revealStep)
          return (
            <div key={v.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < 2 ? 14 : 0 }}>
              {v.icon}
              <span style={{ fontFamily: "'Open Sans','Inter',sans-serif", fontWeight: 500, fontSize: 13, flex: 1 }}>
                {v.label}
              </span>
              {revealed ? (
                <span style={{ fontFamily: "'Open Sans','Inter',sans-serif", fontSize: 13, fontWeight: 600, color: v.color }}>
                  {v.value} {v.unit}
                </span>
              ) : (
                <>
                  <span style={{ fontFamily: "'Open Sans','Inter',sans-serif", fontSize: 13, color: '#aaa' }}>
                    ---{v.unit}
                  </span>
                  <LoadingSpinner />
                </>
              )}
            </div>
          )
        })}
        {showBegin && (
          <>
            <div style={{ flex: 1 }} />
            <motion.button
              whileHover={{ background: '#007a6b' }}
              whileTap={{ scale: 0.97 }}
              onClick={onBegin}
              style={{
                marginTop: 14,
                background: '#009985', border: 'none', cursor: 'pointer',
                borderRadius: 8, padding: '8px 0',
                fontFamily: "'Open Sans','Inter',sans-serif",
                fontWeight: 700, fontSize: 12, color: '#fff',
                boxShadow: '0 3px 10px rgba(0,153,133,0.35)', width: '100%',
              }}
            >
              Begin Tutorial →
            </motion.button>
          </>
        )}
      </div>
    </div>
  )
}

function MediAIChat() {
  return (
    <div style={{
      background: '#111827', borderRadius: 14,
      boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      {/* Header */}
      <div style={{ background: '#1f2937', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 7, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <path d="M10 3L5 8l5 5" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#009985,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 11 }}>M</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 11, margin: 0 }}>Medi AI</p>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, margin: 0 }}>bot</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="8" cy="3"  r="1.3" fill="rgba(255,255,255,0.5)"/>
          <circle cx="8" cy="8"  r="1.3" fill="rgba(255,255,255,0.5)"/>
          <circle cx="8" cy="13" r="1.3" fill="rgba(255,255,255,0.5)"/>
        </svg>
      </div>
      {/* Messages */}
      <div style={{ flex: 1, padding: '8px 8px 6px', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ background: '#7c3aed', borderRadius: '10px 10px 2px 10px', padding: '5px 9px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: 'white', fontSize: 10, fontWeight: 600 }}>/start</span>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 8 }}>22:07</span>
            <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
              <path d="M1 4L3.5 7L8 1" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 4L7.5 7L12 1" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        {MEDI_INTRO.map((msg, i) => (
          <div key={i} style={{ background: '#1f2937', borderRadius: '2px 10px 10px 10px', padding: '6px 9px', maxWidth: '92%' }}>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 9.5, lineHeight: 1.5, margin: 0 }}>{msg}</p>
            {i === MEDI_INTRO.length - 1 && (
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, margin: '3px 0 0', textAlign: 'right' }}>22:07</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Measurement result card (center-top, step phase) ─────────────────────────
function MeasurementCard({ measurement, stepIdx }) {
  const iconMap = [
    <HRIcon size={38} />,
    <BPIcon size={38} />,
    <TempIcon size={28} />,
  ]

  return (
    <motion.div
      key={stepIdx}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: 'rgba(255,251,251,0.93)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: 14,
        boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
        padding: '12px 16px 14px',
        minWidth: 210,
      }}
    >
      <p style={{ fontFamily: "'Open Sans','Inter',sans-serif", fontWeight: 700, fontSize: 15, color: '#111', margin: '0 0 8px' }}>
        {measurement.label}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {iconMap[stepIdx]}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontFamily: "'Open Sans','Inter',sans-serif", fontWeight: 900, fontSize: 40, color: '#111', lineHeight: 1 }}>
            {measurement.value}
          </span>
          <span style={{ fontFamily: "'Open Sans','Inter',sans-serif", fontSize: 14, color: '#666' }}>
            {measurement.unit}
          </span>
        </div>
      </div>

      {/* HR: ECG waveform */}
      {stepIdx === 0 && <ECGWave />}

      {/* BP / Temp: progress bar + status badge */}
      {stepIdx > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden', marginBottom: 7 }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: stepIdx === 1 ? '72%' : '44%' }}
              transition={{ duration: 0.7, delay: 0.2 }}
              style={{ height: '100%', background: measurement.statusColor, borderRadius: 4 }}
            />
          </div>
          <span style={{
            display: 'inline-block',
            border: `1.5px solid ${measurement.statusColor}`,
            color: measurement.statusColor,
            borderRadius: 20, padding: '2px 12px',
            fontFamily: "'Open Sans','Inter',sans-serif",
            fontSize: 11, fontWeight: 700,
          }}>
            {measurement.status}
          </span>
        </div>
      )}
    </motion.div>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function Domain1VitalSigns({ navigate, SCREENS }) {
  const [phase, setPhase]         = useState('intro')
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
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')

  const handleNext = () => {
    if (!done.includes(stepIdx)) setDone((d) => [...d, stepIdx])
    if (stepIdx < steps.length - 1) setStepIdx((i) => i + 1)
    else setShowModal(true)
  }

  const handleFinish = () => {
    navigate(SCREENS.COMPLETION, {
      domainName:  domain.name,
      domainId:    domain.id,
      completion:  { ...domain.completion, timeTaken: `${mm}:${ss}` },
      mediSummary: msgs[4],
    })
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Room background */}
      <img src={BG_ROOM} alt="" className="absolute inset-0 w-full h-full object-cover" />

      {/* Teal table overlay — visible in both phases */}
      <div className="absolute" style={{
        left: '14%', top: '47%', right: '2%', bottom: '3%',
        background: 'rgba(0,166,147,0.48)',
        border: '2px dashed rgba(255,255,255,0.88)',
        zIndex: 1,
      }} />

      {/* Patient image */}
      <img src={PATIENT_GROUP} alt="" className="absolute pointer-events-none"
        style={{ left: '26%', top: 0, height: '100%', width: 'auto', objectFit: 'contain', zIndex: 2 }} />

      {/* ─── INTRO PHASE ──────────────────────────────────────────────────── */}
      {phase === 'intro' && (
        <>
          {/* Left panel */}
          <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
            style={{ position: 'absolute', left: 10, top: 10, width: 336, zIndex: 15 }}>
            <PatientVitalsPanel done={[]} showBegin onBegin={() => setPhase('step')} />
          </motion.div>

          {/* Medi AI chat */}
          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            style={{ position: 'absolute', right: 8, top: 10, width: 205, height: 270, zIndex: 15 }}>
            <MediAIChat />
          </motion.div>

          {/* Timer card (static 00:00) */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
            style={{
              position: 'absolute', right: 8, bottom: 8, width: 205, zIndex: 15,
              background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
              borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              padding: '10px 18px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
            <p style={{ fontFamily: "'Open Sans','Inter',sans-serif", fontWeight: 700, fontSize: 16, color: '#2563eb', margin: '0 0 2px' }}>Timer</p>
            <p style={{ fontFamily: "'Open Sans','Inter',sans-serif", fontWeight: 900, fontSize: 44, color: '#111', margin: 0, lineHeight: 1, letterSpacing: 2 }}>
              00 : 00
            </p>
          </motion.div>

          {/* Settings + menu */}
          <div className="absolute flex items-center gap-1.5" style={{ top: 10, right: 224, zIndex: 20 }}>
            <SettingsIcon /><MenuDotsIcon />
          </div>
        </>
      )}

      {/* ─── STEP PHASE ───────────────────────────────────────────────────── */}
      {phase === 'step' && (
        <>
          {/* Left panel — vitals updating per step */}
          <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
            style={{ position: 'absolute', left: 10, top: 10, width: 336, zIndex: 15 }}>
            <PatientVitalsPanel done={done} showBegin={false} />
          </motion.div>

          {/* Center-top: measurement result card */}
          <div style={{ position: 'absolute', left: 354, top: 10, zIndex: 15 }}>
            <AnimatePresence mode="wait">
              <MeasurementCard key={stepIdx} measurement={currentStep.measurement} stepIdx={stepIdx} />
            </AnimatePresence>
          </div>

          {/* Bottom-left: step panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIdx}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute', left: 10, bottom: 8, width: 248, zIndex: 15,
                background: 'rgba(255,251,251,0.93)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
                padding: '12px 14px 12px',
              }}
            >
              {/* Header: step label + circles */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: "'Open Sans','Inter',sans-serif", fontWeight: 700, fontSize: 13, color: '#2563eb' }}>
                  Step {stepIdx + 1} of {steps.length}
                </span>
                <StepCircles total={steps.length} current={stepIdx} />
              </div>

              {/* Title + description + equipment image (side by side) */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'Open Sans','Inter',sans-serif", fontWeight: 700, fontSize: 12.5, color: '#111', margin: '0 0 4px', lineHeight: 1.3 }}>
                    {currentStep.title}
                  </p>
                  <p style={{ fontFamily: "'Open Sans','Inter',sans-serif", fontSize: 10.5, color: '#666', margin: 0, lineHeight: 1.45 }}>
                    {currentStep.desc}
                  </p>
                </div>
                {/* Equipment image */}
                <img
                  src={STEP_EQUIP[stepIdx]}
                  alt=""
                  style={{ width: 90, height: 65, objectFit: 'contain', flexShrink: 0, borderRadius: 6 }}
                />
              </div>

              {/* Back / Next buttons */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                <button
                  onClick={() => stepIdx > 0 ? setStepIdx((i) => i - 1) : navigate(SCREENS.DOMAIN_SELECTION)}
                  style={{
                    flex: 1, background: 'white', border: '1.5px solid #d1d5db',
                    color: '#374151', borderRadius: 8, padding: '7px 0',
                    fontFamily: "'Open Sans','Inter',sans-serif", fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleNext}
                  style={{
                    flex: 1, background: '#2563eb', border: 'none',
                    color: 'white', borderRadius: 8, padding: '7px 0',
                    fontFamily: "'Open Sans','Inter',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  }}
                >
                  {stepIdx < steps.length - 1 ? 'Next' : 'Finish'}
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Medi AI chat (right) */}
          <div style={{ position: 'absolute', right: 8, top: 10, width: 205, height: 270, zIndex: 15 }}>
            <MediAIChat />
          </div>

          {/* Timer card (counting) */}
          <div style={{
            position: 'absolute', right: 8, bottom: 8, width: 205, zIndex: 15,
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
            borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            padding: '10px 18px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <p style={{ fontFamily: "'Open Sans','Inter',sans-serif", fontWeight: 700, fontSize: 16, color: '#2563eb', margin: '0 0 2px' }}>Timer</p>
            <p style={{ fontFamily: "'Open Sans','Inter',sans-serif", fontWeight: 900, fontSize: 44, color: '#111', margin: 0, lineHeight: 1, letterSpacing: 2 }}>
              {mm} : {ss}
            </p>
          </div>

          {/* Settings + menu icons */}
          <div className="absolute flex items-center gap-1.5" style={{ top: 10, right: 224, zIndex: 20 }}>
            <SettingsIcon /><MenuDotsIcon />
          </div>
        </>
      )}

      <ConfirmationModal open={showModal} onCancel={() => setShowModal(false)} onFinish={handleFinish} />
    </div>
  )
}
