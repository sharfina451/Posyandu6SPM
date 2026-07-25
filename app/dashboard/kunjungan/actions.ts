'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getKunjungans() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('kunjungan')
    .select('*, wilayah:wilayah_id(id, kode, level)')
    .order('tanggal', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function createKunjungan(formData: {
  nama: string
  tanggal: string
  jenis: 'posyandu' | 'kunjungan_rumah'
  keterangan?: string
}) {
  const supabase = createClient()

  // 1. Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  const wilayahId = user.app_metadata?.wilayah_id
  if (!wilayahId) {
    return {
      success: false,
      error: 'Akun Anda belum dikaitkan dengan wilayah kerja (RW). Hubungi Admin LKD.',
    }
  }

  if (!formData.nama || !formData.tanggal || !formData.jenis) {
    return { success: false, error: 'Nama, tanggal, dan jenis kunjungan wajib diisi.' }
  }

  try {
    const { data: newKunjungan, error: errKunjungan } = await supabase
      .from('kunjungan')
      .insert([
        {
          nama: formData.nama,
          tanggal: formData.tanggal,
          jenis: formData.jenis,
          keterangan: formData.keterangan || null,
          wilayah_id: wilayahId,
        },
      ])
      .select()
      .single()

    if (errKunjungan) throw errKunjungan

    // Record Audit Log
    await supabase.from('audit_log').insert([
      {
        pengguna_id: user.id,
        tindakan: 'CREATE',
        tabel_nama: 'kunjungan',
        record_id: newKunjungan.id,
        detail: {
          nama: formData.nama,
          tanggal: formData.tanggal,
        },
      },
    ])

    revalidatePath('/dashboard/kunjungan')
    return { success: true, data: newKunjungan }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    return { success: false, error: message }
  }
}

export async function updateKunjungan(
  id: string,
  formData: {
    nama: string
    tanggal: string
    jenis: 'posyandu' | 'kunjungan_rumah'
    keterangan?: string
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
    const { data: oldKunjungan } = await supabase
      .from('kunjungan')
      .select('*')
      .eq('id', id)
      .single()

    const { data: updated, error: errUpdate } = await supabase
      .from('kunjungan')
      .update({
        nama: formData.nama,
        tanggal: formData.tanggal,
        jenis: formData.jenis,
        keterangan: formData.keterangan || null,
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
        tabel_nama: 'kunjungan',
        record_id: id,
        detail: {
          sebelum: oldKunjungan,
          sesudah: updated,
        },
      },
    ])

    revalidatePath('/dashboard/kunjungan')
    return { success: true, data: updated }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    return { success: false, error: message }
  }
}

export async function deleteKunjungan(id: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  try {
    const { data: oldKunjungan } = await supabase
      .from('kunjungan')
      .select('*')
      .eq('id', id)
      .single()

    const { error: errDelete } = await supabase.from('kunjungan').delete().eq('id', id)

    if (errDelete) throw errDelete

    // Record Audit Log
    await supabase.from('audit_log').insert([
      {
        pengguna_id: user.id,
        tindakan: 'DELETE',
        tabel_nama: 'kunjungan',
        record_id: id,
        detail: oldKunjungan,
      },
    ])

    revalidatePath('/dashboard/kunjungan')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    return { success: false, error: message }
  }
}
