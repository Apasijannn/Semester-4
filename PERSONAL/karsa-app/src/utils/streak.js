import { todayKey } from './format'

function isLogFilled(log) {
  if (!log) return false
  const hasMeal = log.meals && (log.meals.breakfast || log.meals.lunch || log.meals.dinner)
  return Boolean(log.sleepHours || log.waterGlasses || log.exercised || hasMeal)
}

export function computeStreak(logsByDate) {
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  const startsToday = isLogFilled(logsByDate[todayKey(cursor)])
  if (!startsToday) {
    cursor.setDate(cursor.getDate() - 1)
  }

  while (isLogFilled(logsByDate[todayKey(cursor)])) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}
