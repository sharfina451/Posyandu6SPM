'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ConsentHistoryItem {
  id: string
  warga_id: string
  tujuan: string
  disetujui: boolean
  metode: string | null
  tanggal: string
  dicatat_oleh: string | null
  operator_name?: string
}

/**
 * Fetch consent history for a specific warga
 */
export async function getConsentHistory(wargaId: string): Promise<{
  success: boolean
  list?: ConsentHistoryItem[]
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data: logs, error: errLogs } = await supabase
      .from('consent_pdp')
      .select('*')
      .eq('warga_id', wargaId)
      .order('tanggal', { ascending: false })

    if (errLogs) throw errLogs

    const list: ConsentHistoryItem[] = []
    for (const log of logs || []) {
      let operatorName = 'Kader Posyandu'
      if (log.dicatat_oleh) {
        const { data: userProfile } = await supabase
          .from('pengguna')
          .select('nama')
          .eq('id', log.dicatat_oleh)
          .single()
        if (userProfile) operatorName = userProfile.nama
      }

      list.push({
        id: log.id,
        warga_id: log.warga_id,
        tujuan: log.tujuan,
        disetujui: log.disetujui,
        metode: log.metode,
        tanggal: log.tanggal,
        dicatat_oleh: log.dicatat_oleh,
        operator_name: operatorName,
      })
    }

    return { success: true, list }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal memuat riwayat persetujuan.',
    }
  }
}

/**
 * Record a new consent declaration
 */
export async function saveConsentAction(
  wargaId: string,
  tujuan: string,
  disetujui: boolean,
  metode: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  try {
    // 2. Insert new consent row
    const { error: errIns } = await supabase.from('consent_pdp').insert({
      warga_id: wargaId,
      tujuan,
      disetujui,
      metode,
      dicatat_oleh: user.id,
    })

    if (errIns) throw errIns

    revalidatePath(`/dashboard/warga/${wargaId}`)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menyimpan persetujuan data.',
    }
  }
}
