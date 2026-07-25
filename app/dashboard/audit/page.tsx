import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuditLogs } from './audit-actions'
import { AuditClient } from './audit-client'

export default async function AuditPage() {
  const supabase = createClient()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Authorize role (only admin/pemdes can explore audit trail logs)
  const role = (user.app_metadata?.role as string) || 'kader'
  if (role !== 'admin' && role !== 'pemdes') {
    redirect('/dashboard')
  }

  // 3. Retrieve initial log payload
  const res = await getAuditLogs()
  const initialLogs = res.success && res.logs ? res.logs : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Log Audit Perubahan Data
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Rekaman jejak perubahan data (audit trail) untuk memastikan integritas, transparansi
          akuntabilitas, dan kepatuhan UU PDP Desa Lemahduwur.
        </p>
      </div>

      <AuditClient initialLogs={initialLogs} />
    </div>
  )
}
