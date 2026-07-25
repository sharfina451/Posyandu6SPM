import { describe, it, expect } from 'vitest'
import { calculateSlaDate } from '../../lib/utils/sla'

describe('calculateSlaDate utility', () => {
  it('calculates SLA without weekends or holidays correctly (Monday to next Monday)', () => {
    // 2026-07-20 is a Monday. 5 working days should end on 2026-07-27 (Monday).
    const start = '2026-07-20'
    const result = calculateSlaDate(start, 5, [])
    expect(result).toBe('2026-07-27')
  })

  it('skips weekends correctly (Wednesday to next Wednesday)', () => {
    // 2026-07-22 is a Wednesday. 5 working days should skip Saturday (25th) and Sunday (26th) and end on 2026-07-29 (Wednesday).
    const start = '2026-07-22'
    const result = calculateSlaDate(start, 5, [])
    expect(result).toBe('2026-07-29')
  })

  it('skips national holidays correctly', () => {
    // 2026-08-14 is a Friday.
    // 2026-08-17 is a Monday (Hari Kemerdekaan - Holiday).
    // 5 working days should skip 15th (Sat), 16th (Sun), and 17th (Holiday Mon)
    // Days added:
    // Day 1: 18th (Tue)
    // Day 2: 19th (Wed)
    // Day 3: 20th (Thu)
    // Day 4: 21st (Fri)
    // Day 5: 24th (Mon - skipping 22nd/23rd weekend)
    // Result should be 2026-08-24.
    const start = '2026-08-14'
    const holidays = ['2026-08-17']
    const result = calculateSlaDate(start, 5, holidays)
    expect(result).toBe('2026-08-24')
  })
})
