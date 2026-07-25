'use server'

import { createClient } from '@/lib/supabase/server'

export interface AuditLogItem {
  id: string
  pengguna_id: string | null
  aksi: 'create' | 'update' | 'delete' | 'export' | 'login' | 'sync'
  tabel: string | null
  record_id: string | null
  data_lama: Record<string, unknown> | null
  data_baru: Record<string, unknown> | null
  ip: string | null
  pada: string
  operator_name?: string
}

export async function getAuditLogs(filters?: {
  aksi?: string
  tabel?: string
  startDate?: string
  endDate?: string
}): Promise<{ success: boolean; logs?: AuditLogItem[]; error?: string }> {
  const supabase = createClient()

  // 1. Authenticate user and verify role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  const role = (user.app_metadata?.role as string) || 'kader'
  if (role !== 'admin' && role !== 'pemdes') {
    return {
      success: false,
      error: 'Akses ditolak. Anda tidak memiliki izin untuk melihat log audit.',
    }
  }

  try {
    // 2. Query audit logs
    let query = supabase.from('audit_log').select('*')

    if (filters?.aksi && filters.aksi !== 'all') {
      query = query.eq('aksi', filters.aksi)
    }
    if (filters?.tabel && filters.tabel !== 'all') {
      query = query.eq('tabel', filters.tabel)
    }
    if (filters?.startDate) {
      query = query.gte('pada', `${filters.startDate}T00:00:00Z`)
    }
    if (filters?.endDate) {
      query = query.lte('pada', `${filters.endDate}T23:59:59Z`)
    }

    const { data: logs, error: errLogs } = await query
      .order('pada', { ascending: false })
      .limit(100)

    if (errLogs) throw errLogs

    const formattedLogs: AuditLogItem[] = []

    for (const log of logs || []) {
      let operatorName = 'Sistem / Anonim'
      if (log.pengguna_id) {
        const { data: userProfile } = await supabase
          .from('pengguna')
          .select('nama')
          .eq('id', log.pengguna_id)
          .single()
        if (userProfile) operatorName = userProfile.nama
      }

      formattedLogs.push({
        id: log.id,
        pengguna_id: log.pengguna_id,
        aksi: log.aksi,
        tabel: log.tabel,
        record_id: log.record_id,
        data_lama: log.data_lama,
        data_baru: log.data_baru,
        ip: log.ip,
        pada: log.pada,
        operator_name: operatorName,
      })
    }

    return { success: true, logs: formattedLogs }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal memuat log audit.',
    }
  }
}
