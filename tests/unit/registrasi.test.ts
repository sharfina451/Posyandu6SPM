import { describe, it, expect } from 'vitest'
import { REGISTRASI_REGEX } from '../../lib/utils/registrasi'

describe('Posyandu Registration Number Validation (Kepmendagri)', () => {
  it('allows valid registration number formats (PP.KK.KC.DDDD.NNN)', () => {
    const validCodes = [
      '11.01.10.2001.001',
      '33.74.01.1002.999',
      '99.99.99.9999.999',
      '00.00.00.0000.000',
    ]

    validCodes.forEach((code) => {
      expect(REGISTRASI_REGEX.test(code)).toBe(true)
    })
  })

  it('rejects registration numbers with alphabet characters', () => {
    const invalidCodes = [
      'AA.01.10.2001.001',
      '11.AB.10.2001.001',
      '11.01.XX.2001.001',
      '11.01.10.YYYY.001',
      '11.01.10.2001.ZZZ',
    ]

    invalidCodes.forEach((code) => {
      expect(REGISTRASI_REGEX.test(code)).toBe(false)
    })
  })

  it('rejects registration numbers with wrong separators', () => {
    const invalidCodes = [
      '11-01-10-2001-001',
      '11_01_10_2001_001',
      '11/01/10/2001/001',
      '11 01 10 2001 001',
      '11.01.10.2001:001',
    ]

    invalidCodes.forEach((code) => {
      expect(REGISTRASI_REGEX.test(code)).toBe(false)
    })
  })

  it('rejects registration numbers with incorrect segment lengths', () => {
    const invalidCodes = [
      '1.01.10.2001.001', // 1 digit first segment
      '111.01.10.2001.001', // 3 digits first segment
      '11.1.10.2001.001', // 1 digit second segment
      '11.01.10.200.001', // 3 digits fourth segment
      '11.01.10.20010.001', // 5 digits fourth segment
      '11.01.10.2001.01', // 2 digits fifth segment
      '11.01.10.2001.0001', // 4 digits fifth segment
    ]

    invalidCodes.forEach((code) => {
      expect(REGISTRASI_REGEX.test(code)).toBe(false)
    })
  })

  it('rejects empty or whitespace strings', () => {
    expect(REGISTRASI_REGEX.test('')).toBe(false)
    expect(REGISTRASI_REGEX.test(' ')).toBe(false)
    expect(REGISTRASI_REGEX.test('  .  .  .    .   ')).toBe(false)
  })
})
