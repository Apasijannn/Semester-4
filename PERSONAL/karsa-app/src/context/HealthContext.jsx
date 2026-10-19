import { createContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { todayKey } from '../utils/format'
import { computeStreak } from '../utils/streak'

export const HealthContext = createContext(null)

const EMPTY_LOG = () => ({
  sleepHours: 0,
  waterGlasses: 0,
  meals: { breakfast: false, lunch: false, dinner: false },
  exercised: false,
})

export function HealthProvider({ children }) {
  const [logs, setLogs] = useLocalStorage('karsa_health_logs', {})

  const value = useMemo(() => {
    const today = todayKey()
    const todayLog = logs[today] || EMPTY_LOG()

    const updateToday = (updates) => {
      setLogs((prev) => ({
        ...prev,
        [today]: { ...EMPTY_LOG(), ...prev[today], ...updates },
      }))
    }

    const toggleMeal = (meal) => {
      setLogs((prev) => {
        const current = prev[today] || EMPTY_LOG()
        return {
          ...prev,
          [today]: { ...current, meals: { ...current.meals, [meal]: !current.meals[meal] } },
        }
      })
    }

    const streak = computeStreak(logs)

    const weeklyActivity = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const key = todayKey(d)
      const log = logs[key]
      const level = log ? (log.exercised ? 80 : log.waterGlasses ? 40 : 20) : 0
      return { date: key, label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3).toUpperCase(), level }
    })

    const recentSleepHours = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const key = todayKey(d)
      return logs[key]?.sleepHours || 0
    })

    return { logs, todayLog, updateToday, toggleMeal, streak, weeklyActivity, recentSleepHours }
  }, [logs, setLogs])

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>
}
