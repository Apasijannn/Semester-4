import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { RetroButton } from '../ui/RetroButton'
import { WashiChip } from '../ui/WashiChip'
import { useFinance } from '../../hooks/useFinance'
import { parseTransactions } from '../../utils/transactionParser'
import { formatCurrency, formatDateLabel } from '../../utils/format'
import { createId } from '../../utils/id'

export function StatementImport({ open, onClose }) {
  const { transactions, importTransactions, addStatementSummary } = useFinance()
  const [status, setStatus] = useState('idle') // idle | parsing | preview | error
  const [parsed, setParsed] = useState(null)
  const [rawRows, setRawRows] = useState([])
  const [error, setError] = useState('')
  const [resultMessage, setResultMessage] = useState('')

  const reset = () => {
    setStatus('idle')
    setParsed(null)
    setRawRows([])
    setError('')
    setResultMessage('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus('parsing')
    setError('')
    setResultMessage('')

    try {
      const { extractPdfRows } = await import('../../utils/pdfText')
      const rows = await extractPdfRows(file)
      const result = parseTransactions(rows)
      setParsed(result)
      setRawRows(rows)
      setStatus('preview')
    } catch (err) {
      setError(err.message || 'Failed to read this PDF.')
      setStatus('error')
    }
  }

  const handleImport = () => {
    if (!parsed) return
    const importId = createId()
    const { added, duplicates } = importTransactions(parsed.transactions, importId)
    addStatementSummary(parsed.summary, importId)
    setResultMessage(`Added ${added} transaction(s)${duplicates ? `, skipped ${duplicates} already-imported duplicate(s)` : ''}.`)
    setParsed(null)
    setStatus('idle')
  }

  const parsedIncome = parsed?.transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0) || 0
  const parsedExpense = parsed?.transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0) || 0
  const summary = parsed?.summary
  const incomeMatches = summary?.statementIncome === null || summary?.statementIncome === undefined || summary.statementIncome === parsedIncome
  const expenseMatches = summary?.statementExpense === null || summary?.statementExpense === undefined || summary.statementExpense === parsedExpense
  const reconciles = incomeMatches && expenseMatches

  const existingIds = new Set(transactions.map((t) => t.externalId).filter(Boolean))

  return (
    <Modal open={open} onClose={handleClose} title="Import Statement">
      <div className="flex flex-col gap-stack-md">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Upload a GoPay e-statement PDF (from the Gojek app). Everything is read in your browser — the file is
          never uploaded anywhere.
        </p>

        <label className="brutal-border bg-surface p-stack-md flex flex-col items-center gap-stack-sm cursor-pointer hover:bg-surface-variant transition-colors">
          <span className="material-symbols-outlined text-3xl text-primary">upload_file</span>
          <span className="font-label-caps text-label-caps text-on-surface-variant">
            {status === 'parsing' ? 'Reading PDF...' : 'Click to choose a PDF file'}
          </span>
          <input type="file" accept="application/pdf" className="hidden" onChange={handleFile} disabled={status === 'parsing'} />
        </label>

        {status === 'error' && <p className="font-body-sm text-body-sm text-secondary">{error}</p>}
        {resultMessage && <p className="font-body-sm text-body-sm text-tertiary-container">{resultMessage}</p>}

        {status === 'preview' && parsed && (
          <div className="flex flex-col gap-stack-md">
            <p className="font-label-caps text-label-caps text-on-surface-variant">
              Detected {parsed.entryCount} entr{parsed.entryCount === 1 ? 'y' : 'ies'} in the file: {parsed.transactions.length} money transaction(s)
              {parsed.coinsSkipped > 0 && `, ${parsed.coinsSkipped} GoPay Coins entr${parsed.coinsSkipped === 1 ? 'y' : 'ies'} excluded (not currency)`}
              {parsed.unparsedRecords.length > 0 && `, ${parsed.unparsedRecords.length} unrecognized entr${parsed.unparsedRecords.length === 1 ? 'y' : 'ies'} skipped`}.
            </p>

            {parsed.entryCount === 0 && (
              <p className="font-body-sm text-body-sm text-secondary">
                No entries detected at all — the PDF's text layout doesn't match what this parser expects. Expand
                "Show raw extracted text" below and share it so the parser can be adjusted.
              </p>
            )}

            {summary && (
              <div className="brutal-border bg-surface-container-low p-stack-sm flex flex-col gap-1">
                {summary.period && (
                  <p className="font-label-caps text-label-caps text-on-surface-variant">PERIOD: {summary.period}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 font-body-sm text-body-sm">
                  {summary.coinsEarned !== null && <span>Coins earned: {summary.coinsEarned}</span>}
                  {summary.coinsUsed !== null && <span>Coins used: {summary.coinsUsed}</span>}
                  {summary.statementIncome !== null && <span>Official income: {formatCurrency(summary.statementIncome)}</span>}
                  {summary.statementExpense !== null && <span>Official expense: {formatCurrency(summary.statementExpense)}</span>}
                </div>
                {(summary.statementIncome !== null || summary.statementExpense !== null) && (
                  <p className={`font-label-caps text-label-caps mt-1 ${reconciles ? 'text-tertiary-container' : 'text-secondary'}`}>
                    {reconciles
                      ? '✓ Parsed totals match the statement\'s official totals'
                      : `⚠ Parsed totals differ — parsed income ${formatCurrency(parsedIncome)} / expense ${formatCurrency(parsedExpense)}`}
                  </p>
                )}
              </div>
            )}

            {parsed.transactions.length > 0 && (
              <div className="max-h-64 overflow-y-auto flex flex-col gap-2 brutal-border p-stack-sm">
                {parsed.transactions.map((tx, i) => {
                  const isDuplicate = existingIds.has(tx.externalId)
                  return (
                    <div key={`${tx.externalId}-${i}`} className="flex items-center justify-between gap-2 text-body-sm font-body-sm border-b border-dashed border-outline-variant pb-2">
                      <div>
                        <p className="font-bold text-primary">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-on-surface-variant">{formatDateLabel(tx.date)}</span>
                          <WashiChip tone={tx.category === 'Lainnya' ? 'secondary' : 'tertiary'}>{tx.category}</WashiChip>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isDuplicate && <WashiChip tone="tertiary">ALREADY IMPORTED</WashiChip>}
                        <span className={tx.type === 'income' ? 'text-tertiary-container font-bold' : 'text-primary font-bold'}>
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {parsed.unparsedRecords.length > 0 && (
              <details className="font-body-sm text-body-sm text-on-surface-variant">
                <summary className="cursor-pointer font-label-caps text-label-caps">Show unrecognized entries</summary>
                <ul className="mt-stack-sm flex flex-col gap-1 max-h-32 overflow-y-auto">
                  {parsed.unparsedRecords.map((line, i) => (
                    <li key={i} className="text-[11px] break-all border-b border-dashed border-outline-variant pb-1">
                      {line}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <details className="font-body-sm text-body-sm text-on-surface-variant">
              <summary className="cursor-pointer font-label-caps text-label-caps">Show raw extracted text ({rawRows.length} lines)</summary>
              <ul className="mt-stack-sm flex flex-col gap-1 max-h-48 overflow-y-auto">
                {rawRows.map((line, i) => (
                  <li key={i} className="text-[11px] break-all border-b border-dashed border-outline-variant pb-1">
                    {line}
                  </li>
                ))}
              </ul>
            </details>

            <RetroButton type="button" icon="save" onClick={handleImport} disabled={parsed.transactions.length === 0}>
              Import {parsed.transactions.length} Transaction(s)
            </RetroButton>
          </div>
        )}
      </div>
    </Modal>
  )
}
