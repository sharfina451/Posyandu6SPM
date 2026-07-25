import { describe, it, expect } from 'vitest'
import { saranBidang } from '../../lib/utils/saran-spm'

describe('saranBidang utility', () => {
  it('recommends KIA / Balita and PAUD for a 4-year-old child', () => {
    // Set mock date of birth to 4 years ago from today
    const birthDate = new Date()
    birthDate.setFullYear(birthDate.getFullYear() - 4)
    const birthStr = birthDate.toISOString().split('T')[0]

    const suggestions = saranBidang(birthStr, 'L', false)

    // Check Kesehatan
    const health = suggestions.find((s) => s.bidang === 'kesehatan')
    expect(health).toBeDefined()
    expect(health?.subKategori).toBe('KIA / Balita')

    // Check Pendidikan
    const edu = suggestions.find((s) => s.bidang === 'pendidikan')
    expect(edu).toBeDefined()
    expect(edu?.subKategori).toBe('PAUD')

    // Check Sosial
    const social = suggestions.find((s) => s.bidang === 'sosial')
    expect(social).toBeUndefined()
  })

  it('recommends PTM / Lansia and Kesejahteraan Lansia for a 65-year-old', () => {
    const birthDate = new Date()
    birthDate.setFullYear(birthDate.getFullYear() - 65)
    const birthStr = birthDate.toISOString().split('T')[0]

    const suggestions = saranBidang(birthStr, 'P', false)

    // Check Kesehatan
    const health = suggestions.find((s) => s.bidang === 'kesehatan')
    expect(health).toBeDefined()
    expect(health?.subKategori).toBe('PTM / Lansia')

    // Check Sosial
    const social = suggestions.find((s) => s.bidang === 'sosial')
    expect(social).toBeDefined()
    expect(social?.subKategori).toBe('Kesejahteraan Lansia')
  })

  it('recommends Bansos Disabilitas for a disabled adult', () => {
    const birthDate = new Date()
    birthDate.setFullYear(birthDate.getFullYear() - 30)
    const birthStr = birthDate.toISOString().split('T')[0]

    const suggestions = saranBidang(birthStr, 'L', true)

    // Check Kesehatan
    const health = suggestions.find((s) => s.bidang === 'kesehatan')
    expect(health).toBeDefined()
    expect(health?.subKategori).toBe('PTM / K3')

    // Check Sosial
    const social = suggestions.find((s) => s.bidang === 'sosial')
    expect(social).toBeDefined()
    expect(social?.subKategori).toBe('Bansos Disabilitas')
  })
})
