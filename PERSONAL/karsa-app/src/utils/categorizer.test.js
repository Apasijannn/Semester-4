import { describe, it, expect } from 'vitest'
import { categorizeByKeyword, CATEGORIES } from './categorizer'

describe('categorizeByKeyword', () => {
  it('categorizes cash withdrawal and top-up as Transfer', () => {
    expect(categorizeByKeyword('Tarik tunai')).toBe('Transfer')
    expect(categorizeByKeyword('GoPay top up')).toBe('Transfer')
    expect(categorizeByKeyword('Ditransfer ke Mochammad Henry Alifian')).toBe('Transfer')
  })

  it('categorizes food/warung merchants as Makan Harian', () => {
    expect(categorizeByKeyword('WARUNG MAKAN DUA PUTRA JA')).toBe('Makan Harian')
    expect(categorizeByKeyword('GEPREK KULIT WONG SHOLEH')).toBe('Makan Harian')
    expect(categorizeByKeyword('Gepruk Geprek, Keputih')).toBe('Makan Harian')
    expect(categorizeByKeyword('GAMCHI TUNJUNGAN PLAZA3')).toBe('Makan Harian')
    expect(categorizeByKeyword('DRAGON HOT POT')).toBe('Makan Harian')
    expect(categorizeByKeyword("Warung Bu'Warni - Tumapel")).toBe('Makan Harian')
    expect(categorizeByKeyword('Win Wash Kopi Win, TMBKSR')).toBe('Makan Harian')
    expect(categorizeByKeyword('BRUNSJ CAFE')).toBe('Makan Harian')
    expect(categorizeByKeyword('MIE BAKAR BERJAYA')).toBe('Makan Harian')
  })

  it('categorizes minimarket/supermarket merchants as Belanja Retail', () => {
    expect(categorizeByKeyword('Indomaret')).toBe('Belanja Retail')
    expect(categorizeByKeyword('Alfamidi')).toBe('Belanja Retail')
    expect(categorizeByKeyword('SUPERINDO AGT QR 253')).toBe('Belanja Retail')
    expect(categorizeByKeyword('SAKINAH MINIMARKET')).toBe('Belanja Retail')
    expect(categorizeByKeyword('Alfamart -UBM Tower')).toBe('Belanja Retail')
  })

  it('categorizes fuel stations as Transportasi', () => {
    expect(categorizeByKeyword('SPBU 54.60146,ARH-HO')).toBe('Transportasi')
  })

  it('categorizes pharmacies as Kesehatan', () => {
    expect(categorizeByKeyword('APOTEK K24 KLAMPIS')).toBe('Kesehatan')
  })

  it('categorizes cinemas as Hiburan', () => {
    expect(categorizeByKeyword('TUNJUNGAN 3-XXI DELUXE')).toBe('Hiburan')
  })

  it('returns null (needs AI fallback) for ambiguous merchant names', () => {
    expect(categorizeByKeyword('OTAK-OTAK BANG JOE')).toBeNull()
    expect(categorizeByKeyword('SENANG REJEKI BERKAH CV')).toBeNull()
    expect(categorizeByKeyword('HOKKY DARMO HARAPAN 1')).toBeNull()
  })

  it('is case-insensitive', () => {
    expect(categorizeByKeyword('indomaret')).toBe('Belanja Retail')
    expect(categorizeByKeyword('INDOMARET')).toBe('Belanja Retail')
  })

  it('only ever returns a known category or null', () => {
    const samples = ['Tarik tunai', 'Indomaret', 'random unknown merchant xyz', '']
    samples.forEach((s) => {
      const result = categorizeByKeyword(s)
      expect(result === null || CATEGORIES.includes(result)).toBe(true)
    })
  })
})
