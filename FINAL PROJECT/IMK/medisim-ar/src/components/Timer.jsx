import { useState, useEffect, useRef } from 'react'

export default function Timer({ running = true, className = '' }) {
  const [secs, setSecs] = useState(0)
  const ref = useRef()

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSecs(s => s + 1), 1000)
    } else {
      clearInterval(ref.current)
    }
    return () => clearInterval(ref.current)
  }, [running])

  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')

  return (
    <div className={`glass-sm flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${className}`}>
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
      <span className="font-mono font-bold text-gray-800" style={{ fontSize: 11 }}>{mm}:{ss}</span>
    </div>
  )
}
