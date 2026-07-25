import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTickets } from './actions'
import { TicketBoardClient } from './ticket-board'

export default async function TiketPage() {
  const supabase = createClient()

  // 1. Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch user's profile and role
  const { data: profile } = await supabase
    .from('pengguna')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'kader'

  // 3. Fetch all active citizens (for ticket assignment inside the modal dialog)
  const { data: wargaData } = await supabase
    .from('warga')
    .select('id, nama, nik')
    .is('dihapus_pada', null)
    .order('nama', { ascending: true })

  // 4. Fetch list of tickets
  const res = await getTickets()
  const tickets = res.success && res.data ? res.data : []

  return (
    <TicketBoardClient
      initialTickets={tickets}
      wargaList={wargaData || []}
      currentUserRole={role}
    />
  )
}
