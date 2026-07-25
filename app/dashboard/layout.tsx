import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = {
    email: user.email || '',
    nama: (user.user_metadata?.nama as string) || user.email || 'Pengguna',
    role: (user.app_metadata?.role as string) || 'kader',
    wilayah_id: (user.app_metadata?.wilayah_id as string) || null,
  }

  return <DashboardShell userProfile={profile}>{children}</DashboardShell>
}
