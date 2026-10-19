import { formatCurrency } from '../../utils/format'
import { RetroButton } from '../ui/RetroButton'

function summaryLabel(summary, index) {
  const period = summary.period || `Import #${index + 1}`
  const importedAt = summary.importedAt ? new Date(summary.importedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
  return importedAt ? `${period} (imported ${importedAt})` : period
}

export function StatementSummaryCard({ summaries, selectedIndex, onSelectIndex, transactionCount, onDelete }) {
  if (!summaries || summaries.length === 0) return null

  const summary = summaries[selectedIndex] || summaries[0]

  const handleDelete = () => {
    const message =
      transactionCount > 0
        ? `Delete this statement summary and its ${transactionCount} imported transaction(s)? This can't be undone.`
        : `Delete this statement summary? This can't be undone.`
    if (!window.confirm(message)) return
    onDelete(summary.importId)
  }

  return (
    <div className="bento-card col-span-1 md:col-span-12 p-bento-padding flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-label-caps text-label-caps text-on-surface-variant px-2 py-1 border border-outline rounded-sm bg-surface">
            GoPay_Statement
          </span>
          {summaries.length > 1 && (
            <select
              className="brutal-border bg-surface p-1 font-label-caps text-label-caps"
              value={selectedIndex}
              onChange={(e) => onSelectIndex(Number(e.target.value))}
            >
              {summaries.map((s, i) => (
                <option key={i} value={i}>
                  {summaryLabel(s, i)}
                </option>
              ))}
            </select>
          )}
          <RetroButton type="button" variant="ghost" icon="delete" onClick={handleDelete}>
            Delete
          </RetroButton>
        </div>
        {summary.period && (
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Period: {summary.period}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-6">
        {summary.coinsEarned !== null && (
          <div className="text-center">
            <p className="font-headline-lg text-headline-lg text-tertiary-container">{summary.coinsEarned}</p>
            <p className="font-label-caps text-[10px] text-on-surface-variant">COINS EARNED</p>
          </div>
        )}
        {summary.coinsUsed !== null && (
          <div className="text-center">
            <p className="font-headline-lg text-headline-lg text-primary">{summary.coinsUsed}</p>
            <p className="font-label-caps text-[10px] text-on-surface-variant">COINS USED</p>
          </div>
        )}
        {summary.statementIncome !== null && (
          <div className="text-center">
            <p className="font-headline-lg text-headline-lg text-tertiary-container">{formatCurrency(summary.statementIncome)}</p>
            <p className="font-label-caps text-[10px] text-on-surface-variant">OFFICIAL INCOME</p>
          </div>
        )}
        {summary.statementExpense !== null && (
          <div className="text-center">
            <p className="font-headline-lg text-headline-lg text-primary">{formatCurrency(summary.statementExpense)}</p>
            <p className="font-label-caps text-[10px] text-on-surface-variant">OFFICIAL EXPENSE</p>
          </div>
        )}
      </div>
    </div>
  )
}
