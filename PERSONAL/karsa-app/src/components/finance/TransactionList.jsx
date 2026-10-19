import { useState } from 'react'
import { formatCurrency, formatDateLabel } from '../../utils/format'
import { HandDrawnCheckbox } from '../ui/HandDrawnCheckbox'
import { RetroButton } from '../ui/RetroButton'

const ICONS = {
  income: 'work',
  expense: 'shopping_bag',
}

export function TransactionList({ transactions, onDelete, onDeleteSelected, onDeleteAll }) {
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const toggleOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const allSelected = transactions.length > 0 && selectedIds.size === transactions.length

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(transactions.map((t) => t.id)))
  }

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return
    if (!window.confirm(`Delete ${selectedIds.size} selected transaction(s)? This can't be undone.`)) return
    onDeleteSelected(Array.from(selectedIds))
    setSelectedIds(new Set())
  }

  const handleDeleteAll = () => {
    if (!window.confirm(`Delete all ${transactions.length} transaction(s)? This can't be undone.`)) return
    onDeleteAll()
    setSelectedIds(new Set())
  }

  return (
    <div className="bento-card col-span-1 md:col-span-12 p-bento-padding">
      <div className="flex justify-between items-center border-b-2 border-primary pb-stack-md mb-stack-md border-dashed flex-wrap gap-stack-sm">
        <div className="flex items-center gap-stack-md flex-wrap">
          <span className="font-label-caps text-label-caps text-on-surface-variant px-2 py-1 border border-outline rounded-sm bg-surface">
            Recent_Ledger
          </span>
          {transactions.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer">
              <HandDrawnCheckbox checked={allSelected} onChange={toggleAll} className="w-5 h-5" />
              <span className="font-label-caps text-label-caps text-on-surface-variant">SELECT ALL</span>
            </label>
          )}
        </div>
        <div className="flex items-center gap-stack-sm flex-wrap">
          {selectedIds.size > 0 && (
            <RetroButton variant="secondary" icon="delete" onClick={handleDeleteSelected}>
              Delete Selected ({selectedIds.size})
            </RetroButton>
          )}
          {transactions.length > 0 && (
            <RetroButton variant="ghost" icon="delete_sweep" onClick={handleDeleteAll}>
              Delete All
            </RetroButton>
          )}
          <span className="font-label-caps text-label-caps text-outline">{transactions.length} entries</span>
        </div>
      </div>
      {transactions.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant italic">No transactions yet.</p>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-stack-sm hover:bg-surface-variant transition-colors border-2 border-transparent hover:border-primary border-dashed rounded-sm group"
            >
              <div className="flex items-center gap-4">
                <HandDrawnCheckbox checked={selectedIds.has(tx.id)} onChange={() => toggleOne(tx.id)} className="w-5 h-5 shrink-0" />
                <div
                  className={`w-10 h-10 border-2 border-primary flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(24,28,44,1)] ${
                    tx.type === 'income' ? 'bg-tertiary-container' : 'bg-secondary-container'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${tx.type === 'income' ? 'text-on-tertiary-container' : 'text-on-secondary-container'}`}
                  >
                    {ICONS[tx.type]}
                  </span>
                </div>
                <div>
                  <p className="font-body-md text-body-md font-bold text-primary">{tx.note || tx.category}</p>
                  <p className="font-label-caps text-[10px] text-on-surface-variant">
                    {tx.category.toUpperCase()} / {formatDateLabel(tx.date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className={`font-body-md text-body-md font-bold ${tx.type === 'income' ? 'text-tertiary-container' : 'text-primary'}`}>
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </p>
                <button
                  type="button"
                  onClick={() => onDelete(tx.id)}
                  className="material-symbols-outlined text-outline hover:text-secondary transition-colors opacity-0 group-hover:opacity-100"
                >
                  delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
