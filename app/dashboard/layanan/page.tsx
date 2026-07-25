import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getLayananSpms } from './actions'
import { createClient } from '@/lib/supabase/server'
import { LayananSearchFilters } from '@/components/layanan-search-filters'
import { DeleteLayananButton } from '@/components/delete-layanan-button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus, User, Edit2, Calendar } from 'lucide-react'

interface LayananSpmItem {
  id: string
  tanggal_layanan: string
  bidang: string
  jenis_layanan: string
  warga: {
    id: string
    nama: string
    NIK: string
  } | null
  kader: {
    nama: string
  } | null
}

interface PageProps {
  searchParams: {
    query?: string
    bidang?: string
  }
}

const BIDANG_LABELS: Record<string, string> = {
  pendidikan: 'Pendidikan',
  kesehatan: 'Kesehatan',
  pekerjaan_umum: 'Pekerjaan Umum',
  perumahan_rakyat: 'Perumahan Rakyat',
  trantibumlinmas: 'Trantibumlinmas',
  sosial: 'Sosial',
}

const BIDANG_BADGES: Record<string, string> = {
  pendidikan: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  kesehatan: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  pekerjaan_umum: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  perumahan_rakyat: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  trantibumlinmas: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  sosial: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

export default async function LayananPage({ searchParams }: PageProps) {
  const supabase = createClient()

  // 1. Authenticate user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch layanan SPM list with filters applied
  const res = await getLayananSpms({
    query: searchParams.query,
    bidang: searchParams.bidang,
  })

  const layanans = res.success && res.data ? res.data : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <FileText className="h-8 w-8 text-emerald-400" />
            Layanan 6 SPM
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Riwayat log pendataan transaksi dan pelayanan Standar Pelayanan Minimal (SPM) Desa
            Lemahduwur.
          </p>
        </div>
        <Link href="/dashboard/warga">
          <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 active:scale-95 transition text-xs h-9.5">
            <Plus className="h-4 w-4" /> Catat Layanan (Pilih Warga)
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <LayananSearchFilters initialQuery={searchParams.query} initialBidang={searchParams.bidang} />

      {/* List Card */}
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl rounded-2xl shadow-xl">
        <CardHeader className="border-b border-slate-850 pb-3">
          <CardTitle className="text-sm font-bold text-slate-300">
            Daftar Pelayanan Terdaftar ({layanans.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {layanans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-950/40">
                    <th className="p-4">Tanggal Layanan</th>
                    <th className="p-4">Nama Warga</th>
                    <th className="p-4">Bidang SPM</th>
                    <th className="p-4">Jenis Pelayanan</th>
                    <th className="p-4">Kader Pencatat</th>
                    <th className="p-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {layanans.map((item: LayananSpmItem) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-850 hover:bg-slate-950/20 text-slate-300 transition"
                    >
                      <td className="p-4 font-bold text-white">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          {new Date(item.tanggal_layanan).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/dashboard/warga/${item.warga?.id}`}
                          className="hover:underline font-bold text-emerald-400 block"
                        >
                          {item.warga?.nama || 'Warga Terhapus'}
                        </Link>
                        <span className="text-[10px] text-slate-500 font-mono">
                          NIK: {item.warga?.NIK || '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] font-bold tracking-wide uppercase ${
                            BIDANG_BADGES[item.bidang] || 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {BIDANG_LABELS[item.bidang] || item.bidang}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-200">{item.jenis_layanan}</td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 text-slate-400">
                          <User className="h-3.5 w-3.5 text-slate-600" />
                          {item.kader?.nama || 'Sistem'}
                        </span>
                      </td>
                      <td className="p-4 flex items-center justify-center gap-1.5">
                        <Link href={`/dashboard/layanan/${item.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg h-8 w-8"
                            title="Edit Layanan"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </Link>
                        <DeleteLayananButton id={item.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs">
              Tidak ada catatan pelayanan SPM yang cocok dengan pencarian Anda.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
