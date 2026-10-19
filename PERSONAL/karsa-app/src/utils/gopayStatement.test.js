import { describe, it, expect } from 'vitest'
import { parseGopayRows } from './gopayStatement'

const HEADER_ROWS = [
  'E-statement Halaman 1 dari 1 Periode transaksi : 1 Januari 2026 - 31 Januari 2026',
  'Test User',
  'Total Coins didapatkan Total Coins dipakai Total pemasukan Total pengeluaran',
  '+6280000000000',
  '10 0 Rp1.000.000 Rp50.000',
  'test@example.com',
  'Tanggal Transaksi ID transaksi Metode pembayaran Jumlah',
]

describe('parseGopayRows', () => {
  it('parses a simple single-line-description transaction', () => {
    const rows = [
      ...HEADER_ROWS,
      '01/01/2026 Tarik tunai 0220260101120000AbCd GoPay Saldo -Rp50.000',
      '12:00 EfGhID',
    ]
    const result = parseGopayRows(rows)
    expect(result.transactions).toEqual([
      {
        externalId: '0220260101120000AbCdEfGhID',
        dateKey: '2026-01-01',
        description: 'Tarik tunai',
        method: 'GoPay Saldo',
        type: 'expense',
        amount: 50000,
      },
    ])
    expect(result.unparsedRecords).toHaveLength(0)
    expect(result.coinsSkipped).toBe(0)
  })

  it('reconstructs a description that wraps onto the second row', () => {
    const rows = [
      ...HEADER_ROWS,
      '01/01/2026 WARUNG MAKAN ENAK 0220260101120000AbCd GoPay Saldo -Rp15.000',
      '12:00 SEKALI EfGhID',
    ]
    const result = parseGopayRows(rows)
    expect(result.transactions[0].description).toBe('WARUNG MAKAN ENAK SEKALI')
  })

  it('detects income (no sign) vs expense (minus sign)', () => {
    const rows = [
      ...HEADER_ROWS,
      '01/01/2026 GoPay top up 0220260101120000AbCd GoPay Saldo Rp1.000.000',
      '12:00 EfGhID',
    ]
    const result = parseGopayRows(rows)
    expect(result.transactions[0].type).toBe('income')
    expect(result.transactions[0].amount).toBe(1000000)
  })

  it('excludes GoPay Coins entries and counts them separately', () => {
    const rows = [
      ...HEADER_ROWS,
      '01/01/2026 Cashback Some Store 0220260101120000AbCd GoPay Coins 5',
      '12:00 EfGhID',
    ]
    const result = parseGopayRows(rows)
    expect(result.transactions).toHaveLength(0)
    expect(result.coinsSkipped).toBe(1)
  })

  it('reports a malformed pair as unparsed instead of silently dropping it', () => {
    const rows = [...HEADER_ROWS, 'this does not look like a transaction row at all', '12:00 somethingID']
    const result = parseGopayRows(rows)
    expect(result.transactions).toHaveLength(0)
    expect(result.unparsedRecords).toHaveLength(1)
    expect(result.entryCount).toBe(1)
  })

  it('strips repeated page-break noise between records without corrupting neighbors', () => {
    const rows = [
      ...HEADER_ROWS,
      '01/01/2026 Tarik tunai 0220260101120000AbCd GoPay Saldo -Rp50.000',
      '12:00 EfGhID',
      'E-statement Halaman 2 dari 2 Periode transaksi : 1 Januari 2026 - 31 Januari 2026',
      'Tanggal Transaksi ID transaksi Metode pembayaran Jumlah',
      '02/01/2026 Indomaret 0220260102120000WxYz 0120260102120000WxYz GoPay Saldo -Rp10.000',
      '12:00 QrStID',
    ]
    const result = parseGopayRows(rows)
    expect(result.transactions).toHaveLength(2)
    expect(result.unparsedRecords).toHaveLength(0)
  })

  it('extracts the statement period and official totals from the header block', () => {
    const rows = [...HEADER_ROWS, '01/01/2026 Tarik tunai 0220260101120000AbCd GoPay Saldo -Rp50.000', '12:00 EfGhID']
    const result = parseGopayRows(rows)
    expect(result.summary).toEqual({
      period: '1 Januari 2026 - 31 Januari 2026',
      coinsEarned: 10,
      coinsUsed: 0,
      statementIncome: 1000000,
      statementExpense: 50000,
    })
  })

  it('returns no transactions and a null summary for an empty/header-only input', () => {
    const result = parseGopayRows(['Tanggal Transaksi ID transaksi Metode pembayaran Jumlah'])
    expect(result.transactions).toHaveLength(0)
    expect(result.entryCount).toBe(0)
    expect(result.summary).toBeNull()
  })
})
