'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createLayananSpm(formData: {
  warga_id: string
  kunjungan_id?: string
  tanggal_layanan: string
  bidang:
    | 'kesehatan'
    | 'pendidikan'
    | 'pekerjaan_umum'
    | 'perumahan_rakyat'
    | 'trantibumlinmas'
    | 'sosial'
  jenis_layanan: string
  detail: Record<string, string | number | boolean>
}) {
  const supabase = createClient()

  // 1. Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  try {
    const { data: newLayanan, error: errLayanan } = await supabase
      .from('layanan_spm')
      .insert([
        {
          warga_id: formData.warga_id,
          kader_id: user.id,
          kunjungan_id: formData.kunjungan_id || null,
          tanggal_layanan: formData.tanggal_layanan,
          bidang: formData.bidang,
          jenis_layanan: formData.jenis_layanan,
          detail: formData.detail,
        },
      ])
      .select()
      .single()

    if (errLayanan) throw errLayanan

    // Record Audit Log
    await supabase.from('audit_log').insert([
      {
        pengguna_id: user.id,
        tindakan: 'CREATE',
        tabel_nama: 'layanan_spm',
        record_id: newLayanan.id,
        detail: {
          warga_id: formData.warga_id,
          bidang: formData.bidang,
          jenis_layanan: formData.jenis_layanan,
        },
      },
    ])

    revalidatePath(`/dashboard/warga/${formData.warga_id}`)
    return { success: true, data: newLayanan }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    return { success: false, error: message }
  }
}

export async function updateLayananSpm(
  id: string,
  formData: {
    kunjungan_id?: string
    tanggal_layanan: string
    jenis_layanan: string
    detail: Record<string, string | number | boolean>
  }
) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  try {
    const { data: oldLayanan } = await supabase
      .from('layanan_spm')
      .select('*')
      .eq('id', id)
      .single()

    const { data: updated, error: errUpdate } = await supabase
      .from('layanan_spm')
      .update({
        kunjungan_id: formData.kunjungan_id || null,
        tanggal_layanan: formData.tanggal_layanan,
        jenis_layanan: formData.jenis_layanan,
        detail: formData.detail,
        diperbarui_pada: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (errUpdate) throw errUpdate

    // Record Audit Log
    await supabase.from('audit_log').insert([
      {
        pengguna_id: user.id,
        tindakan: 'UPDATE',
        tabel_nama: 'layanan_spm',
        record_id: id,
        detail: {
          sebelum: oldLayanan,
          sesudah: updated,
        },
      },
    ])

    revalidatePath(`/dashboard/warga/${updated.warga_id}`)
    return { success: true, data: updated }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    return { success: false, error: message }
  }
}

export async function deleteLayananSpm(id: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  try {
    const { data: oldLayanan } = await supabase
      .from('layanan_spm')
      .select('*')
      .eq('id', id)
      .single()

    const { error: errDelete } = await supabase.from('layanan_spm').delete().eq('id', id)

    if (errDelete) throw errDelete

    // Record Audit Log
    await supabase.from('audit_log').insert([
      {
        pengguna_id: user.id,
        tindakan: 'DELETE',
        tabel_nama: 'layanan_spm',
        record_id: id,
        detail: oldLayanan,
      },
    ])

    revalidatePath(`/dashboard/warga/${oldLayanan.warga_id}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    return { success: false, error: message }
  }
}

export async function getLayananSpmById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('layanan_spm')
    .select('*, warga:warga_id(id, nama, nik)')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function getLayananSpms(filters?: { query?: string; bidang?: string }) {
  const supabase = createClient()

  try {
    let query = supabase
      .from('layanan_spm')
      .select('*, warga:warga_id(id, nama, nik), kader:kader_id(nama)')

    if (filters?.bidang && filters.bidang !== 'all') {
      query = query.eq('bidang', filters.bidang)
    }

    const { data, error } = await query.order('tanggal_layanan', { ascending: false })

    if (error) throw error

    let filteredData = data || []
    if (filters?.query) {
      const q = filters.query.toLowerCase()
      filteredData = filteredData.filter(
        (item: { warga?: { nama?: string | null; nik?: string | null } | null }) =>
          item.warga?.nama?.toLowerCase().includes(q) || item.warga?.nik?.includes(q)
      )
    }

    return { success: true, data: filteredData }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    return { success: false, error: message }
  }
}
