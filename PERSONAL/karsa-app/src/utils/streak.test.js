import { describe, it, expect } from 'vitest'
import { computeStreak } from './streak'
import { todayKey } from './format'

function daysAgoKey(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return todayKey(d)
}

describe('computeStreak', () => {
  it('returns 0 for empty logs', () => {
    expect(computeStreak({})).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    const logs = {
      [daysAgoKey(0)]: { sleepHours: 7 },
      [daysAgoKey(1)]: { waterGlasses: 4 },
      [daysAgoKey(2)]: { exercised: true },
    }
    expect(computeStreak(logs)).toBe(3)
  })

  it('still counts a streak ending yesterday if today has no log yet', () => {
    const logs = {
      [daysAgoKey(1)]: { sleepHours: 7 },
      [daysAgoKey(2)]: { sleepHours: 7 },
    }
    expect(computeStreak(logs)).toBe(2)
  })

  it('stops at the first gap', () => {
    const logs = {
      [daysAgoKey(0)]: { sleepHours: 7 },
      [daysAgoKey(1)]: { sleepHours: 7 },
      [daysAgoKey(3)]: { sleepHours: 7 }, // gap at day 2
    }
    expect(computeStreak(logs)).toBe(2)
  })

  it('treats a log with only false/zero fields as not filled', () => {
    const logs = {
      [daysAgoKey(0)]: {
        sleepHours: 0,
        waterGlasses: 0,
        exercised: false,
        meals: { breakfast: false, lunch: false, dinner: false },
      },
    }
    expect(computeStreak(logs)).toBe(0)
  })

  it('counts a day filled only via a meal checkbox', () => {
    const logs = {
      [daysAgoKey(0)]: { meals: { breakfast: true, lunch: false, dinner: false } },
    }
    expect(computeStreak(logs)).toBe(1)
  })
})
