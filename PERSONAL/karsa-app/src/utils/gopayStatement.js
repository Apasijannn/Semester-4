// Confirmed against a real GoPay e-statement export: every transaction is
// reconstructed by our row-clustering as exactly two lines —
//   Row A: "DD/MM/YYYY <description...> <16-digit-anchored ID part 1> <method> <amount>"
//   Row B: "HH:MM [<description overflow...>] <ID part 2, ends in 'ID'>"
// The date+time cell sits to the left of the row and is visually split
// across two lines; the transaction ID is long enough to wrap onto that
// same second line, and when the description itself is long, its overflow
// also lands on Row B, between the time and the ID's tail. All observed IDs
// are exactly 16 digits (a type code + yyyymmddhhmmss-ish stamp) followed by
// more alphanumeric characters, always ending in literal "ID".
//
// "GoPay Coins" entries (cashback/loyalty points) are excluded on purpose —
// they're not Rupiah and would corrupt the balance if imported as money.

const TABLE_HEADER_PATTERN = /^Tanggal\s+Transaksi\b/i
const NOISE_PATTERNS = [/^E-statement\b/i, TABLE_HEADER_PATTERN]
const ROW_A_PATTERN = /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(\d{16}[A-Za-z0-9]*)\s+(.+?)\s+(-?Rp[\d.,]+|\d+)$/
const ID_TAIL_PATTERN = /^[A-Za-z0-9]+ID$/

// Page 1 carries an account-info block (name, phone, email, coin/Rupiah
// totals) above the table that has no fixed shape to pattern-match line by
// line — but it always ends right before the first "Tanggal Transaksi..."
// column header, so we split there: everything before is the header block
// (parsed separately for the statement summary), everything after is data.
function splitHeaderBlock(rows) {
  const headerIndex = rows.findIndex((row) => TABLE_HEADER_PATTERN.test(row))
  if (headerIndex === -1) return { headerRows: [], dataRows: rows }
  return { headerRows: rows.slice(0, headerIndex), dataRows: rows.slice(headerIndex + 1) }
}

// The "Total Coins didapatkan / dipakai / Total pemasukan / pengeluaran"
// labels and their values land in different row clusters (the phone number
// sits between them at a different y-position), so we scan the whole header
// block for the one row shaped like "<int> <int> <Rp...> <Rp...>" rather
// than assuming a fixed position relative to the labels.
const SUMMARY_VALUES_PATTERN = /^(\d+)\s+(\d+)\s+(Rp[\d.,]+)\s+(Rp[\d.,]+)$/
const PERIOD_PATTERN = /Periode transaksi\s*:\s*(\d{1,2}\s+\w+\s+\d{4}\s*-\s*\d{1,2}\s+\w+\s+\d{4})/i

function parseRupiah(str) {
  return Number(str.replace(/[^\d]/g, '')) || 0
}

function parseStatementSummary(headerRows) {
  const blob = headerRows.join(' ')
  const periodMatch = blob.match(PERIOD_PATTERN)

  let coinsEarned = null
  let coinsUsed = null
  let statementIncome = null
  let statementExpense = null

  headerRows.some((row) => {
    const match = row.match(SUMMARY_VALUES_PATTERN)
    if (!match) return false
    coinsEarned = Number(match[1])
    coinsUsed = Number(match[2])
    statementIncome = parseRupiah(match[3])
    statementExpense = parseRupiah(match[4])
    return true
  })

  const hasData = periodMatch || statementIncome !== null
  if (!hasData) return null

  return {
    period: periodMatch ? periodMatch[1].trim() : null,
    coinsEarned,
    coinsUsed,
    statementIncome,
    statementExpense,
  }
}

function parseDateKey(dateStr) {
  const [day, month, year] = dateStr.split('/').map(Number)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseAmount(amountStr) {
  const isNegative = amountStr.trim().startsWith('-')
  const digits = amountStr.replace(/[^\d]/g, '')
  return { amount: Number(digits) || 0, isNegative }
}

function parseRowB(rowB) {
  const tokens = rowB.trim().split(/\s+/)
  const time = tokens[0]
  if (!/^\d{2}:\d{2}$/.test(time)) return null

  const idPart2 = tokens[tokens.length - 1]
  if (!ID_TAIL_PATTERN.test(idPart2)) return null

  const descContinuation = tokens.slice(1, -1).join(' ')
  return { time, descContinuation, idPart2 }
}

export function parseGopayRows(rows) {
  const { headerRows, dataRows } = splitHeaderBlock(rows)
  const summary = parseStatementSummary(headerRows)
  const cleanRows = dataRows.filter((row) => !NOISE_PATTERNS.some((pattern) => pattern.test(row)))

  const transactions = []
  const unparsedRecords = []
  let coinsSkipped = 0
  let entryCount = 0

  for (let i = 0; i < cleanRows.length; i += 2) {
    const rowA = cleanRows[i]
    const rowB = cleanRows[i + 1]
    entryCount += 1

    const matchA = rowA && rowA.match(ROW_A_PATTERN)
    const matchB = rowB && parseRowB(rowB)

    if (!matchA || !matchB) {
      unparsedRecords.push(`${rowA || ''} || ${rowB || ''}`)
      continue
    }

    const [, dateStr, descPart1, idPart1, method, amountStr] = matchA
    const { descContinuation, idPart2 } = matchB

    if (method.toLowerCase().includes('coins')) {
      coinsSkipped += 1
      continue
    }

    const { amount, isNegative } = parseAmount(amountStr)

    transactions.push({
      externalId: `${idPart1}${idPart2}`,
      dateKey: parseDateKey(dateStr),
      description: descContinuation ? `${descPart1} ${descContinuation}` : descPart1,
      method: method.trim(),
      type: isNegative ? 'expense' : 'income',
      amount,
    })
  }

  return { transactions, coinsSkipped, unparsedRecords, entryCount, summary }
}
