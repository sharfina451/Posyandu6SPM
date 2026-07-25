'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
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

export async function getUsers() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pengguna')
    .select(
      '*, peran:peran_id(id, kode, nama), wilayah:wilayah_id(id, kode, level), posyandu:posyandu_id(id, nama)'
    )
    .order('dibuat_pada', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function updateUser(
  id: string,
  formData: {
    peran_id: number
    wilayah_id?: string
    posyandu_id?: string
    aktif: boolean
  }
) {
  await checkAdmin()
  const supabase = createClient()

  // Ambil kode peran untuk disinkronkan ke app_metadata
  const { data: peran } = await supabase
    .from('peran')
    .select('kode')
    .eq('id', formData.peran_id)
    .single()

  const roleCode = peran?.kode || 'kader'

  // Update public profile
  const { error: errorProfile } = await supabase
    .from('pengguna')
    .update({
      peran_id: formData.peran_id,
      wilayah_id: formData.wilayah_id || null,
      posyandu_id: formData.posyandu_id || null,
      aktif: formData.aktif,
    })
    .eq('id', id)

  if (errorProfile) {
    return { success: false, error: errorProfile.message }
  }

  // Update Auth app_metadata via admin client
  const adminClient = createAdminClient()
  const { error: errorAuth } = await adminClient.auth.admin.updateUserById(id, {
    app_metadata: {
      role: roleCode,
      wilayah_id: formData.wilayah_id || null,
      posyandu_id: formData.posyandu_id || null,
    },
    user_metadata: {
      aktif: formData.aktif,
    },
  })

  if (errorAuth) {
    console.warn('Failed to sync auth user metadata directly:', errorAuth.message)
  }

  revalidatePath('/dashboard/admin/pengguna')
  return { success: true }
}

export async function createUserAndInvite(formData: {
  email: string
  nama: string
  username: string
  peran_id: number
  wilayah_id?: string
  posyandu_id?: string
}) {
  await checkAdmin()
  const supabase = createClient()

  // Dapatkan kode peran
  const { data: peran } = await supabase
    .from('peran')
    .select('kode')
    .eq('id', formData.peran_id)
    .single()

  const roleCode = peran?.kode || 'kader'

  // Gunakan adminClient untuk membuat pengguna baru di Auth langsung
  const adminClient = createAdminClient()
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: formData.email,
    password: 'password123', // password bawaan default untuk development
    email_confirm: true,
    user_metadata: {
      nama: formData.nama,
      username: formData.username,
    },
    app_metadata: {
      role: roleCode,
      wilayah_id: formData.wilayah_id || null,
      posyandu_id: formData.posyandu_id || null,
    },
  })

  if (authError) {
    return { success: false, error: authError.message }
  }

  // Trigger handle_new_user di Postgres telah menduplikasi data ke public.pengguna.
  // Tapi kita tetap melakukan update untuk memastikan wilayah_id dan posyandu_id tersetting secara tepat.
  const { error: updateError } = await supabase
    .from('pengguna')
    .update({
      wilayah_id: formData.wilayah_id || null,
      posyandu_id: formData.posyandu_id || null,
    })
    .eq('id', authData.user.id)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  revalidatePath('/dashboard/admin/pengguna')
  return { success: true, user: authData.user }
}
