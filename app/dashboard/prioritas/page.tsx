import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPriorityVisits, getExclusionPotentialList } from '../actions'
import { PriorityClient } from './priority-client'

export default async function PrioritasPage() {
  const supabase = createClient()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch initial priority list and exclusion list
  const priorityRes = await getPriorityVisits(100)
  const exclusionRes = await getExclusionPotentialList()

  const priorityList = priorityRes.success && priorityRes.list ? priorityRes.list : []
  const exclusionList = exclusionRes.success && exclusionRes.list ? exclusionRes.list : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Prioritas Kunjungan & Eksklusi
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Daftar prioritas kunjungan rumah tangga terurut berdasarkan tingkat kerentanan serta
          deteksi potensi exclusion error bantuan sosial.
        </p>
      </div>

      <PriorityClient priorityList={priorityList} exclusionList={exclusionList} />
    </div>
  )
}
