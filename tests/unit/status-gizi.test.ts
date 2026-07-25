import { describe, it, expect } from 'vitest'
import { hitungStatusGizi } from '../../lib/utils/status-gizi'

describe('hitungStatusGizi utility', () => {
  it('classifies normal status correctly', () => {
    const dob = new Date()
    dob.setMonth(dob.getMonth() - 12)
    const dobStr = dob.toISOString().split('T')[0]

    // Boys 12m: Median W=9.6, Median H=75.7
    const status = hitungStatusGizi(dobStr, 'L', 9.5, 75.0)
    expect(status).toBe('normal')
  })

  it('classifies stunting correctly for a short child', () => {
    const dob = new Date()
    dob.setMonth(dob.getMonth() - 24)
    const dobStr = dob.toISOString().split('T')[0]

    // Girls 24m: Median H=86.4, SD=3.2. A height of 75cm is far below -2SD (80cm)
    const status = hitungStatusGizi(dobStr, 'P', 11.5, 75.0)
    expect(status).toContain('stunting')
  })

  it('classifies gizi kurang correctly for a underweight child', () => {
    const dob = new Date()
    dob.setMonth(dob.getMonth() - 6)
    const dobStr = dob.toISOString().split('T')[0]

    // Boys 6m: Median W=7.9, SD=0.8. A weight of 5.5kg is below -2SD (6.3kg)
    const status = hitungStatusGizi(dobStr, 'L', 5.8, 67.0)
    expect(status).toBe('gizi kurang')
  })
})
