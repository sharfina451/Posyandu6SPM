import { describe, it, expect } from 'vitest'
import { calculateVulnerabilityScore, ScoringFactors } from '../../lib/utils/scoring'

describe('calculateVulnerabilityScore utility', () => {
  it('returns 0% and "aman" when no vulnerability factors are present', () => {
    const factors: ScoringFactors = {
      lansia_tunggal: false,
      miskin_dtks: false,
      dekat_industri: false,
      balita_stunting: false,
      disabilitas: false,
    }

    const result = calculateVulnerabilityScore(factors, false)
    expect(result.totalSkor).toBe(0)
    expect(result.persen).toBe(0)
    expect(result.klasifikasi).toBe('aman')
    expect(result.potensiEksklusi).toBe(false)
  })

  it('correctly classifies moderate risk as "waspada"', () => {
    const factors: ScoringFactors = {
      lansia_tunggal: false,
      miskin_dtks: false,
      dekat_industri: true, // 15%
      balita_stunting: false,
      disabilitas: false,
    }

    const result = calculateVulnerabilityScore(factors, false)
    expect(result.persen).toBe(15)
    expect(result.klasifikasi).toBe('aman') // < 25%

    const factors2: ScoringFactors = {
      ...factors,
      disabilitas: true, // +15% = 30%
    }
    const result2 = calculateVulnerabilityScore(factors2, false)
    expect(result2.persen).toBe(30)
    expect(result2.klasifikasi).toBe('waspada') // 25% - 50%
  })

  it('flags potential exclusion when risk is high and bansos is absent', () => {
    const factors: ScoringFactors = {
      lansia_tunggal: true, // 25%
      miskin_dtks: true, // 25%
      dekat_industri: false,
      balita_stunting: false,
      disabilitas: false,
    } // total = 50% (bahaya)

    const result = calculateVulnerabilityScore(factors, false)
    expect(result.persen).toBe(50)
    expect(result.klasifikasi).toBe('bahaya')
    expect(result.potensiEksklusi).toBe(true)
  })

  it('does not flag potential exclusion when bansos is present', () => {
    const factors: ScoringFactors = {
      lansia_tunggal: true, // 25%
      miskin_dtks: true, // 25%
      dekat_industri: true, // 15%
      balita_stunting: true, // 20%
      disabilitas: true, // 15%
    } // total = 100% (kritis)

    const result = calculateVulnerabilityScore(factors, true) // bansos present
    expect(result.persen).toBe(100)
    expect(result.klasifikasi).toBe('kritis')
    expect(result.potensiEksklusi).toBe(false) // should be false since they have bansos
  })
})
