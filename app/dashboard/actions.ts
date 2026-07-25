'use server'

import { createClient } from '@/lib/supabase/server'

export interface HouseholdData {
  rumah_tangga_id: string
  no_kk: string | null
  alamat: string | null
  dekat_industri: boolean
  kondisi_rumah: string | null
  status_ekonomi: string | null
  latitude: number
  longitude: number
  total_skor: number | null
  persen: number | null
  klasifikasi: 'aman' | 'waspada' | 'bahaya' | 'kritis' | null
  nama_kepala_keluarga: string | null
  potensi_eksklusi: boolean
}

interface HouseholdRow {
  rumah_tangga_id: string
}

interface RtRow {
  id: string
}

interface TicketRow {
  id: string
  status: string
  bidang: string
  tanggal_terbit: string
  tenggat_sla: string | null
  rumah_tangga_id: string | null
}

export interface BidangStat {
  bidang: string
  count: number
}

export interface StatusStat {
  status: string
  count: number
}

export interface TrendStat {
  month: string
  count: number
}

export interface DashboardStats {
  totalWarga: number
  totalKunjungan: number
  totalTiketActive: number
  totalTiketOverdue: number
  bidangStats: BidangStat[]
  statusStats: StatusStat[]
  monthlyTrend: TrendStat[]
  rwsList: { id: string; kode: string; nama: string }[]
}

/**
 * Fetch aggregated statistics for executive dashboard with filter scoping
 */
export async function getDashboardStats(filters?: {
  rwId?: string
  periodBulan?: string // format YYYY-MM
}): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  const supabase = createClient()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  // 2. Fetch list of RWs for filter dropdowns
  const { data: rws } = await supabase
    .from('wilayah')
    .select('id, kode, nama')
    .eq('level', 'rw')
    .order('kode', { ascending: true })

  try {
    let householdIds: string[] | null = null

    // If filter rwId is provided or user role is Kader (scope restricted to their RW)
    const activeRwId = filters?.rwId

    if (activeRwId && activeRwId !== 'all') {
      const { data: hh } = await supabase
        .from('v_spatial_households')
        .select('rumah_tangga_id')
        .eq('wilayah_rw_id', activeRwId)

      if (hh) {
        householdIds = hh.map((h: HouseholdRow) => h.rumah_tangga_id)
      }
    }

    // 3. Count total warga
    let wargaQuery = supabase
      .from('warga')
      .select('*', { count: 'exact', head: true })
      .is('dihapus_pada', null)

    if (householdIds) {
      wargaQuery = wargaQuery.in('rumah_tangga_id', householdIds)
    }

    const { count: countWarga } = await wargaQuery

    // 4. Count total kunjungan
    let kunjunganQuery = supabase.from('kunjungan').select('*', { count: 'exact', head: true })
    if (activeRwId && activeRwId !== 'all') {
      // get RTs in the active RW
      const { data: rts } = await supabase.from('wilayah').select('id').eq('parent_id', activeRwId)
      if (rts) {
        kunjunganQuery = kunjunganQuery.in(
          'wilayah_id',
          rts.map((r: RtRow) => r.id)
        )
      }
    }
    const { count: countKunjungan } = await kunjunganQuery

    // 5. Query active & overdue tickets
    let ticketQuery = supabase.from('tiket').select('*')
    if (householdIds) {
      ticketQuery = ticketQuery.in('rumah_tangga_id', householdIds)
    }
    if (filters?.periodBulan) {
      const start = `${filters.periodBulan}-01`
      // Calculate end of month roughly
      const end = `${filters.periodBulan}-31`
      ticketQuery = ticketQuery.gte('tanggal_terbit', start).lte('tanggal_terbit', end)
    }

    const { data: tickets, error: errTickets } = await ticketQuery
    if (errTickets) throw errTickets

    const activeTickets = tickets
      ? tickets.filter((t: TicketRow) => t.status !== 'selesai' && t.status !== 'ditolak')
      : []

    // Check if SLA is overdue (current_date > tenggat_sla)
    const todayStr = new Date().toISOString().split('T')[0]
    const overdueTickets = activeTickets.filter(
      (t: TicketRow) => t.tenggat_sla && t.tenggat_sla < todayStr
    )

    // 6. Aggregate Bidang Stats
    const bidangMap: Record<string, number> = {
      pendidikan: 0,
      kesehatan: 0,
      pekerjaan_umum: 0,
      perumahan_rakyat: 0,
      trantibumlinmas: 0,
      sosial: 0,
    }
    tickets?.forEach((t: TicketRow) => {
      if (bidangMap[t.bidang] !== undefined) {
        bidangMap[t.bidang]++
      }
    })
    const bidangStats: BidangStat[] = Object.keys(bidangMap).map((key) => ({
      bidang: key,
      count: bidangMap[key],
    }))

    // 7. Aggregate Status Stats
    const statusMap: Record<string, number> = {
      didata: 0,
      verifikasi_kunjungan: 0,
      diajukan_pemdes: 0,
      disposisi_opd: 0,
      selesai: 0,
      ditolak: 0,
    }
    tickets?.forEach((t: TicketRow) => {
      if (statusMap[t.status] !== undefined) {
        statusMap[t.status]++
      }
    })
    const statusStats: StatusStat[] = Object.keys(statusMap).map((key) => ({
      status: key,
      count: statusMap[key],
    }))

    // 8. Aggregate Monthly Trend
    const trendMap: Record<string, number> = {}
    tickets?.forEach((t: TicketRow) => {
      const month = t.tanggal_terbit ? t.tanggal_terbit.substring(0, 7) : 'Unknown'
      trendMap[month] = (trendMap[month] || 0) + 1
    })
    const monthlyTrend: TrendStat[] = Object.keys(trendMap)
      .sort()
      .map((key) => ({
        month: key,
        count: trendMap[key],
      }))

    return {
      success: true,
      data: {
        totalWarga: countWarga || 0,
        totalKunjungan: countKunjungan || 0,
        totalTiketActive: activeTickets.length,
        totalTiketOverdue: overdueTickets.length,
        bidangStats,
        statusStats,
        monthlyTrend,
        rwsList: rws || [],
      },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    return { success: false, error: msg }
  }
}

/**
 * Fetch spatial coordinate records of households for react-leaflet mapping
 */
export async function getSpatialHouseholds(): Promise<{
  success: boolean
  households: HouseholdData[]
  error?: string
}> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('v_spatial_households')
      .select('*')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (error) throw error
    return { success: true, households: (data || []) as unknown as HouseholdData[] }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Gagal memuat data spasial'
    return { success: false, error: msg, households: [] }
  }
}

/**
 * Fetch priority list of households sorted by vulnerability score
 */
export async function getPriorityVisits(
  limit: number = 50
): Promise<{ success: boolean; list: HouseholdData[]; error?: string }> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('v_spatial_households')
      .select('*')
      .not('persen', 'is', null)
      .order('persen', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { success: true, list: (data || []) as unknown as HouseholdData[] }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Gagal memuat daftar prioritas'
    return { success: false, error: msg, list: [] }
  }
}

/**
 * Fetch households that have high risk and no active social benefits (potensi_eksklusi)
 */
export async function getExclusionPotentialList(): Promise<{
  success: boolean
  list: HouseholdData[]
  error?: string
}> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('v_spatial_households')
      .select('*')
      .eq('potensi_eksklusi', true)
      .order('persen', { ascending: false })

    if (error) throw error
    return { success: true, list: (data || []) as unknown as HouseholdData[] }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Gagal memuat data potensi eksklusi'
    return { success: false, error: msg, list: [] }
  }
}
