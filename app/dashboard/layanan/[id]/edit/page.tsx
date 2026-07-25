import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLayananSpmById } from '../../actions'
import { getKunjungans } from '../../../kunjungan/actions'
import { SpmFormRenderer, BidangSpm } from '@/components/spm-form-renderer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, User } from 'lucide-react'

interface PageProps {
  params: {
    id: string
  }
}

export default async function EditLayananPage({ params }: PageProps) {
  // 1. Fetch layanan_spm record
  const resLayanan = await getLayananSpmById(params.id)

  if (!resLayanan.success || !resLayanan.data) {
    notFound()
  }

  const layanan = resLayanan.data
  const warga = layanan.warga

  // 2. Fetch kunjungans list
  const resKunj = await getKunjungans()
  const kunjungans = resKunj.success && resKunj.data ? resKunj.data : []

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link href={`/dashboard/warga/${layanan.warga_id}`}>
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white rounded-xl flex items-center gap-1.5"
          >
            <ChevronLeft className="h-5 w-5" /> Batal & Kembali
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          Ubah Catatan Layanan
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
            Bidang {layanan.bidang}
          </span>
        </h2>
        <p className="text-slate-400 text-sm">
          Pembaruan data rekam pelayanan posyandu yang diubah secara tercatat dalam audit log.
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
              Penerima Layanan: {warga ? warga.nama : 'Tidak Diketahui'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              NIK: <span className="font-mono">{warga ? warga.nik : '-'}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Form Component in Edit Mode */}
      <SpmFormRenderer
        wargaId={layanan.warga_id}
        bidang={layanan.bidang as BidangSpm}
        existingData={{
          id: layanan.id,
          tanggal_layanan: layanan.tanggal_layanan,
          jenis_layanan: layanan.jenis_layanan,
          kunjungan_id: layanan.kunjungan_id,
          detail: layanan.detail,
        }}
        kunjungans={kunjungans}
      />
    </div>
  )
}
