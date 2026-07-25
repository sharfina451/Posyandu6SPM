'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'admin') {
    throw new Error('Unauthorized: Hanya Admin Sistem yang dapat mengakses fungsi ini.')
  }
}

export async function getPosyandus() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posyandu')
    .select('*')
    .order('dibuat_pada', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function createPosyandu(formData: {
  nama: string
  nomor_registrasi?: string
  desa: string
  kecamatan: string
  kabupaten: string
  no_sk_pengurus?: string
  tanggal_terdaftar?: string
}) {
  await checkAdmin()
  const supabase = createClient()

  const { data, error } = await supabase
    .from('posyandu')
    .insert([
      {
        nama: formData.nama,
        nomor_registrasi: formData.nomor_registrasi || null,
        desa: formData.desa,
        kecamatan: formData.kecamatan,
        kabupaten: formData.kabupaten,
        no_sk_pengurus: formData.no_sk_pengurus || null,
        tanggal_terdaftar: formData.tanggal_terdaftar || null,
        status_registrasi: 'draf',
      },
    ])
    .select()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/admin/posyandu')
  return { success: true, data }
}

export async function updatePosyandu(
  id: string,
  formData: {
    nama: string
    nomor_registrasi?: string
    desa: string
    kecamatan: string
    kabupaten: string
    no_sk_pengurus?: string
    tanggal_terdaftar?: string
    status_registrasi?: 'draf' | 'diajukan' | 'terdaftar' | 'dikembalikan'
  }
) {
  await checkAdmin()
  const supabase = createClient()

  const { data, error } = await supabase
    .from('posyandu')
    .update({
      nama: formData.nama,
      nomor_registrasi: formData.nomor_registrasi || null,
      desa: formData.desa,
      kecamatan: formData.kecamatan,
      kabupaten: formData.kabupaten,
      no_sk_pengurus: formData.no_sk_pengurus || null,
      tanggal_terdaftar: formData.tanggal_terdaftar || null,
      status_registrasi: formData.status_registrasi || 'draf',
    })
    .eq('id', id)
    .select()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/admin/posyandu')
  return { success: true, data }
}

export async function deletePosyandu(id: string) {
  await checkAdmin()
  const supabase = createClient()

  const { error } = await supabase.from('posyandu').delete().eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/admin/posyandu')
  return { success: true }
}
