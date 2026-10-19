// Pure aggregation helpers over already-categorized transactions
// ({ date: 'YYYY-MM-DD', category, amount, type }). No I/O.
import { todayKey } from './format'

function periodKeyOf(dateStr, period) {
  const d = new Date(`${dateStr}T00:00:00`)
  if (period === 'day') return dateStr
  if (period === 'week') {
    const day = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((day + 6) % 7))
    // Local Y-M-D formatting (not toISOString, which converts to UTC first
    // and shifts the date back a day for any positive UTC-offset timezone).
    return todayKey(monday)
  }
  // month
  return dateStr.slice(0, 7)
}

export function aggregateByCategory(transactions, { period = 'month' } = {}) {
  const buckets = new Map()

  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const periodKey = periodKeyOf(t.date, period)
      if (!buckets.has(periodKey)) buckets.set(periodKey, new Map())
      const categoryTotals = buckets.get(periodKey)
      categoryTotals.set(t.category, (categoryTotals.get(t.category) || 0) + t.amount)
    })

  const rows = []
  const topCategoryByPeriod = {}

  for (const [periodKey, categoryTotals] of buckets.entries()) {
    let topCategory = null
    let topAmount = -Infinity

    for (const [category, total] of categoryTotals.entries()) {
      rows.push({ periodKey, category, total })
      if (total > topAmount) {
        topAmount = total
        topCategory = category
      }
    }

    topCategoryByPeriod[periodKey] = { category: topCategory, total: topAmount }
  }

  return { rows, topCategoryByPeriod }
}
