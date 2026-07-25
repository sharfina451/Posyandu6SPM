import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTicketById } from '../actions'
import { TicketDetailClient } from './ticket-detail-client'

interface PageProps {
  params: {
    id: string
  }
}

export default async function TicketDetailPage({ params }: PageProps) {
  const supabase = createClient()

  // 1. Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch user role
  const { data: profile } = await supabase
    .from('pengguna')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'kader'

  // 3. Fetch ticket details using action
  const res = await getTicketById(params.id)

  if (!res.success || !res.data) {
    return (
      <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8 text-center text-rose-400 max-w-xl mx-auto mt-12">
        <h3 className="text-lg font-bold mb-2">Gagal Memuat Tiket</h3>
        <p className="text-sm text-rose-400/80 mb-4">
          {res.error ||
            'Tiket tidak ditemukan atau Anda tidak memiliki hak akses untuk melihatnya.'}
        </p>
        <a
          href="/dashboard/tiket"
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition"
        >
          Kembali ke Daftar Tiket
        </a>
      </div>
    )
  }

  return <TicketDetailClient ticket={res.data} currentUserRole={role} />
}
