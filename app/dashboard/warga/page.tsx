'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getWargas, searchWargaByNik } from './actions'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search, ScanBarcode, UserPlus, ChevronRight, User, Plus } from 'lucide-react'

interface Warga {
  id: string
  nik: string
  nama: string
  tanggal_lahir: string
  jenis_kelamin: 'L' | 'P'
  disabilitas: boolean
  nik_terverifikasi: boolean
  rumah_tangga_id: string | null
  rumah_tangga?: {
    id: string
    no_kk: string
    alamat: string
  } | null
}

export default function WargaPage() {
  const [wargas, setWargas] = useState<Warga[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<Warga | null>(null)
  const [searchAttempted, setSearchAttempted] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadWargas = async () => {
    setLoading(true)
    const res = await getWargas()
    if (res.success && res.data) {
      setWargas(res.data as Warga[])
    } else {
      setError(res.error || 'Gagal memuat daftar warga.')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadWargas()
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery) return
    setError(null)
    setSearching(true)
    setSearchAttempted(true)

    const res = await searchWargaByNik(searchQuery)
    if (res.success) {
      setSearchResult((res.data as Warga) || null)
    } else {
      setError(res.error || 'Gagal mencari warga.')
      setSearchResult(null)
    }
    setSearching(false)
  }

  const handleBarcodeScan = (scannedNik: string) => {
    setSearchQuery(scannedNik)
    setScannerOpen(false)
    // Trigger search directly
    setError(null)
    setSearching(true)
    setSearchAttempted(true)
    searchWargaByNik(scannedNik).then((res) => {
      if (res.success) {
        setSearchResult((res.data as Warga) || null)
      } else {
        setError(res.error || 'Gagal mencari warga.')
        setSearchResult(null)
      }
      setSearching(false)
    })
  }

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Data Warga</h2>
          <p className="text-slate-400 text-sm">
            Single Identity Index warga Desa Lemahduwur terproteksi RLS wilayah.
          </p>
        </div>
        <Link href="/dashboard/warga/baru">
          <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-2 rounded-xl active:scale-95 transition">
            <Plus className="h-5 w-5" /> Daftarkan Warga Baru
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Search and Scan Bar */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-slate-500" />
              </div>
              <Input
                type="text"
                maxLength={16}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.replace(/\D/g, ''))}
                placeholder="Cari NIK warga (16 digit)..."
                className="pl-10"
              />
            </div>
            <Button
              type="submit"
              disabled={searching}
              className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold px-6 border border-slate-700 active:scale-95 transition"
            >
              {searching ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Cari'}
            </Button>
            <Button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold flex items-center gap-1.5 rounded-xl active:scale-95 transition px-4"
              title="Scan Barcode KTP/KIA"
            >
              <ScanBarcode className="h-5 w-5" />
              <span className="hidden sm:inline">Scan</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Scanner Modal */}
      {scannerOpen && (
        <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setScannerOpen(false)} />
      )}

      {/* Search Result Display */}
      {searchAttempted && !searching && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          {searchResult ? (
            <Card className="bg-emerald-500/5 border-emerald-500/20 backdrop-blur-xl">
              <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      {searchResult.nama}
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          searchResult.nik_terverifikasi
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {searchResult.nik_terverifikasi ? 'NIK Terverifikasi' : 'Belum Verifikasi'}
                      </span>
                    </h4>
                    <p className="text-sm text-slate-400 font-mono mt-0.5">
                      NIK: {searchResult.nik}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchResult.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} •{' '}
                      {calculateAge(searchResult.tanggal_lahir)} Tahun •{' '}
                      {searchResult.rumah_tangga
                        ? searchResult.rumah_tangga.alamat
                        : 'Tidak Ada KK'}
                    </p>
                  </div>
                </div>
                <Link href={`/dashboard/warga/${searchResult.id}`}>
                  <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl active:scale-95 transition flex items-center gap-1.5">
                    Lihat Detail Profil <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
              <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-lg font-bold text-white">NIK Tidak Ditemukan</h4>
                  <p className="text-sm text-slate-400 mt-1">
                    Warga dengan NIK{' '}
                    <span className="font-mono text-emerald-400 font-bold">{searchQuery}</span>{' '}
                    belum terdaftar di sistem.
                  </p>
                </div>
                <Link href={`/dashboard/warga/baru?nik=${searchQuery}`}>
                  <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl active:scale-95 transition flex items-center gap-1.5">
                    <UserPlus className="h-5 w-5" /> Daftarkan Warga Baru
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Warga List Table */}
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Daftar Warga Terdaftar</h3>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
              <p className="text-slate-400 text-sm">Memuat data warga...</p>
            </div>
          ) : wargas.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Belum ada warga yang terdaftar di wilayah kerja Anda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm font-semibold">
                    <th className="pb-3 pr-4">Nama Lengkap</th>
                    <th className="pb-3 px-4">NIK</th>
                    <th className="pb-3 px-4">Umur / JK</th>
                    <th className="pb-3 px-4">No. KK</th>
                    <th className="pb-3 px-4">Alamat Domisili</th>
                    <th className="pb-3 px-4">Status NIK</th>
                    <th className="pb-3 pl-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-sm text-slate-300">
                  {wargas.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-800/35 transition-colors">
                      <td className="py-4 pr-4 font-bold text-white flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-500" />
                        {w.nama}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-400">{w.nik}</td>
                      <td className="py-4 px-4">
                        {calculateAge(w.tanggal_lahir)} Thn / {w.jenis_kelamin}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-400">
                        {w.rumah_tangga ? w.rumah_tangga.no_kk : '-'}
                      </td>
                      <td className="py-4 px-4 truncate max-w-[180px]">
                        {w.rumah_tangga ? w.rumah_tangga.alamat : '-'}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            w.nik_terverifikasi
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {w.nik_terverifikasi ? 'Terverifikasi' : 'Belum Verifikasi'}
                        </span>
                      </td>
                      <td className="py-4 pl-4 text-right">
                        <Link href={`/dashboard/warga/${w.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg text-xs"
                          >
                            Detail
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
