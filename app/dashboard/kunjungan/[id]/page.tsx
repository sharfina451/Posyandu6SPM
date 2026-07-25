import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SummaryButton } from '@/components/summary-button'
import {
  Calendar,
  MapPin,
  ChevronLeft,
  Activity,
  GraduationCap,
  Hammer,
  Home,
  Shield,
  Heart,
  FileSpreadsheet,
} from 'lucide-react'

interface PageProps {
  params: {
    id: string
  }
}

export default async function KunjunganDetailPage({ params }: PageProps) {
  const supabase = createClient()

  // 1. Fetch Kunjungan details
  const { data: kunjungan, error: errKunj } = await supabase
    .from('kunjungan')
    .select('*, wilayah:wilayah_id(id, kode, level)')
    .eq('id', params.id)
    .maybeSingle()

  if (errKunj || !kunjungan) {
    notFound()
  }

  // 2. Fetch all layanan_spm related to this kunjungan
  const { data: layanans } = await supabase
    .from('layanan_spm')
    .select('*, warga:warga_id(id, nama, nik)')
    .eq('kunjungan_id', params.id)
    .order('dibuat_pada', { ascending: false })

  const listLayanan = layanans || []

  // Calculate statistics per bidang
  const stats = {
    total: listLayanan.length,
    kesehatan: listLayanan.filter((l) => l.bidang === 'kesehatan').length,
    pendidikan: listLayanan.filter((l) => l.bidang === 'pendidikan').length,
    pekerjaan_umum: listLayanan.filter((l) => l.bidang === 'pekerjaan_umum').length,
    perumahan_rakyat: listLayanan.filter((l) => l.bidang === 'perumahan_rakyat').length,
    trantibumlinmas: listLayanan.filter((l) => l.bidang === 'trantibumlinmas').length,
    sosial: listLayanan.filter((l) => l.bidang === 'sosial').length,
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link href="/dashboard/kunjungan">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white rounded-xl flex items-center gap-1.5"
          >
            <ChevronLeft className="h-5 w-5" /> Kembali ke Sesi Kunjungan
          </Button>
        </Link>
      </div>

      {/* Title block */}
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
        <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="h-6 w-6 text-emerald-400" />
              {kunjungan.nama}
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(kunjungan.tanggal).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1 capitalize">
                Jenis: {kunjungan.jenis === 'posyandu' ? 'Hari Buka Posyandu' : 'Kunjungan Rumah'}
              </span>
              {kunjungan.wilayah && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Wilayah Scope: {kunjungan.wilayah.level.toUpperCase()} {kunjungan.wilayah.kode}
                </span>
              )}
            </div>
            {kunjungan.keterangan && (
              <p className="text-xs text-slate-500 pt-2 italic">Catatan: {kunjungan.keterangan}</p>
            )}
          </div>
          <SummaryButton kunjunganId={kunjungan.id} />
        </CardContent>
      </Card>

      {/* Grid Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-slate-500 text-xs font-semibold">Total Terlayani</span>
            <span className="text-2xl font-bold text-white mt-1">{stats.total}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Warga</span>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span className="text-slate-500 text-[10px] font-semibold mt-1">Kesehatan</span>
            <span className="text-lg font-bold text-white mt-0.5">{stats.kesehatan}</span>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <GraduationCap className="h-4 w-4 text-blue-400" />
            <span className="text-slate-500 text-[10px] font-semibold mt-1">Pendidikan</span>
            <span className="text-lg font-bold text-white mt-0.5">{stats.pendidikan}</span>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Hammer className="h-4 w-4 text-amber-400" />
            <span className="text-slate-500 text-[10px] font-semibold mt-1">Pekerjaan Umum</span>
            <span className="text-lg font-bold text-white mt-0.5">{stats.pekerjaan_umum}</span>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Home className="h-4 w-4 text-violet-400" />
            <span className="text-slate-500 text-[10px] font-semibold mt-1">Perumahan</span>
            <span className="text-lg font-bold text-white mt-0.5">{stats.perumahan_rakyat}</span>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Shield className="h-4 w-4 text-rose-400" />
            <span className="text-slate-500 text-[10px] font-semibold mt-1">Trantibum</span>
            <span className="text-lg font-bold text-white mt-0.5">{stats.trantibumlinmas}</span>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Heart className="h-4 w-4 text-teal-400" />
            <span className="text-slate-500 text-[10px] font-semibold mt-1">Sosial</span>
            <span className="text-lg font-bold text-white mt-0.5">{stats.sosial}</span>
          </CardContent>
        </Card>
      </div>

      {/* Recapped Services Table */}
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-850">
          <CardTitle className="text-lg font-bold text-white">
            Daftar Pelayanan yang Tercatat
          </CardTitle>
          <CardDescription className="text-slate-400">
            Daftar rekam pelayanan warga dalam sesi ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {listLayanan.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Belum Ada Pelayanan Tercatat</p>
                <p className="text-slate-500 text-xs max-w-xs mt-1">
                  Gunakan tombol &quot;Catat Layanan&quot; pada detail profil warga untuk
                  menambahkan data pelayanan ke sesi ini.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm font-semibold">
                    <th className="pb-3 pr-4">Nama Warga</th>
                    <th className="pb-3 px-4">NIK</th>
                    <th className="pb-3 px-4">Bidang SPM</th>
                    <th className="pb-3 px-4">Jenis Pelayanan</th>
                    <th className="pb-3 px-4">Rincian Data</th>
                    <th className="pb-3 pl-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-sm text-slate-300">
                  {listLayanan.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/35 transition-colors">
                      <td className="py-4 pr-4 font-bold text-white">
                        {l.warga ? l.warga.nama : 'Tidak Diketahui'}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-400">
                        {l.warga ? l.warga.nik : '-'}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                          {l.bidang}
                        </span>
                      </td>
                      <td className="py-4 px-4">{l.jenis_layanan}</td>
                      <td className="py-4 px-4 text-xs font-mono text-slate-400 max-w-[250px] truncate">
                        {JSON.stringify(l.detail)}
                      </td>
                      <td className="py-4 pl-4 text-right">
                        <Link href={`/dashboard/warga/${l.warga_id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-400 hover:text-emerald-350 hover:bg-emerald-500/10 rounded-lg text-xs"
                          >
                            Lihat Profil
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
