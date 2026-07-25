import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getRegistrationDetails,
  getSubmittedPosyandus,
  PosyanduRegistrasiDetails,
} from './registrasi-actions'
import { RegistrasiClient } from './registrasi-client'

export default async function RegistrasiPage() {
  const supabase = createClient()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const role = (user.app_metadata?.role as string) || 'kader'

  // 2. Fetch initial details of the Posyandu
  const detailsRes = await getRegistrationDetails()

  // Fallback if details query fails
  const initialDetails =
    detailsRes.success && detailsRes.data
      ? detailsRes.data
      : {
          id: '',
          nama: 'Posyandu Terkait',
          status_registrasi: 'draf' as const,
          nomor_registrasi: null,
          catatan_registrasi: null,
          desa: 'Lemahduwur',
          kecamatan: 'Adiwerna',
          kabupaten: 'Tegal',
          no_sk_pengurus: null,
          tanggal_terdaftar: null,
          dokumen: [],
        }

  // 3. Fetch list of submitted posyandus (for review) if user is pemdes or admin
  let submittedList: PosyanduRegistrasiDetails[] = []
  if (role === 'admin' || role === 'pemdes') {
    const listRes = await getSubmittedPosyandus()
    if (listRes.success && listRes.list) {
      submittedList = listRes.list
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Registrasi Kelembagaan Posyandu
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Penyiapan berkas kelengkapan administrasi nomor registrasi resmi Posyandu (LKD) Desa
          Lemahduwur.
        </p>
      </div>

      <RegistrasiClient
        initialDetails={initialDetails}
        submittedList={submittedList}
        currentUserRole={role}
      />
    </div>
  )
}
