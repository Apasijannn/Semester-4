import { useState } from 'react'
import { useFinance } from '../hooks/useFinance'
import { useSettings } from '../hooks/useSettings'
import { categorizeBatchWithAI } from '../utils/categorizer'
import { BalanceCard } from '../components/finance/BalanceCard'
import { AllocationDonut } from '../components/finance/AllocationDonut'
import { TransactionList } from '../components/finance/TransactionList'
import { TransactionForm } from '../components/finance/TransactionForm'
import { StatementImport } from '../components/finance/StatementImport'
import { StatementSummaryCard } from '../components/finance/StatementSummaryCard'
import { RetroButton } from '../components/ui/RetroButton'

export function Finance() {
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    deleteTransactions,
    deleteAllTransactions,
    recategorizeAll,
    updateTransactionCategories,
    balance,
    income,
    expense,
    allocation,
    statementSummaries,
    deleteStatementSummary,
  } = useFinance()
  const { apiKey, model } = useSettings()
  const [formOpen, setFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [selectedSummaryIndex, setSelectedSummaryIndex] = useState(0)
  const [categorizeStatus, setCategorizeStatus] = useState('')
  const [isCategorizing, setIsCategorizing] = useState(false)

  const selectedSummary = statementSummaries[selectedSummaryIndex] || statementSummaries[0]
  const selectedSummaryTxCount = selectedSummary
    ? transactions.filter((t) => t.importId === selectedSummary.importId).length
    : 0

  const handleDeleteSummary = (importId) => {
    deleteStatementSummary(importId)
    setSelectedSummaryIndex(0)
  }

  const uncategorized = transactions.filter((t) => t.category === 'Lainnya')

  const handleRecategorizeAll = () => {
    const updated = recategorizeAll()
    setCategorizeStatus(`Re-categorized ${updated} transaction(s).`)
  }

  const handleCategorizeWithAI = async () => {
    if (uncategorized.length === 0 || !apiKey) return
    setIsCategorizing(true)
    setCategorizeStatus('')
    try {
      const descriptions = uncategorized.map((t) => t.note || t.category)
      const categories = await categorizeBatchWithAI(descriptions, { apiKey, model })
      const categoryById = {}
      uncategorized.forEach((t, i) => {
        categoryById[t.id] = categories[i]
      })
      updateTransactionCategories(categoryById)
      setCategorizeStatus(`Categorized ${uncategorized.length} transaction(s) with AI.`)
    } catch (err) {
      setCategorizeStatus(err.message || 'AI categorization failed.')
    } finally {
      setIsCategorizing(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-grid-gutter flex-wrap gap-stack-md">
        <div>
          <h2 className="font-headline-xl text-headline-xl text-primary relative inline-block">
            Finance Ledger
            <span className="absolute -bottom-2 left-0 w-full h-2 bg-secondary-container -z-10 transform -rotate-1" />
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">All amounts stored locally in your browser.</p>
        </div>
        <div className="flex gap-stack-sm flex-wrap">
          <RetroButton variant="ghost" icon="upload_file" onClick={() => setImportOpen(true)}>
            Import Statement
          </RetroButton>
          <RetroButton icon="add" onClick={() => setFormOpen(true)}>
            New Transaction
          </RetroButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-grid-gutter">
        <BalanceCard balance={balance} income={income} expense={expense} />
        <AllocationDonut allocation={allocation} />
        <StatementSummaryCard
          summaries={statementSummaries}
          selectedIndex={selectedSummaryIndex}
          onSelectIndex={setSelectedSummaryIndex}
          transactionCount={selectedSummaryTxCount}
          onDelete={handleDeleteSummary}
        />

        {transactions.some((t) => t.source === 'gopay-statement') && (
          <div className="bento-card col-span-1 md:col-span-12 p-bento-padding flex flex-wrap items-center justify-between gap-stack-md">
            <div className="flex items-center gap-stack-sm flex-wrap">
              <RetroButton type="button" variant="ghost" icon="sync" onClick={handleRecategorizeAll}>
                Re-categorize All
              </RetroButton>
              <RetroButton
                type="button"
                variant="ghost"
                icon="auto_awesome"
                onClick={handleCategorizeWithAI}
                disabled={uncategorized.length === 0 || !apiKey || isCategorizing}
              >
                {isCategorizing ? 'Categorizing...' : `Categorize with AI (${uncategorized.length} "Lainnya")`}
              </RetroButton>
            </div>
            {categorizeStatus && (
              <span className="font-label-caps text-label-caps text-tertiary-container">{categorizeStatus}</span>
            )}
            {uncategorized.length > 0 && !apiKey && (
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                Set an API key in Settings to enable AI categorization.
              </span>
            )}
          </div>
        )}

        <TransactionList
          transactions={transactions}
          onDelete={deleteTransaction}
          onDeleteSelected={deleteTransactions}
          onDeleteAll={deleteAllTransactions}
        />
      </div>

      <TransactionForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={addTransaction} />
      <StatementImport open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}
