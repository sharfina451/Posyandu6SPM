import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from './actions'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const supabase = createClient()

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const name = (user.user_metadata?.nama as string) || user.email || 'Pengguna'
  const role = (user.app_metadata?.role as string) || 'kader'
  const wilayahId = (user.app_metadata?.wilayah_id as string) || null

  // Fetch Wilayah code if wilayahId exists
  let wilayahCode = null
  if (wilayahId) {
    const { data: wil } = await supabase
      .from('wilayah')
      .select('kode, level')
      .eq('id', wilayahId)
      .single()
    if (wil) wilayahCode = `${wil.level.toUpperCase()} ${wil.kode}`
  }

  // Fetch initial dashboard statistics
  const statsRes = await getDashboardStats({
    rwId: role === 'kader' && wilayahId ? wilayahId : undefined,
  })

  const initialStats =
    statsRes.success && statsRes.data
      ? statsRes.data
      : {
          totalWarga: 0,
          totalKunjungan: 0,
          totalTiketActive: 0,
          totalTiketOverdue: 0,
          bidangStats: [],
          statusStats: [],
          monthlyTrend: [],
          rwsList: [],
        }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Selamat Datang, {name}!
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Sistem LKD Posyandu 6 Standar Pelayanan Minimal (SPM) Desa Lemahduwur.
        </p>
      </div>

      {/* Interactive dashboard charts and filters */}
      <DashboardClient
        initialStats={initialStats}
        currentUserRole={role}
        currentUserWilayahCode={wilayahCode}
      />
    </div>
  )
}
