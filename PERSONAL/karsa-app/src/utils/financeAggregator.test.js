import { describe, it, expect } from 'vitest'
import { aggregateByCategory } from './financeAggregator'

const TRANSACTIONS = [
  { date: '2026-07-01', category: 'Makan Harian', amount: 20000, type: 'expense' },
  { date: '2026-07-02', category: 'Makan Harian', amount: 30000, type: 'expense' },
  { date: '2026-07-02', category: 'Transportasi', amount: 15000, type: 'expense' },
  { date: '2026-08-01', category: 'Belanja Retail', amount: 100000, type: 'expense' },
  { date: '2026-07-03', category: 'Lainnya', amount: 5000000, type: 'income' }, // excluded: not an expense
]

describe('aggregateByCategory', () => {
  it('excludes income transactions entirely', () => {
    const { rows } = aggregateByCategory(TRANSACTIONS, { period: 'month' })
    const totalRowAmount = rows.reduce((sum, r) => sum + r.total, 0)
    expect(totalRowAmount).toBe(20000 + 30000 + 15000 + 100000)
  })

  it('groups by month and sums per category within each month', () => {
    const { rows } = aggregateByCategory(TRANSACTIONS, { period: 'month' })
    const julyMakan = rows.find((r) => r.periodKey === '2026-07' && r.category === 'Makan Harian')
    expect(julyMakan.total).toBe(50000)

    const augustBelanja = rows.find((r) => r.periodKey === '2026-08' && r.category === 'Belanja Retail')
    expect(augustBelanja.total).toBe(100000)
  })

  it('identifies the top-spending category per period', () => {
    const { topCategoryByPeriod } = aggregateByCategory(TRANSACTIONS, { period: 'month' })
    expect(topCategoryByPeriod['2026-07'].category).toBe('Makan Harian')
    expect(topCategoryByPeriod['2026-07'].total).toBe(50000)
    expect(topCategoryByPeriod['2026-08'].category).toBe('Belanja Retail')
  })

  it('groups by exact day when period is "day"', () => {
    const { rows } = aggregateByCategory(TRANSACTIONS, { period: 'day' })
    const day1 = rows.filter((r) => r.periodKey === '2026-07-01')
    expect(day1).toHaveLength(1)
    expect(day1[0].total).toBe(20000)
  })

  it('returns empty results for no transactions', () => {
    const { rows, topCategoryByPeriod } = aggregateByCategory([], { period: 'month' })
    expect(rows).toHaveLength(0)
    expect(topCategoryByPeriod).toEqual({})
  })
})
