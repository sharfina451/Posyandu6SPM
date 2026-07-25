import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLaporanHistory } from './laporan-actions'
import { LaporanClient } from './laporan-client'

export default async function LaporanPage() {
  const supabase = createClient()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const role = (user.app_metadata?.role as string) || 'kader'

  // 2. Fetch history of exports
  const historyRes = await getLaporanHistory()
  const initialHistory = historyRes.success && historyRes.list ? historyRes.list : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Pelaporan Bulanan 6 SPM
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Penyusunan dan pengeksporan laporan rekapitulasi capaian Standar Pelayanan Minimal (SPM)
          Desa Lemahduwur dalam format Excel & PDF.
        </p>
      </div>

      <LaporanClient initialHistory={initialHistory} currentUserRole={role} />
    </div>
  )
}
