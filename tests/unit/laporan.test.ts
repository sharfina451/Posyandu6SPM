import { describe, it, expect } from 'vitest'

// Offline mirror of aggregation mapping logic for verification
function aggregateTicketsByRw(tickets: any[], rws: any[], periode: string, bidang?: string) {
  const start = `${periode}-01`
  const end = `${periode}-31`
  const todayStr = '2026-07-25'

  // Filter within date range and bidang
  const filteredTickets = tickets.filter((t) => {
    const isWithinDate = t.tanggal_terbit >= start && t.tanggal_terbit <= end
    const isMatchingBidang = !bidang || bidang === 'all' || t.bidang === bidang
    return isWithinDate && isMatchingBidang
  })

  return rws.map((rw) => {
    // Map tickets based on mock household RT -> RW mapping
    const rwTickets = filteredTickets.filter((t) => {
      const rtId = t.warga?.rumah_tangga?.wilayah_rt_id
      return rtId === rw.id || rw.childRtIds?.includes(rtId)
    })

    const tiketBaru = rwTickets.length
    const tiketSelesai = rwTickets.filter((t) => t.status === 'selesai').length
    const tiketProses = rwTickets.filter((t) =>
      ['verifikasi_kunjungan', 'diajukan_pemdes', 'disposisi_opd'].includes(t.status)
    ).length
    const tiketTerlambat = rwTickets.filter(
      (t) =>
        t.status !== 'selesai' &&
        t.status !== 'ditolak' &&
        t.tenggat_sla &&
        t.tenggat_sla < todayStr
    ).length

    const uniqueWargas = new Set(rwTickets.map((t) => t.warga_id))

    return {
      rwId: rw.id,
      rwKode: rw.kode,
      rwNama: rw.nama || `RW ${rw.kode}`,
      tiketBaru,
      tiketSelesai,
      tiketProses,
      tiketTerlambat,
      wargaTerlayani: uniqueWargas.size,
    }
  })
}

describe('Monthly Report Aggegations (6 SPM)', () => {
  const mockRws = [
    { id: 'rw1', kode: '01', nama: 'RW Satu', childRtIds: ['rt11', 'rt12'] },
    { id: 'rw2', kode: '02', nama: 'RW Dua', childRtIds: ['rt21'] },
  ]

  const mockTickets = [
    {
      id: 't1',
      tanggal_terbit: '2026-07-05',
      bidang: 'kesehatan',
      status: 'selesai',
      warga_id: 'w1',
      tenggat_sla: '2026-07-10',
      warga: { rumah_tangga: { wilayah_rt_id: 'rt11' } },
    },
    {
      id: 't2',
      tanggal_terbit: '2026-07-12',
      bidang: 'kesehatan',
      status: 'diajukan_pemdes',
      warga_id: 'w2',
      tenggat_sla: '2026-07-17',
      warga: { rumah_tangga: { wilayah_rt_id: 'rt12' } },
    },
    {
      id: 't3',
      tanggal_terbit: '2026-07-20',
      bidang: 'pendidikan',
      status: 'diajukan_pemdes',
      warga_id: 'w3',
      tenggat_sla: '2026-07-28', // not overdue on 2026-07-25
      warga: { rumah_tangga: { wilayah_rt_id: 'rt21' } },
    },
    {
      id: 't4',
      tanggal_terbit: '2026-06-15', // outside period
      bidang: 'kesehatan',
      status: 'diajukan_pemdes',
      warga_id: 'w1',
      tenggat_sla: '2026-06-20',
      warga: { rumah_tangga: { wilayah_rt_id: 'rt11' } },
    },
  ]

  it('aggregates stats correctly for a specific month and all fields', () => {
    const stats = aggregateTicketsByRw(mockTickets, mockRws, '2026-07', 'all')

    expect(stats).toHaveLength(2)

    // RW 1 check: t1 and t2 are in RW 1
    const rw1 = stats.find((s) => s.rwKode === '01')
    expect(rw1).toBeDefined()
    expect(rw1?.tiketBaru).toBe(2)
    expect(rw1?.tiketSelesai).toBe(1)
    expect(rw1?.tiketProses).toBe(1)
    expect(rw1?.tiketTerlambat).toBe(1) // t2 is overdue on 2026-07-25 (deadline 17th)
    expect(rw1?.wargaTerlayani).toBe(2)

    // RW 2 check: t3 is in RW 2
    const rw2 = stats.find((s) => s.rwKode === '02')
    expect(rw2).toBeDefined()
    expect(rw2?.tiketBaru).toBe(1)
    expect(rw2?.tiketSelesai).toBe(0)
    expect(rw2?.tiketProses).toBe(1)
    expect(rw2?.tiketTerlambat).toBe(0) // t3 deadline is 28th (not overdue on 25th)
    expect(rw2?.wargaTerlayani).toBe(1)
  })

  it('filters by specific SPM fields correctly', () => {
    const stats = aggregateTicketsByRw(mockTickets, mockRws, '2026-07', 'kesehatan')

    // t3 (pendidikan) should be filtered out
    const rw2 = stats.find((s) => s.rwKode === '02')
    expect(rw2?.tiketBaru).toBe(0)

    const rw1 = stats.find((s) => s.rwKode === '01')
    expect(rw1?.tiketBaru).toBe(2) // t1 and t2 are kesehatan
  })

  it('ignores records outside date ranges', () => {
    const stats = aggregateTicketsByRw(mockTickets, mockRws, '2026-07', 'all')
    const totalNew = stats.reduce((sum, item) => sum + item.tiketBaru, 0)
    expect(totalNew).toBe(3) // t4 from June is ignored
  })
})
