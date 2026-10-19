import { describe, it, expect } from 'vitest'
import { parseTransactions } from './transactionParser'

// Verbatim raw rows as extracted from a real GoPay e-statement PDF export
// (row-clustered by src/utils/pdfText.js: date+description+idPart1+method+
// amount on one line, time+[description overflow]+idPart2 on the next).
const RAW_TEXT = `E-statement Halaman 1 dari 4 Periode transaksi : 4 Juli 2025 - 3 Juli 2026
Ghazanfar Latief
Total Coins didapatkan Total Coins dipakai Total pemasukan Total pengeluaran
+6281298891193
686 0 Rp2.000.000 Rp991.385
ghazanfarlatief6@gmail.com
Tanggal Transaksi ID transaksi Metode pembayaran Jumlah
03/07/2026 Tarik tunai 0220260703135633i4PV6 GoPay Saldo -Rp100.000
20:57 MEEedID
03/07/2026 Cashback WARUNG MAKAN DUA 0420260703121029FZV2 GoPay Coins 4
19:10 PUTRA JA T6sLQ3ID
03/07/2026 WARUNG MAKAN DUA PUTRA JA 0520260703121024eCUi GoPay Saldo -Rp4.000
19:10 HrA3XsID
03/07/2026 Cashback OTAK-OTAK BANG JOE 0520260703120910J0v7 GoPay Coins 16
19:09 CmY3AsID
03/07/2026 OTAK-OTAK BANG JOE 0120260703120859CtDg GoPay Saldo -Rp16.000
19:09 vucZaVID
03/07/2026 Cashback GEPREK KULIT WONG 0420260703120659rVTt2 GoPay Coins 40
19:06 SHOLEH 0CxbeID
03/07/2026 GEPREK KULIT WONG SHOLEH 0520260703120653p9v8 GoPay Saldo -Rp40.000
19:06 9R2kg8ID
03/07/2026 Ditransfer ke Mochammad Henry Alifian 0520260703113737C9xZ GoPay Saldo -Rp22.000
18:37 RRh5tSID
03/07/2026 Cashback Indomaret 0220260703102906rXx8 GoPay Coins 13
17:29 VKbk0LID
03/07/2026 Indomaret 0120260703102859kfRiY GoPay Saldo -Rp13.900
17:29 vfpL5ID
03/07/2026 Cashback SENANG REJEKI BERKAH 0220260703061524PZAr GoPay Coins 87
13:15 CV 984BdyID
03/07/2026 SENANG REJEKI BERKAH CV 0320260703061518PN1T GoPay Saldo -Rp87.000
13:15 N4V0uOID
E-statement Halaman 2 dari 4 Periode transaksi : 4 Juli 2025 - 3 Juli 2026
Tanggal Transaksi ID transaksi Metode pembayaran Jumlah
03/07/2026 Cashback SUPERINDO AGT QR 253 0220260703054552HL5m GoPay Coins 5
12:45 IwPy9SID
03/07/2026 SUPERINDO AGT QR 253 0520260703054547hiadr GoPay Saldo -Rp5.980
12:45 31Z7OID
03/07/2026 Cashback Indomaret 0220260703035930ET5 GoPay Coins 3
10:59 WKMzeSlID
03/07/2026 Indomaret 0420260703035916mqfy GoPay Saldo -Rp3.600
10:59 ZNae7zID
02/07/2026 Cashback Gepruk Geprek, Keputih 0520260702121443C36J GoPay Coins 12
19:14 yiUteFID
02/07/2026 Gepruk Geprek, Keputih 0220260702121438TjnM GoPay Saldo -Rp12.000
19:14 ko4wmQID
02/07/2026 Cashback Alfamidi 0120260702111031VmT GoPay Coins 4
18:10 PeTrA71ID
02/07/2026 Alfamidi 0120260702111026Xz7U GoPay Saldo -Rp4.000
18:10 5Enfm7ID
02/07/2026 Cashback HOKKY DARMO HARAPAN 1 0520260702104632PzUb GoPay Coins 30
17:46 xbNRmXID
02/07/2026 HOKKY DARMO HARAPAN 1 0520260702104628N8jF3 GoPay Saldo -Rp30.900
17:46 v2v5MID
02/07/2026 Cashback GAMCHI TUNJUNGAN 0520260702081324Mszc GoPay Coins 38
15:13 PLAZA3 pjpHD4ID
02/07/2026 GAMCHI TUNJUNGAN PLAZA3 0520260702081319O8Jc GoPay Saldo -Rp38.000
15:13 PSA2HKID
02/07/2026 Cashback DRAGON HOT POT 0320260702072557oaZ5 GoPay Coins 100
14:25 Kqt5k4ID
02/07/2026 DRAGON HOT POT 0320260702072553WFF GoPay Saldo -Rp139.500
14:25 KsI3ENsID
E-statement Halaman 3 dari 4 Periode transaksi : 4 Juli 2025 - 3 Juli 2026
Tanggal Transaksi ID transaksi Metode pembayaran Jumlah
02/07/2026 TUNJUNGAN 3-XXI DELUXE 0320260702050907yh3L GoPay Saldo -Rp60.000
12:09 VKS4EcID
01/07/2026 Cashback SAKINAH MINIMARKET 0220260701134855ZQrn GoPay Coins 5
20:48 poWMceID
01/07/2026 SAKINAH MINIMARKET 0420260701134831U6Yx GoPay Saldo -Rp5.400
20:48 dpYlp3ID
01/07/2026 Cashback Warung Bu'Warni - Tumapel 0520260701120434SYvja GoPay Coins 45
19:04 N9uGyID
01/07/2026 Warung Bu'Warni - Tumapel 0520260701120408fpqj0 GoPay Saldo -Rp45.000
19:04 5SxDdID
01/07/2026 Cashback APOTEK K24 KLAMPIS 04202607011034268X4V GoPay Coins 100
17:34 BZ40tCID
01/07/2026 APOTEK K24 KLAMPIS 0520260701103421r3fNs GoPay Saldo -Rp128.705
17:34 yRt6YID
01/07/2026 Cashback Win Wash Kopi Win, TMBKSR 0520260701101032f5CRi GoPay Coins 27
17:10 N3vOMID
01/07/2026 Win Wash Kopi Win, TMBKSR 0320260701101029U7Yf GoPay Saldo -Rp27.000
17:10 EGXVdnID
01/07/2026 Cashback BRUNSJ CAFE 0120260701060243IEldS GoPay Coins 52
13:02 QM1AzID
01/07/2026 BRUNSJ CAFE 0120260701060238xZfU GoPay Saldo -Rp52.600
13:02 XEOooKID
01/07/2026 Cashback MIE BAKAR BERJAYA 0120260701043341dJokb GoPay Coins 61
11:33 lZe7KID
01/07/2026 MIE BAKAR BERJAYA 0320260701043336bmL GoPay Saldo -Rp61.000
11:33 Op4ddGAID
01/07/2026 Cashback Alfamart -UBM Tower 0120260701033320XzJ8 GoPay Coins 3
10:33 whXHkPID
E-statement Halaman 4 dari 4 Periode transaksi : 4 Juli 2025 - 3 Juli 2026
Tanggal Transaksi ID transaksi Metode pembayaran Jumlah
01/07/2026 Alfamart -UBM Tower 0420260701033303YVH GoPay Saldo -Rp3.800
10:33 VxC1euNID
01/07/2026 Tarik tunai 04202607010331504yhu GoPay Saldo -Rp50.000
10:32 TUqC4UID
01/07/2026 Cashback SPBU 54.60146,ARH-HO 0320260701031225YvBT GoPay Coins 41
10:12 RKpG83ID
01/07/2026 SPBU 54.60146,ARH-HO 0120260701031221A0TS GoPay Saldo -Rp41.000
10:12 Ali1E5ID
01/07/2026 GoPay top up 0220260701024239jxSky GoPay Saldo Rp2.000.000
09:42 wySBAID`

