// Builds on gopayStatement.js's row-parsing (which already handles the
// PDF-specific 2-row record reconstruction and excludes "GoPay Coins"
// cashback/loyalty entries — proven against a real statement export) rather
// than re-implementing that from scratch. This module's job is just to
// reshape that output into the generic transaction shape and attach a
// keyword-based category to each one.
import { parseGopayRows } from './gopayStatement'
import { categorizeByKeyword, CATEGORIES } from './categorizer'

export { CATEGORIES }

export function parseTransactions(rows) {
  const { transactions, coinsSkipped, unparsedRecords, entryCount, summary } = parseGopayRows(rows)

  const categorized = transactions.map((tx) => ({
    date: tx.dateKey,
    description: tx.description,
    amount: tx.amount,
    type: tx.type,
    externalId: tx.externalId,
    category: categorizeByKeyword(tx.description) || 'Lainnya',
  }))

  return { transactions: categorized, coinsSkipped, unparsedRecords, entryCount, summary }
}
