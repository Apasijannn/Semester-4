import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function TypingDots() {
  return (
    <span className="inline-flex gap-0.5 items-center ml-1">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </span>
  )
}

function StreamMsg({ text, delay = 0 }) {
  const [shown, setShown] = useState('')
  const timerRef = useRef()
  const idx = useRef(0)

  useEffect(() => {
    idx.current = 0
    setShown('')
    const start = setTimeout(() => {
      const tick = () => {
        idx.current++
        setShown(text.slice(0, idx.current))
        if (idx.current < text.length) {
          timerRef.current = setTimeout(tick, 18)
        }
      }
      tick()
    }, delay)
    return () => {
      clearTimeout(start)
      clearTimeout(timerRef.current)
    }
  }, [text, delay])

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-1.5 items-start"
    >
      <div
        className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold"
        style={{ fontSize: 7, background: 'linear-gradient(135deg,#009985,#2563eb)', marginTop: 1 }}
      >
        M
      </div>
      <div
        className="text-white/90 leading-snug break-words rounded-xl px-2 py-1.5"
        style={{
          fontSize: 8.5,
          maxWidth: 148,
          background: 'rgba(37,99,235,0.18)',
          border: '1px solid rgba(37,99,235,0.2)',
        }}
      >
        {shown}
        {shown.length < text.length && <TypingDots />}
      </div>
    </motion.div>
  )
}

export default function MediAIPanel({ messages = [] }) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef()
  const prevMsgs = useRef(null)

  useEffect(() => {
    if (prevMsgs.current === messages) return
    prevMsgs.current = messages
    setVisibleCount(0)
    setTyping(false)
    if (!messages || messages.length === 0) return

    const reveal = (i) => {
      if (i >= messages.length) return
      setTyping(true)
      const delay = 600 + messages[i].length * 10
      setTimeout(() => {
        setTyping(false)
        setVisibleCount(i + 1)
        setTimeout(() => reveal(i + 1), 500)
      }, delay)
    }
    setTimeout(() => reveal(0), 300)
  }, [messages])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [visibleCount, typing])

  return (
    <div
      className="medi-panel absolute flex flex-col"
      style={{ right: 8, top: 8, bottom: 8, width: 188, zIndex: 20 }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-xl flex-shrink-0"
        style={{
          background: 'rgba(37,99,235,0.15)',
          borderBottom: '1px solid rgba(37,99,235,0.25)',
        }}
      >
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white"
          style={{ fontSize: 11, background: 'linear-gradient(135deg,#009985,#2563eb)' }}
        >
          M
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white" style={{ fontSize: 10.5, letterSpacing: 0.3 }}>
            Medi AI
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400" style={{ fontSize: 7.5 }}>Clinical Guide · Online</span>
          </div>
        </div>
      </div>

      {/* ── Message stream ── */}
      <div
        ref={scrollRef}
        className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {messages.slice(0, visibleCount).map((msg, i) => (
          <StreamMsg key={`${msg}-${i}`} text={msg} />
        ))}

        <AnimatePresence>
          {typing && (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-1.5 items-start"
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold"
                style={{ fontSize: 7, background: 'linear-gradient(135deg,#009985,#2563eb)', marginTop: 1 }}
              >
                M
              </div>
              <div
                className="px-2 py-1.5 rounded-xl flex items-center gap-0.5"
                style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.2)' }}
              >
                <TypingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Mic button footer ── */}
      <div
        className="flex items-center justify-center gap-2 px-3 py-2 rounded-b-xl flex-shrink-0"
        style={{ borderTop: '1px solid rgba(37,99,235,0.2)' }}
      >
        <button
          className="flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold"
          style={{
            fontSize: 8,
            color: 'rgba(255,255,255,0.5)',
            background: 'rgba(37,99,235,0.12)',
            border: '1px solid rgba(37,99,235,0.2)',
          }}
        >
          <svg width="8" height="10" viewBox="0 0 8 10" fill="none" stroke="currentColor" strokeWidth="1.3">
            <rect x="2.5" y="0.5" width="3" height="5.5" rx="1.5" />
            <path d="M1 5.5a3 3 0 0 0 6 0" strokeLinecap="round" />
            <line x1="4" y1="8.5" x2="4" y2="9.5" />
          </svg>
          Tap to speak
        </button>
      </div>
    </div>
  )
}
