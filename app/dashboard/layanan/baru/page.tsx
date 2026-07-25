import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getKunjungans } from '../../kunjungan/actions'
import { SpmFormRenderer, BidangSpm } from '@/components/spm-form-renderer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, User } from 'lucide-react'

interface PageProps {
  searchParams: {
    warga_id?: string
    bidang?: string
  }
}

export default async function BaruLayananPage({ searchParams }: PageProps) {
  const wargaId = searchParams.warga_id
  const bidangParam = searchParams.bidang as BidangSpm

  if (!wargaId || !bidangParam) {
    notFound()
  }

  const supabase = createClient()

  // 1. Fetch warga details
  const { data: warga, error: errWarga } = await supabase
    .from('warga')
    .select('id, nama, nik, tanggal_lahir')
    .eq('id', wargaId)
    .maybeSingle()

  if (errWarga || !warga) {
    notFound()
  }

  // Calculate age
  const birthDate = new Date(warga.tanggal_lahir)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  // 2. Fetch active kunjungans for select dropdown
  const resKunj = await getKunjungans()
  const kunjungans = resKunj.success && resKunj.data ? resKunj.data : []

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link href={`/dashboard/warga/${wargaId}`}>
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white rounded-xl flex items-center gap-1.5"
          >
            <ChevronLeft className="h-5 w-5" /> Batal & Kembali ke Warga
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          Catat Layanan SPM
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
            Bidang {bidangParam}
          </span>
        </h2>
        <p className="text-slate-400 text-sm">
          Perekaman rekam pelayanan digital 6 SPM terintegrasi rekam medis posyandu.
        </p>
      </div>

      {/* Warga Summary Card */}
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white leading-none">
              Penerima Layanan: {warga.nama}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              NIK: <span className="font-mono">{warga.nik}</span> • Umur: {age} Tahun
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Form Component */}
      <SpmFormRenderer wargaId={wargaId} bidang={bidangParam} kunjungans={kunjungans} />
    </div>
  )
}
