'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { hitungStatusGizi } from '@/lib/utils/status-gizi'

export async function getPemeriksaans() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pemeriksaan_kesehatan')
    .select('*, warga:warga_id(id, nama, nik, tanggal_lahir, jenis_kelamin)')
    .order('tanggal', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function createPemeriksaan(formData: {
  warga_id: string
  tanggal: string
  berat_kg?: number | null
  tinggi_cm?: number | null
  lingkar_kepala_cm?: number | null
  lila_cm?: number | null
  tekanan_sistolik?: number | null
  tekanan_diastolik?: number | null
  gula_darah?: number | null
  keluhan_ispa: boolean
  paparan_polutan: boolean
  catatan?: string
}) {
  const supabase = createClient()

  // 1. Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  // 2. Fetch warga to get gender and date of birth for status gizi calculation
  const { data: warga, error: errWarga } = await supabase
    .from('warga')
    .select('id, nama, tanggal_lahir, jenis_kelamin')
    .eq('id', formData.warga_id)
    .single()

  if (errWarga || !warga) {
    return { success: false, error: 'Warga tidak ditemukan.' }
  }

  // 3. Auto calculate status gizi if balita and height/weight are present
  let statusGizi = null
  if (formData.berat_kg && formData.tinggi_cm) {
    statusGizi = hitungStatusGizi(
      warga.tanggal_lahir,
      warga.jenis_kelamin as 'L' | 'P',
      formData.berat_kg,
      formData.tinggi_cm
    )
  }

  try {
    const { data: newPeriksa, error: errPeriksa } = await supabase
      .from('pemeriksaan_kesehatan')
      .insert([
        {
          warga_id: formData.warga_id,
          tanggal: formData.tanggal,
          berat_kg: formData.berat_kg || null,
          tinggi_cm: formData.tinggi_cm || null,
          lingkar_kepala_cm: formData.lingkar_kepala_cm || null,
          lila_cm: formData.lila_cm || null,
          tekanan_sistolik: formData.tekanan_sistolik || null,
          tekanan_diastolik: formData.tekanan_diastolik || null,
          gula_darah: formData.gula_darah || null,
          status_gizi: statusGizi,
          keluhan_ispa: formData.keluhan_ispa,
          paparan_polutan: formData.paparan_polutan,
          catatan: formData.catatan || null,
        },
      ])
      .select()
      .single()

    if (errPeriksa) throw errPeriksa

    // Record Audit Log
    await supabase.from('audit_log').insert([
      {
        pengguna_id: user.id,
        tindakan: 'CREATE',
        tabel_nama: 'pemeriksaan_kesehatan',
        record_id: newPeriksa.id,
        detail: {
          warga_id: formData.warga_id,
          status_gizi: statusGizi,
          keluhan_ispa: formData.keluhan_ispa,
        },
      },
    ])

    revalidatePath('/dashboard/kesehatan')
    revalidatePath(`/dashboard/warga/${formData.warga_id}`)
    return { success: true, data: newPeriksa }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    return { success: false, error: message }
  }
}

export async function deletePemeriksaan(id: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  try {
    const { data: oldPeriksa } = await supabase
      .from('pemeriksaan_kesehatan')
      .select('*')
      .eq('id', id)
      .single()

    const { error: errDelete } = await supabase.from('pemeriksaan_kesehatan').delete().eq('id', id)

    if (errDelete) throw errDelete

    // Record Audit Log
    await supabase.from('audit_log').insert([
      {
        pengguna_id: user.id,
        tindakan: 'DELETE',
        tabel_nama: 'pemeriksaan_kesehatan',
        record_id: id,
        detail: oldPeriksa,
      },
    ])

    revalidatePath('/dashboard/kesehatan')
    if (oldPeriksa) {
      revalidatePath(`/dashboard/warga/${oldPeriksa.warga_id}`)
    }
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    return { success: false, error: message }
  }
}

export async function getHighRiskPemeriksaans() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pemeriksaan_kesehatan')
    .select(
      '*, warga:warga_id(id, nama, nik, tanggal_lahir, jenis_kelamin, rumah_tangga(id, alamat, dekat_industri))'
    )
    .order('tanggal', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  // Filter high risk cases in memory
  const highRisk = (data || []).filter((p) => {
    const isStunting = p.status_gizi?.toLowerCase().includes('stunting')
    const isGiziKurang =
      p.status_gizi?.toLowerCase().includes('kurang') ||
      p.status_gizi?.toLowerCase().includes('buruk')
    const isHipertensi = p.tekanan_sistolik && p.tekanan_sistolik > 140
    const isHiperglikemia = p.gula_darah && p.gula_darah > 200
    const hasIspa = p.keluhan_ispa
    const hasPolusi = p.paparan_polutan

    return isStunting || isGiziKurang || isHipertensi || isHiperglikemia || hasIspa || hasPolusi
  })

  return { success: true, data: highRisk }
}

export async function createRujukanTiket(formData: {
  warga_id: string
  bidang:
    | 'kesehatan'
    | 'pendidikan'
    | 'pekerjaan_umum'
    | 'perumahan_rakyat'
    | 'trantibumlinmas'
    | 'sosial'
  jenis_permohonan: string
  deskripsi: string
  prioritas: 'rendah' | 'sedang' | 'tinggi'
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  try {
    interface WargaTicketInfo {
      id: string
      rumah_tangga: {
        id: string
        wilayah_rt_id: string | null
      } | null
    }

    // 1. Fetch warga to get their household info
    const { data: warga } = await supabase
      .from('warga')
      .select('id, rumah_tangga(id, wilayah_rt_id)')
      .eq('id', formData.warga_id)
      .single()

    const wargaInfo = warga as unknown as WargaTicketInfo

    const { data: newTicket, error: errTicket } = await supabase
      .from('tiket')
      .insert([
        {
          warga_id: formData.warga_id,
          rumah_tangga_id: wargaInfo?.rumah_tangga?.id || null,
          bidang: formData.bidang,
          jenis_permohonan: formData.jenis_permohonan,
          deskripsi: formData.deskripsi,
          status: 'didata',
          prioritas: formData.prioritas,
          kader_id: user.id, // Maps to the creator of the ticket
        },
      ])
      .select()
      .single()

    if (errTicket) throw errTicket

    // Record Audit Log
    await supabase.from('audit_log').insert([
      {
        pengguna_id: user.id,
        aksi: 'create', // Corrected action code to match enum
        tabel: 'tiket',
        record_id: newTicket.id,
        data_baru: {
          nomor_tiket: newTicket.nomor_tiket,
          warga_id: formData.warga_id,
        },
      },
    ])

    revalidatePath('/dashboard/kesehatan')
    return { success: true, data: newTicket }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    return { success: false, error: message }
  }
}
