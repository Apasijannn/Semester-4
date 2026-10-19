import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { getHealthInsight } from '../utils/aiInsight'

const ONE_HOUR_MS = 60 * 60 * 1000

// Auto-generates at most once per hour (page-open trigger), unless the user
// explicitly clicks refresh. "No API key" is treated as a live UI state
// (falls back to the static quote) rather than a cached failure, so it
// starts working immediately once a key is added — it never burns the
// hourly window on attempts that were never going to succeed.
export function useHealthInsight(healthData, { apiKey, model }) {
  const [cache, setCache] = useLocalStorage('karsa_health_insight', null)
  const [status, setStatus] = useState('idle') // idle | loading | error
  const hasAutoRun = useRef(false)

  const generate = useCallback(async () => {
    if (!apiKey) return
    setStatus('loading')
    try {
      const text = await getHealthInsight(healthData, { apiKey, model })
      setCache({ text, generatedAt: Date.now() })
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }, [healthData, apiKey, model, setCache])

  useEffect(() => {
    if (hasAutoRun.current) return
    hasAutoRun.current = true
    if (!apiKey) return
    const isStale = !cache || Date.now() - cache.generatedAt > ONE_HOUR_MS
    if (isStale) generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    insight: cache?.text || null,
    status,
    generate,
    hasApiKey: Boolean(apiKey),
  }
}
