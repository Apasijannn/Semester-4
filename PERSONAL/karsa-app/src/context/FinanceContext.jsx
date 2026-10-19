import { createContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { createId } from '../utils/id'
import { todayKey } from '../utils/format'
import { categorizeByKeyword } from '../utils/categorizer'

export const FinanceContext = createContext(null)

const SEED_TRANSACTIONS = [
  { id: createId(), type: 'expense', amount: 24.5, category: 'Makan Harian', note: 'Cyber Slice', date: todayKey() },
  { id: createId(), type: 'expense', amount: 85, category: 'Transportasi', note: 'Metro Pass', date: todayKey() },
  { id: createId(), type: 'income', amount: 1250, category: 'Lainnya', note: 'Invoice #042', date: todayKey() },
]

export function FinanceProvider({ children }) {
  const [transactions, setTransactions] = useLocalStorage('karsa_transactions', SEED_TRANSACTIONS)
  const [statementSummaries, setStatementSummaries] = useLocalStorage('karsa_statement_summaries', [])

  const value = useMemo(() => {
    const addStatementSummary = (summary, importId) => {
      if (!summary) return
      setStatementSummaries((prev) => [{ ...summary, importId, importedAt: Date.now() }, ...prev])
    }

    const deleteStatementSummary = (importId) => {
      setStatementSummaries((prev) => prev.filter((s) => s.importId !== importId))
      setTransactions((prev) => prev.filter((t) => t.importId !== importId))
    }

    const addTransaction = (tx) => {
      setTransactions((prev) => [
        {
          id: createId(),
          type: tx.type === 'income' ? 'income' : 'expense',
          amount: Math.abs(Number(tx.amount)) || 0,
          category: tx.category || 'Lainnya',
          note: tx.note || '',
          date: tx.date || todayKey(),
          source: tx.source || 'manual',
          externalId: tx.externalId || null,
        },
        ...prev,
      ])
    }

    const importTransactions = (parsedTransactions, importId) => {
      let added = 0
      let duplicates = 0
      const next = [...transactions]
      const seenIds = new Set(transactions.map((t) => t.externalId).filter(Boolean))

      parsedTransactions.forEach((tx) => {
        if (seenIds.has(tx.externalId)) {
          duplicates += 1
          return
        }
        next.unshift({
          id: createId(),
          type: tx.type,
          amount: Math.abs(Number(tx.amount)) || 0,
          category: tx.category || categorizeByKeyword(tx.description) || 'Lainnya',
          note: tx.description || '',
          date: tx.date || tx.dateKey || todayKey(),
          source: 'gopay-statement',
          externalId: tx.externalId,
          importId,
        })
        seenIds.add(tx.externalId)
        added += 1
      })

      if (added > 0) {
        setTransactions(next)
      }

      return { added, duplicates }
    }

    const updateTransaction = (id, updates) => {
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
    }

    const deleteTransaction = (id) => {
      setTransactions((prev) => prev.filter((t) => t.id !== id))
    }

    const deleteTransactions = (ids) => {
      const idSet = new Set(ids)
      setTransactions((prev) => prev.filter((t) => !idSet.has(t.id)))
    }

    const deleteAllTransactions = () => {
      setTransactions([])
    }

    // Re-runs keyword categorization over already-imported GoPay transactions
    // (covers ones imported before this feature existed, where category was
    // just the raw merchant description). Manual entries are left alone —
    // their category was chosen deliberately, not auto-assigned.
    const recategorizeAll = () => {
      let updated = 0
      const next = transactions.map((t) => {
        if (t.source !== 'gopay-statement') return t
        const category = categorizeByKeyword(t.note) || 'Lainnya'
        if (category === t.category) return t
        updated += 1
        return { ...t, category }
      })

      if (updated > 0) {
        setTransactions(next)
      }

      return updated
    }

    const updateTransactionCategories = (categoryById) => {
      setTransactions((prev) => prev.map((t) => (categoryById[t.id] ? { ...t, category: categoryById[t.id] } : t)))
    }

    const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    const balance = income - expense

    const allocationMap = transactions
      .filter((t) => t.type === 'expense')
      .reduce((map, t) => {
        map[t.category] = (map[t.category] || 0) + t.amount
        return map
      }, {})
    const allocation = Object.entries(allocationMap).map(([category, amount]) => ({ category, amount }))

    return {
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      deleteTransactions,
      deleteAllTransactions,
      importTransactions,
      recategorizeAll,
      updateTransactionCategories,
      statementSummaries,
      addStatementSummary,
      deleteStatementSummary,
      income,
      expense,
      balance,
      allocation,
    }
  }, [transactions, setTransactions, statementSummaries, setStatementSummaries])

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}
