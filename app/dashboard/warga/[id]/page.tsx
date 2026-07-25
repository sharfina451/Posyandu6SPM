import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { saranBidang } from '@/lib/utils/saran-spm'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConsentPanel } from '@/components/consent-panel'
import { getConsentHistory } from '@/app/dashboard/warga/consent-actions'
import { DeleteLayananButton } from '@/components/delete-layanan-button'
import { DeletePemeriksaanButton } from '@/components/delete-pemeriksaan-button'
import { KmsChart } from '@/components/kms-chart'
import {
  User,
  Building,
  History,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  PenTool,
  Edit2,
  Heart,
  Activity,
  Plus,
} from 'lucide-react'

interface PageProps {
  params: {
    id: string
  }
}

export default async function WargaDetailPage({ params }: PageProps) {
  const supabase = createClient()

  // 1. Fetch warga details
  const { data: warga, error: errWarga } = await supabase
    .from('warga')
    .select(
      '*, rumah_tangga:rumah_tangga_id(*, wilayah_rt:wilayah_rt_id(*, parent:parent_id(*))), consent:consent_pdp(*)'
    )
    .eq('id', params.id)
    .maybeSingle()

  if (errWarga || !warga) {
    notFound()
  }

  // Fetch real consent history (Epic E12)
  const consentRes = await getConsentHistory(warga.id)
  const consentHistory = consentRes.success && consentRes.list ? consentRes.list : []

  // 2. Fetch layanan_spm history
  const { data: history } = await supabase
    .from('layanan_spm')
    .select('*, kader:kader_id(nama)')
    .eq('warga_id', params.id)
    .order('tanggal_layanan', { ascending: false })

  const listLayanan = history || []

  // 3. Fetch pemeriksaan_kesehatan history
  const { data: pemeriksaans } = await supabase
    .from('pemeriksaan_kesehatan')
    .select('*')
    .eq('warga_id', params.id)
    .order('tanggal', { ascending: false })

  const listPemeriksaan = pemeriksaans || []

  // Calculate age
  const birthDate = new Date(warga.tanggal_lahir)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  // Calculate age in months for the KMS chart mapping
  const getAgeMonths = (dateStr: string) => {
    const dob = new Date(warga.tanggal_lahir)
    const checkDate = new Date(dateStr)
    let months = (checkDate.getFullYear() - dob.getFullYear()) * 12
    months += checkDate.getMonth() - dob.getMonth()
    if (checkDate.getDate() < dob.getDate()) {
      months--
    }
    return months
  }

  const kmsHistory = listPemeriksaan
    .filter((p) => p.berat_kg !== null)
    .map((p) => ({
      tanggal: p.tanggal,
      berat_kg: Number(p.berat_kg),
      tinggi_cm: p.tinggi_cm ? Number(p.tinggi_cm) : undefined,
      ageMonths: getAgeMonths(p.tanggal),
    }))

  const isBalita = age <= 5

  // Get latest pemeriksaan gizi warning (T-E5.4)
  const latestPeriksa = listPemeriksaan[0]
  const isStunting = latestPeriksa?.status_gizi?.toLowerCase().includes('stunting')
  const isGiziKurang =
    latestPeriksa?.status_gizi?.toLowerCase().includes('kurang') ||
    latestPeriksa?.status_gizi?.toLowerCase().includes('buruk')

  // Get SPM recommendations
  const spmSuggestions = saranBidang(warga.tanggal_lahir, warga.jenis_kelamin, warga.disabilitas)

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href="/dashboard/warga">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white rounded-xl flex items-center gap-1.5"
          >
            <ChevronLeft className="h-5 w-5" /> Kembali ke Daftar Warga
          </Button>
        </Link>

        <div className="flex gap-2">
          <Link href={`/dashboard/kesehatan/baru?warga_id=${warga.id}`}>
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs py-2 h-9 flex items-center gap-1.5 shadow-md active:scale-95 transition">
              <Plus className="h-3.5 w-3.5" /> Catat Pemeriksaan Fisik
            </Button>
          </Link>
        </div>
      </div>

      {/* Health risk warning banner (T-E5.4) */}
      {latestPeriksa && (isStunting || isGiziKurang) && (
        <div
          className={`rounded-2xl border p-4 flex items-start gap-3 backdrop-blur-md ${
            isStunting
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          }`}
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">
              {isStunting ? 'Peringatan Risiko Stunting' : 'Peringatan Gizi Kurang/Buruk'}
            </h4>
            <p className="text-xs mt-1 leading-relaxed opacity-90">
              Hasil pemeriksaan terakhir pada{' '}
              {new Date(latestPeriksa.tanggal).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}{' '}
              menunjukkan status:{' '}
              <span className="font-extrabold uppercase">{latestPeriksa.status_gizi}</span>.
              {isStunting
                ? ' Harap rujuk warga ke Bidan Desa atau Puskesmas Lemahduwur untuk intervensi gizi spesifik.'
                : ' Harap jadwalkan pemberian PMT (Pemberian Makanan Tambahan) dan edukasi gizi bagi orang tua.'}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Left is Profile & KK, Right is SPM suggestions & History */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Profile & KK details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
            <CardHeader className="flex flex-col items-center text-center pb-6 border-b border-slate-850">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 mb-4">
                <User className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-white leading-tight">{warga.nama}</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">NIK: {warga.nik}</p>
              <span
                className={`inline-flex items-center mt-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  warga.nik_terverifikasi
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {warga.nik_terverifikasi ? 'NIK Terverifikasi' : 'Belum Terverifikasi'}
              </span>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-sm">
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">Jenis Kelamin</span>
                <span className="text-white font-semibold">
                  {warga.jenis_kelamin === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">Tempat Lahir</span>
                <span className="text-white font-semibold">{warga.tempat_lahir || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">Tanggal Lahir</span>
                <span className="text-white font-semibold">
                  {new Date(warga.tanggal_lahir).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">Umur</span>
                <span className="text-white font-semibold">{age} Tahun</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">Golongan Darah</span>
                <span className="text-white font-semibold uppercase">
                  {warga.golongan_darah || '-'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">No. Telepon</span>
                <span className="text-white font-semibold">{warga.telepon || '-'}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-slate-500">Disabilitas</span>
                <span
                  className={`font-semibold ${
                    warga.disabilitas ? 'text-amber-400' : 'text-slate-400'
                  }`}
                >
                  {warga.disabilitas ? `Ya (${warga.jenis_disabilitas})` : 'Tidak'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Household Card */}
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
            <CardHeader className="border-b border-slate-850 pb-4">
              <CardTitle className="text-md font-bold text-white flex items-center gap-2">
                <Building className="h-5 w-5 text-slate-400" />
                Data Rumah Tangga
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-sm">
              {warga.rumah_tangga ? (
                <>
                  <div className="flex justify-between border-b border-slate-850 pb-2">
                    <span className="text-slate-500">Nomor KK</span>
                    <span className="text-white font-mono font-semibold">
                      {warga.rumah_tangga.no_kk}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-850 pb-2">
                    <span className="text-slate-500">Alamat KK</span>
                    <span className="text-white font-semibold text-right">
                      {warga.rumah_tangga.alamat}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-850 pb-2">
                    <span className="text-slate-500">Wilayah RT / RW</span>
                    <span className="text-white font-semibold">
                      RT {warga.rumah_tangga.wilayah_rt?.kode || '-'} / RW{' '}
                      {warga.rumah_tangga.wilayah_rt?.parent?.kode || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-850 pb-2">
                    <span className="text-slate-500">Sanitasi & Air</span>
                    <span className="text-slate-200">
                      {warga.rumah_tangga.air_bersih ? 'Air Bersih ✓' : 'Air Tidak Layak ✗'} •{' '}
                      {warga.rumah_tangga.jamban_sehat ? 'Jamban Sehat ✓' : 'Jamban ✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dekat Industri</span>
                    <span className="text-white font-semibold">
                      {warga.rumah_tangga.dekat_industri ? 'Ya (Beresiko)' : 'Tidak'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-slate-500 text-xs py-4 text-center">
                  Warga belum ditautkan ke Kartu Keluarga mana pun.
                </div>
              )}
            </CardContent>
          </Card>

          <ConsentPanel wargaId={warga.id} initialHistory={consentHistory} />
        </div>

        {/* Right Side: SPM suggestions & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* SPM Suggestions Section (T-E3.10) */}
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl border-emerald-500/20">
            <CardHeader className="border-b border-slate-850 pb-4 flex flex-row items-center gap-2 space-y-0">
              <Sparkles className="h-5 w-5 text-emerald-400 animate-pulse" />
              <div>
                <CardTitle className="text-lg font-bold text-white">
                  Rekomendasi Layanan SPM
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Layanan Standar Pelayanan Minimal yang disarankan sistem secara pintar.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {spmSuggestions.length === 0 ? (
                <div className="text-slate-500 text-xs py-4">
                  Tidak ada rekomendasi spesifik untuk profil ini.
                </div>
              ) : (
                <div className="grid gap-4">
                  {spmSuggestions.map((s, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-emerald-500/20 transition-all duration-200"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/25 uppercase tracking-wider">
                            {s.bidang}
                          </span>
                          {s.subKategori && (
                            <span className="text-xs text-slate-500">• {s.subKategori}</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed font-semibold">
                          {s.alasan}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/layanan/baru?warga_id=${warga.id}&bidang=${s.bidang}`}
                      >
                        <Button className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-semibold rounded-xl text-xs py-2 h-9 flex items-center gap-1.5 shadow-md active:scale-95 transition">
                          <PenTool className="h-3.5 w-3.5" /> Catat Layanan
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* KMS Chart Section (T-E5.3) */}
          {isBalita && (
            <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-850 pb-4">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-400" />
                  Grafik Pertumbuhan Anak (KMS)
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Visualisasi kurva berat badan anak terhadap standar deviasi median WHO.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {kmsHistory.length === 0 ? (
                  <div className="text-slate-500 text-xs py-12 text-center">
                    Belum ada data berat badan yang dicatat untuk anak ini.
                  </div>
                ) : (
                  <KmsChart jenisKelamin={warga.jenis_kelamin} history={kmsHistory} />
                )}
              </CardContent>
            </Card>
          )}

          {/* Physical Health History Section (T-E5.1) */}
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
            <CardHeader className="border-b border-slate-850 pb-4">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-400" />
                Riwayat Pemeriksaan Fisik & ILP
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {listPemeriksaan.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-xs">Belum Ada Pemeriksaan Fisik</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold">
                        <th className="pb-2 pr-2">Tanggal</th>
                        <th className="pb-2 px-2">Antropometri / Fisik</th>
                        <th className="pb-2 px-2">Tensi / Gula</th>
                        <th className="pb-2 px-2">Skrining K3</th>
                        <th className="pb-2 pl-2 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                      {listPemeriksaan.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/35 transition-colors">
                          <td className="py-3 pr-2 font-semibold text-white whitespace-nowrap">
                            {new Date(p.tanggal).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-2">
                            {p.berat_kg || p.tinggi_cm ? (
                              <div className="space-y-0.5">
                                <p>
                                  BB: {p.berat_kg || '-'} kg • TB: {p.tinggi_cm || '-'} cm
                                </p>
                                {p.status_gizi && (
                                  <p className="font-bold text-[10px] text-emerald-400 uppercase">
                                    {p.status_gizi}
                                  </p>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-3 px-2">
                            {p.tekanan_sistolik || p.gula_darah ? (
                              <div className="space-y-0.5">
                                {p.tekanan_sistolik && (
                                  <p>
                                    TD: {p.tekanan_sistolik}/{p.tekanan_diastolik} mmHg
                                  </p>
                                )}
                                {p.gula_darah && <p>GDS: {p.gula_darah} mg/dL</p>}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-3 px-2">
                            {p.keluhan_ispa || p.paparan_polutan ? (
                              <div className="text-amber-400 font-medium">
                                {p.keluhan_ispa && <p>• ISPA</p>}
                                {p.paparan_polutan && <p>• Polusi</p>}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-3 pl-2 text-right">
                            <DeletePemeriksaanButton id={p.id} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service History Section */}
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
            <CardHeader className="border-b border-slate-850 pb-4">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <History className="h-5 w-5 text-slate-400" />
                Riwayat Pelayanan SPM
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {listLayanan.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Belum Ada Riwayat Layanan</p>
                    <p className="text-slate-500 text-xs max-w-xs mt-1">
                      Warga ini belum memiliki catatan riwayat pelayanan SPM atau pemeriksaan
                      kesehatan.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-sm font-semibold">
                        <th className="pb-3 pr-4">Tanggal</th>
                        <th className="pb-3 px-4">Bidang</th>
                        <th className="pb-3 px-4">Pelayanan</th>
                        <th className="pb-3 px-4">Rincian Data</th>
                        <th className="pb-3 px-4">Kader</th>
                        <th className="pb-3 pl-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-sm text-slate-300">
                      {listLayanan.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-800/35 transition-colors">
                          <td className="py-4 pr-4 font-semibold text-white">
                            {new Date(l.tanggal_layanan).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-4 px-4 uppercase text-xs font-semibold text-emerald-400">
                            {l.bidang}
                          </td>
                          <td className="py-4 px-4 font-semibold">{l.jenis_layanan}</td>
                          <td className="py-4 px-4 text-xs font-mono text-slate-400 max-w-[200px] truncate">
                            {JSON.stringify(l.detail)}
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-400">
                            {l.kader ? l.kader.nama : '-'}
                          </td>
                          <td className="py-4 pl-4 text-right flex justify-end gap-1.5">
                            <Link href={`/dashboard/layanan/${l.id}/edit`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-amber-400 hover:text-amber-350 hover:bg-amber-500/10 rounded-lg h-8 w-8"
                                title="Ubah Layanan"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </Link>
                            <DeleteLayananButton id={l.id} />
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
      </div>
    </div>
  )
}
