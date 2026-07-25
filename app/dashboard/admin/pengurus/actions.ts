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

export async function getPengurus() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pengurus_posyandu')
    .select('*, posyandu:posyandu_id(id, nama), pengguna:pengguna_id(id, nama, username)')
    .order('dibuat_pada', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function createPengurus(formData: {
  posyandu_id: string
  pengguna_id?: string
  nama: string
  jabatan: string
  no_sk?: string
  aktif: boolean
}) {
  await checkAdmin()
  const supabase = createClient()

  const { data, error } = await supabase
    .from('pengurus_posyandu')
    .insert([
      {
        posyandu_id: formData.posyandu_id,
        pengguna_id: formData.pengguna_id || null,
        nama: formData.nama,
        jabatan: formData.jabatan,
        no_sk: formData.no_sk || null,
        aktif: formData.aktif,
      },
    ])
    .select()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/admin/pengurus')
  return { success: true, data }
}

export async function updatePengurus(
  id: string,
  formData: {
    posyandu_id: string
    pengguna_id?: string
    nama: string
    jabatan: string
    no_sk?: string
    aktif: boolean
  }
) {
  await checkAdmin()
  const supabase = createClient()

  const { data, error } = await supabase
    .from('pengurus_posyandu')
    .update({
      posyandu_id: formData.posyandu_id,
      pengguna_id: formData.pengguna_id || null,
      nama: formData.nama,
      jabatan: formData.jabatan,
      no_sk: formData.no_sk || null,
      aktif: formData.aktif,
    })
    .eq('id', id)
    .select()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/admin/pengurus')
  return { success: true, data }
}

export async function deletePengurus(id: string) {
  await checkAdmin()
  const supabase = createClient()

  const { error } = await supabase.from('pengurus_posyandu').delete().eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/admin/pengurus')
  return { success: true }
}

export async function getUsersList() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pengguna')
    .select('id, nama, username')
    .eq('aktif', true)

  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true, data }
}