const rows = RAW_TEXT.split('\n')

describe('parseTransactions (real GoPay statement fixture)', () => {
  const result = parseTransactions(rows)

  it('excludes every "Cashback ..." / GoPay Coins line', () => {
    const hasCashback = result.transactions.some((t) => t.description.toLowerCase().startsWith('cashback'))
    expect(hasCashback).toBe(false)
    expect(result.coinsSkipped).toBe(20)
  })

  it('parses exactly the 25 real money transactions with no unparsed leftovers', () => {
    expect(result.transactions).toHaveLength(25)
    expect(result.unparsedRecords).toHaveLength(0)
  })

  it('reconciles against the statement\'s own official totals', () => {
    const totalExpense = result.transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const totalIncome = result.transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    expect(totalExpense).toBe(991385)
    expect(totalIncome).toBe(2000000)
    expect(result.summary.statementExpense).toBe(991385)
    expect(result.summary.statementIncome).toBe(2000000)
  })

  it('extracts the statement period and coin totals', () => {
    expect(result.summary.period).toBe('4 Juli 2025 - 3 Juli 2026')
    expect(result.summary.coinsEarned).toBe(686)
    expect(result.summary.coinsUsed).toBe(0)
  })

  it('tags cash withdrawal and top-up as Transfer, not merchant spending', () => {
    const tarikTunai = result.transactions.filter((t) => t.description === 'Tarik tunai')
    const topUp = result.transactions.find((t) => t.description === 'GoPay top up')
    expect(tarikTunai).toHaveLength(2)
    tarikTunai.forEach((t) => expect(t.category).toBe('Transfer'))
    expect(topUp.category).toBe('Transfer')
  })

  it('categorizes known merchants correctly', () => {
    const byDescription = (desc) => result.transactions.find((t) => t.description === desc)

    expect(byDescription('WARUNG MAKAN DUA PUTRA JA').category).toBe('Makan Harian')
    expect(byDescription('GEPREK KULIT WONG SHOLEH').category).toBe('Makan Harian')
    expect(byDescription('DRAGON HOT POT').category).toBe('Makan Harian')
    expect(byDescription('Indomaret').category).toBe('Belanja Retail')
    expect(byDescription('SAKINAH MINIMARKET').category).toBe('Belanja Retail')
    expect(byDescription('SPBU 54.60146,ARH-HO').category).toBe('Transportasi')
    expect(byDescription('APOTEK K24 KLAMPIS').category).toBe('Kesehatan')
    expect(byDescription('TUNJUNGAN 3-XXI DELUXE').category).toBe('Hiburan')
    expect(byDescription('Ditransfer ke Mochammad Henry Alifian').category).toBe('Transfer')
  })

  it('falls back to Lainnya for ambiguous merchant names (would need AI)', () => {
    const byDescription = (desc) => result.transactions.find((t) => t.description === desc)
    expect(byDescription('OTAK-OTAK BANG JOE').category).toBe('Lainnya')
    expect(byDescription('SENANG REJEKI BERKAH CV').category).toBe('Lainnya')
    expect(byDescription('HOKKY DARMO HARAPAN 1').category).toBe('Lainnya')
  })

  it('reconstructs transaction IDs split across the wrapped line', () => {
    const tarikTunai = result.transactions.find((t) => t.description === 'Tarik tunai' && t.date === '2026-07-03')
    expect(tarikTunai.externalId).toBe('0220260703135633i4PV6MEEedID')
  })
})
