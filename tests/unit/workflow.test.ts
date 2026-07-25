import { describe, it, expect } from 'vitest'
import { validateWorkflowTransition } from '../../lib/utils/workflow'

describe('validateWorkflowTransition state machine', () => {
  it('allows valid transitions for authorized roles', () => {
    // didata -> verifikasi_kunjungan by kader
    const res1 = validateWorkflowTransition('didata', 'verifikasi_kunjungan', 'kader')
    expect(res1.success).toBe(true)

    // verifikasi_kunjungan -> diajukan_pemdes by bidan
    const res2 = validateWorkflowTransition('verifikasi_kunjungan', 'diajukan_pemdes', 'bidan')
    expect(res2.success).toBe(true)

    // diajukan_pemdes -> disposisi_opd by pemdes (with OPD destination)
    const res3 = validateWorkflowTransition(
      'diajukan_pemdes',
      'disposisi_opd',
      'pemdes',
      'Dinas Kesehatan'
    )
    expect(res3.success).toBe(true)

    // disposisi_opd -> selesai by opd
    const res4 = validateWorkflowTransition('disposisi_opd', 'selesai', 'opd')
    expect(res4.success).toBe(true)
  })

  it('blocks transitions from terminal states', () => {
    // selesai -> didata by admin
    const res1 = validateWorkflowTransition('selesai', 'didata', 'admin')
    expect(res1.success).toBe(false)
    expect(res1.error).toContain('tidak dapat diubah lagi')

    // ditolak -> verifikasi_kunjungan by pemdes
    const res2 = validateWorkflowTransition('ditolak', 'verifikasi_kunjungan', 'pemdes')
    expect(res2.success).toBe(false)
  })

  it('blocks invalid transition paths', () => {
    // didata -> disposisi_opd directly (skipping verifikasi/pengajuan)
    const res1 = validateWorkflowTransition('didata', 'disposisi_opd', 'pemdes', 'Dinas PU')
    expect(res1.success).toBe(false)
    expect(res1.error).toContain('tidak valid')
  })

  it('blocks unauthorized roles from executing transitions', () => {
    // diajukan_pemdes -> disposisi_opd by kader (only pemdes/admin allowed)
    const res1 = validateWorkflowTransition(
      'diajukan_pemdes',
      'disposisi_opd',
      'kader',
      'Dinas Sosial'
    )
    expect(res1.success).toBe(false)
    expect(res1.error).toContain('Hanya Pemerintah Desa')

    // disposisi_opd -> selesai by kader (only opd/pemdes/admin allowed)
    const res2 = validateWorkflowTransition('disposisi_opd', 'selesai', 'kader')
    expect(res2.success).toBe(false)
    expect(res2.error).toContain('Hanya OPD atau Pemdes')
  })

  it('requires OPD destination when transitioning to disposisi_opd', () => {
    const res = validateWorkflowTransition('diajukan_pemdes', 'disposisi_opd', 'pemdes', '')
    expect(res.success).toBe(false)
    expect(res.error).toContain('OPD Tujuan wajib diisi')
  })
})
