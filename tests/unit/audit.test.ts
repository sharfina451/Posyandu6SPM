import { describe, it, expect } from 'vitest'

// Offline unit helper: diff calculator between old and new json states
function computeJsonDiff(oldObj: Record<string, any> | null, newObj: Record<string, any> | null) {
  const changes: Record<string, { dari: any; ke: any }> = {}

  if (!oldObj && newObj) {
    // Insert: all keys in new are additions
    Object.keys(newObj).forEach((k) => {
      changes[k] = { dari: null, ke: newObj[k] }
    })
    return changes
  }

  if (oldObj && !newObj) {
    // Delete: all keys in old are removals
    Object.keys(oldObj).forEach((k) => {
      changes[k] = { dari: oldObj[k], ke: null }
    })
    return changes
  }

  if (oldObj && newObj) {
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])
    allKeys.forEach((k) => {
      if (JSON.stringify(oldObj[k]) !== JSON.stringify(newObj[k])) {
        changes[k] = { dari: oldObj[k], ke: newObj[k] }
      }
    })
  }

  return changes
}

describe('Audit JSON Diff Calculator', () => {
  it('identifies changed keys correctly during updates', () => {
    const oldWarga = { nama: 'Budi Santoso', disabilitas: false, no_hp: '0812' }
    const newWarga = { nama: 'Budi Santoso', disabilitas: true, no_hp: '0813' }

    const diff = computeJsonDiff(oldWarga, newWarga)

    expect(Object.keys(diff)).toHaveLength(2)
    expect(diff.disabilitas).toEqual({ dari: false, ke: true })
    expect(diff.no_hp).toEqual({ dari: '0812', ke: '0813' })
    expect(diff.nama).toBeUndefined() // nama didn't change
  })

  it('handles insert (null old data) as additions', () => {
    const newWarga = { nama: 'Siti Aminah', disabilitas: false }
    const diff = computeJsonDiff(null, newWarga)

    expect(Object.keys(diff)).toHaveLength(2)
    expect(diff.nama).toEqual({ dari: null, ke: 'Siti Aminah' })
    expect(diff.disabilitas).toEqual({ dari: null, ke: false })
  })

  it('handles delete (null new data) as removals', () => {
    const oldWarga = { nama: 'Joko Widodo', nik: '337401' }
    const diff = computeJsonDiff(oldWarga, null)

    expect(Object.keys(diff)).toHaveLength(2)
    expect(diff.nama).toEqual({ dari: 'Joko Widodo', ke: null })
    expect(diff.nik).toEqual({ dari: '337401', ke: null })
  })
})
