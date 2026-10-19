import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { RetroButton } from '../ui/RetroButton'
import { TerminalInput } from '../ui/TerminalInput'
import { todayKey } from '../../utils/format'
import { CATEGORIES } from '../../utils/categorizer'

export function TransactionForm({ open, onClose, onSubmit }) {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[CATEGORIES.length - 1])
  const [note, setNote] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    onSubmit({ type, amount: Number(amount), category, note: note.trim(), date: todayKey() })
    setAmount('')
    setCategory(CATEGORIES[CATEGORIES.length - 1])
    setNote('')
    setType('expense')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="New Transaction">
      <form onSubmit={handleSubmit} className="flex flex-col gap-stack-md">
        <div className="flex gap-2 border-2 border-primary p-1 bg-surface-container shadow-[2px_2px_0px_0px_rgba(24,28,44,1)] rounded-sm w-fit">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`px-3 py-1 font-label-caps text-label-caps ${type === 'expense' ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-variant'}`}
          >
            EXPENSE
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`px-3 py-1 font-label-caps text-label-caps ${type === 'income' ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-variant'}`}
          >
            INCOME
          </button>
        </div>

        <label className="flex flex-col gap-1">
          <span className="font-label-caps text-label-caps text-on-surface-variant">Amount</span>
          <TerminalInput type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-label-caps text-label-caps text-on-surface-variant">Category</span>
          <select
            className="brutal-border bg-surface p-2 font-body-sm text-body-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-label-caps text-label-caps text-on-surface-variant">Note</span>
          <TerminalInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional description" />
        </label>

        <RetroButton type="submit" icon="save" className="self-start mt-stack-sm">
          Add Transaction
        </RetroButton>
      </form>
    </Modal>
  )
}
