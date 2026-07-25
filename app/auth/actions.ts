'use server'

import { createClient } from '@/lib/supabase/server'

export async function login(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  if (data.user) {
    await supabase.from('audit_log').insert({
      pengguna_id: data.user.id,
      aksi: 'login',
      tabel: 'pengguna',
      record_id: data.user.id,
      data_baru: { email: data.user.email, logged_in_at: new Date().toISOString() },
    })
  }

  return { success: true, user: data.user }
}

export async function logout() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
