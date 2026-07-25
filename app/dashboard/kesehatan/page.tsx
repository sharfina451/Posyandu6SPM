import React from 'react'
import Link from 'next/link'
import { getPemeriksaans, getHighRiskPemeriksaans } from './actions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DeletePemeriksaanButton } from '@/components/delete-pemeriksaan-button'
import { BuatRujukanDialog } from '@/components/buat-rujukan-dialog'
import { Heart, Plus, FileSpreadsheet, ShieldAlert } from 'lucide-react'

interface Pemeriksaan {
  id: string
  warga_id: string
  tanggal: string
  berat_kg: number | null
  tinggi_cm: number | null
  lingkar_kepala_cm: number | null
  lila_cm: number | null
  tekanan_sistolik: number | null
  tekanan_diastolik: number | null
  gula_darah: number | null
  status_gizi: string | null
  keluhan_ispa: boolean
  paparan_polutan: boolean
  catatan: string | null
  warga: {
    id: string
    nama: string
    nik: string
    tanggal_lahir: string
    jenis_kelamin: 'L' | 'P'
    rumah_tangga: {
      id: string
      alamat: string
      dekat_industri: boolean
    } | null
  }
}

export default async function KesehatanPage() {
  const supabase = createClient()

  // Get current user role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('pengguna')
    .select('role')
    .eq('id', user?.id)
    .single()

  const role = profile?.role || 'kader'

  const res = await getPemeriksaans()
  const pemeriksaans = res.success && res.data ? (res.data as Pemeriksaan[]) : []

  // Load high risk cases for Bidan / Admin
  let highRisks: Pemeriksaan[] = []
  if (role === 'bidan' || role === 'admin') {
    const resHigh = await getHighRiskPemeriksaans()
    if (resHigh.success && resHigh.data) {
      highRisks = resHigh.data as Pemeriksaan[]
    }
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

  const getWargaType = (ageYears: number) => {
    if (ageYears <= 5) return 'Balita'
    if (ageYears >= 60) return 'Lansia'
    return 'Usia Produktif'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Heart className="h-8 w-8 text-rose-400" />
            Kesehatan & ILP
          </h2>
          <p className="text-slate-400 text-sm">
            Modul rekam pemeriksaan kesehatan fisik, antropometri KMS, dan skrining K3.
          </p>
        </div>
        <Link href="/dashboard/kesehatan/baru">
          <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-2 rounded-xl active:scale-95 transition">
            <Plus className="h-5 w-5" /> Catat Pemeriksaan Baru
          </Button>
        </Link>
      </div>

      {/* Bidan Desa Panel (T-E5.7, T-E5.8) */}
      {(role === 'bidan' || role === 'admin') && highRisks.length > 0 && (
        <Card className="bg-slate-900/60 border-rose-500/20 backdrop-blur-xl border-l-4 border-l-rose-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
              <h3 className="text-lg font-bold text-white">
                Panel Bidan Desa: Kasus Berisiko Tinggi (Perlu Tindak Lanjut Rujukan)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Daftar warga dengan indikasi risiko kesehatan (Stunting, Gizi Buruk/Kurang,
              Hipertensi, Gula Darah Tinggi, atau gejala ISPA di dekat industri).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-2 pr-2">Nama Warga</th>
                    <th className="pb-2 px-2">Tanggal</th>
                    <th className="pb-2 px-2">Kondisi Risiko Kesehatan</th>
                    <th className="pb-2 px-2">Lingkungan</th>
                    <th className="pb-2 pl-2 text-right">Rujukan Alur Kerja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {highRisks.map((p) => {
                    const isStunting = p.status_gizi?.toLowerCase().includes('stunting')
                    const isGiziKurang =
                      p.status_gizi?.toLowerCase().includes('kurang') ||
                      p.status_gizi?.toLowerCase().includes('buruk')
                    const isHipertensi = p.tekanan_sistolik && p.tekanan_sistolik > 140
                    const isHiperglikemia = p.gula_darah && p.gula_darah > 200

                    let defaultJenis = 'Rujukan Kesehatan'
                    let defaultDeskripsi = `Rujukan untuk ${p.warga.nama}.`

                    if (isStunting) {
                      defaultJenis = 'Rujukan Stunting (Kesehatan)'
                      defaultDeskripsi = `Balita terindikasi stunting dengan status: ${p.status_gizi}. Perlu intervensi gizi.`
                    } else if (isGiziKurang) {
                      defaultJenis = 'Pemberian PMT (Sosial)'
                      defaultDeskripsi = `Warga terindikasi gizi kurang/buruk. Butuh bantuan makanan tambahan.`
                    } else if (isHipertensi) {
                      defaultJenis = 'Rujukan Hipertensi'
                      defaultDeskripsi = `Tekanan darah sistolik tinggi (${p.tekanan_sistolik} mmHg). Butuh penanganan obat/medis.`
                    } else if (p.keluhan_ispa) {
                      defaultJenis = 'Skrining ISPA (Trantibumlinmas)'
                      defaultDeskripsi = `Warga di area industri mengalami gejala ISPA batuk pilek sesak napas.`
                    }

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/35 transition-colors">
                        <td className="py-3 pr-2 font-bold text-white">
                          {p.warga.nama}
                          <p className="text-[10px] text-slate-500 font-mono">NIK: {p.warga.nik}</p>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          {new Date(p.tanggal).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex flex-wrap gap-1">
                            {p.status_gizi && (isStunting || isGiziKurang) && (
                              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/25 px-1.5 py-0.5 rounded font-bold uppercase text-[9px]">
                                {p.status_gizi}
                              </span>
                            )}
                            {isHipertensi && (
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded font-bold text-[9px]">
                                Hipertensi ({p.tekanan_sistolik} mmHg)
                              </span>
                            )}
                            {isHiperglikemia && (
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded font-bold text-[9px]">
                                Gula Darah Tinggi ({p.gula_darah} mg/dL)
                              </span>
                            )}
                            {p.keluhan_ispa && (
                              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/25 px-1.5 py-0.5 rounded font-bold text-[9px]">
                                Gejala ISPA
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          {p.warga.rumah_tangga?.dekat_industri ? (
                            <span className="text-amber-400 font-medium">Dekat Industri</span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="py-3 pl-2 text-right">
                          <BuatRujukanDialog
                            wargaId={p.warga_id}
                            wargaNama={p.warga.nama}
                            defaultJenis={defaultJenis}
                            defaultDeskripsi={defaultDeskripsi}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Table list */}
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Riwayat Pemeriksaan Kesehatan</h3>
          {pemeriksaans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Belum Ada Catatan Pemeriksaan</p>
                <p className="text-slate-500 text-xs max-w-xs mt-1">
                  Mulai dengan mengeklik tombol &quot;Catat Pemeriksaan Baru&quot; di kanan atas.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm font-semibold">
                    <th className="pb-3 pr-4">Nama Warga</th>
                    <th className="pb-3 px-4">Tanggal</th>
                    <th className="pb-3 px-4">Kategori</th>
                    <th className="pb-3 px-4">Antropometri Balita</th>
                    <th className="pb-3 px-4">Tensi & Gula Darah</th>
                    <th className="pb-3 px-4">Skrining K3</th>
                    <th className="pb-3 pl-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-sm text-slate-300">
                  {pemeriksaans.map((p) => {
                    const ageYears = calculateAge(p.warga.tanggal_lahir)
                    const type = getWargaType(ageYears)

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/35 transition-colors">
                        <td className="py-4 pr-4 font-bold text-white">
                          <div>
                            {p.warga.nama}
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              NIK: {p.warga.nik}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          {new Date(p.tanggal).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              type === 'Balita'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : type === 'Lansia'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}
                          >
                            {type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs">
                          {type === 'Balita' && (p.berat_kg || p.tinggi_cm) ? (
                            <div className="space-y-0.5">
                              <p>
                                BB: <span className="font-semibold">{p.berat_kg || '-'}</span> kg •
                                TB: <span className="font-semibold">{p.tinggi_cm || '-'}</span> cm
                              </p>
                              <p className="text-[10px] text-slate-400">
                                LK: {p.lingkar_kepala_cm || '-'} cm • LiLA: {p.lila_cm || '-'} cm
                              </p>
                              {p.status_gizi && (
                                <p className="text-[10px] font-bold text-emerald-400 uppercase mt-0.5">
                                  Gizi: {p.status_gizi}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-xs">
                          {type !== 'Balita' && (p.tekanan_sistolik || p.gula_darah) ? (
                            <div className="space-y-0.5">
                              {p.tekanan_sistolik && (
                                <p>
                                  Tensi:{' '}
                                  <span className="font-semibold">
                                    {p.tekanan_sistolik}/{p.tekanan_diastolik}
                                  </span>{' '}
                                  mmHg
                                </p>
                              )}
                              {p.gula_darah && (
                                <p>
                                  Gula Darah: <span className="font-semibold">{p.gula_darah}</span>{' '}
                                  mg/dL
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-xs">
                          {p.keluhan_ispa || p.paparan_polutan ? (
                            <div className="space-y-0.5 text-amber-400 font-medium">
                              {p.keluhan_ispa && <p>• Keluhan ISPA</p>}
                              {p.paparan_polutan && <p>• Terpapar Polutan</p>}
                            </div>
                          ) : (
                            <span className="text-slate-500">Aman</span>
                          )}
                        </td>
                        <td className="py-4 pl-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/dashboard/warga/${p.warga_id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-400 hover:text-emerald-350 hover:bg-emerald-500/10 rounded-lg text-xs"
                              >
                                Profil
                              </Button>
                            </Link>
                            <DeletePemeriksaanButton id={p.id} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
