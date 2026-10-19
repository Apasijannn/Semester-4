import { createContext, useContext, useMemo, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { todayKey } from '../utils/format'
import { getExerciseRecommendation, FALLBACK_EXERCISES, FALLBACK_MOTIVATION } from '../utils/exerciseAI'
import { SettingsContext } from './SettingsContext'

export const ExerciseContext = createContext(null)

const DEFAULT_PROFILE = {
  activityLevel: 'sedang',
  goal: 'kebugaran',
  minutesAvailable: 30,
  notes: '',
}

const DAY_MS = 24 * 60 * 60 * 1000

function isDayCompleted(log) {
  return Boolean(log && log.exercises && log.exercises.some((e) => e.completed))
}

function fallbackLog() {
  return {
    exercises: FALLBACK_EXERCISES.map((e) => ({ ...e })),
    motivation: FALLBACK_MOTIVATION,
    generatedAt: Date.now(),
    source: 'fallback',
  }
}

export function ExerciseProvider({ children }) {
  const [profile, setProfile] = useLocalStorage('karsa_fitness_profile', DEFAULT_PROFILE)
  const [logs, setLogs] = useLocalStorage('karsa_exercise_logs', {})
  const [status, setStatus] = useState('idle') // idle | loading | error
  const settings = useContext(SettingsContext)

  const value = useMemo(() => {
    const today = todayKey()
    const todayLog = logs[today] || null

    const toggleExerciseDone = (id) => {
      setLogs((prev) => {
        const current = prev[today]
        if (!current) return prev
        return {
          ...prev,
          [today]: {
            ...current,
            exercises: current.exercises.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e)),
          },
        }
      })
    }

    const recentHistory = Array.from({ length: 3 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (3 - i))
      const key = todayKey(d)
      const log = logs[key]
      return {
        date: key,
        completed: isDayCompleted(log),
        exercises: log ? log.exercises.map((e) => e.name) : [],
      }
    })

    const weeklyHistory = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const key = todayKey(d)
      return {
        date: key,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3).toUpperCase(),
        completed: isDayCompleted(logs[key]),
      }
    })

    let streak = 0
    const cursor = new Date()
    cursor.setHours(0, 0, 0, 0)
    if (!isDayCompleted(logs[todayKey(cursor)])) cursor.setDate(cursor.getDate() - 1)
    while (isDayCompleted(logs[todayKey(cursor)])) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }

    const generateToday = async (force = false) => {
      const isFresh = todayLog && Date.now() - todayLog.generatedAt < DAY_MS
      if (isFresh && !force) return

      if (!settings?.apiKey) {
        setLogs((prev) => ({ ...prev, [today]: fallbackLog() }))
        setStatus('idle')
        return
      }

      setStatus('loading')
      try {
        const { exercises, motivation } = await getExerciseRecommendation(profile, recentHistory, {
          apiKey: settings.apiKey,
          model: settings.model,
        })
        setLogs((prev) => ({
          ...prev,
          [today]: { exercises, motivation, generatedAt: Date.now(), source: 'ai' },
        }))
        setStatus('idle')
      } catch {
        setLogs((prev) => ({ ...prev, [today]: fallbackLog() }))
        setStatus('error')
      }
    }

    return {
      profile,
      setProfile,
      todayLog,
      toggleExerciseDone,
      generateToday,
      status,
      streak,
      weeklyHistory,
      recentHistory,
    }
  }, [logs, setLogs, profile, setProfile, status, settings])

  return <ExerciseContext.Provider value={value}>{children}</ExerciseContext.Provider>
}
