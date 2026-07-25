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

export async function getWilayahs() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wilayah')
    .select('*, parent:parent_id(id, kode, level), posyandu:posyandu_id(id, nama)')
    .order('level', { ascending: true })
    .order('kode', { ascending: true })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function createWilayah(formData: {
  posyandu_id: string
  parent_id?: string
  level: 'rw' | 'rt'
  kode: string
  nama?: string
}) {
  await checkAdmin()
  const supabase = createClient()

  // Validasi level dan parent
  if (formData.level === 'rt' && !formData.parent_id) {
    return { success: false, error: 'RT harus memiliki RW induk (parent).' }
  }

  const { data, error } = await supabase
    .from('wilayah')
    .insert([
      {
        posyandu_id: formData.posyandu_id,
        parent_id: formData.level === 'rw' ? null : formData.parent_id,
        level: formData.level,
        kode: formData.kode,
        nama: formData.nama || null,
      },
    ])
    .select()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Kode wilayah tersebut sudah terdaftar (duplikat)!' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/admin/wilayah')
  return { success: true, data }
}

export async function updateWilayah(
  id: string,
  formData: {
    posyandu_id: string
    parent_id?: string
    level: 'rw' | 'rt'
    kode: string
    nama?: string
  }
) {
  await checkAdmin()
  const supabase = createClient()

  if (formData.level === 'rt' && !formData.parent_id) {
    return { success: false, error: 'RT harus memiliki RW induk (parent).' }
  }

  const { data, error } = await supabase
    .from('wilayah')
    .update({
      posyandu_id: formData.posyandu_id,
      parent_id: formData.level === 'rw' ? null : formData.parent_id,
      level: formData.level,
      kode: formData.kode,
      nama: formData.nama || null,
    })
    .eq('id', id)
    .select()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Kode wilayah tersebut sudah terdaftar (duplikat)!' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/admin/wilayah')
  return { success: true, data }
}

export async function deleteWilayah(id: string) {
  await checkAdmin()
  const supabase = createClient()

  const { error } = await supabase.from('wilayah').delete().eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/admin/wilayah')
  return { success: true }
}
