'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getRumahTanggaList } from '../actions'
import { submitAction } from '@/lib/utils/sync-manager'
import { getWilayahs } from '../../admin/wilayah/actions'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Loader2, UserPlus, Info, CheckCircle2 } from 'lucide-react'

interface RumahTangga {
  id: string
  no_kk: string
  alamat: string
  wilayah_rt?: {
    id: string
    kode: string
    parent?: {
      kode: string
    } | null
  } | null
}

interface WilayahRT {
  id: string
  kode: string
  level: string
  parent_id: string | null
  parent?: {
    kode: string
  } | null
}

export default function BaruWargaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlNik = searchParams.get('nik') || ''

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data lists
  const [households, setHouseholds] = useState<RumahTangga[]>([])
  const [rts, setRts] = useState<WilayahRT[]>([])

  // Form State
  const [formData, setFormData] = useState({
    // Warga
    nik: urlNik,
    nama: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L' as 'L' | 'P',
    golongan_darah: '',
    telepon: '',
    alamat_domisili: '',
    disabilitas: false,
    jenis_disabilitas: '',
    pembawa_kartu: 'belum_punya' as 'KTP' | 'KIA' | 'belum_punya',

    // Rumah Tangga Mode
    mode_rumah_tangga: 'exist' as 'exist' | 'new',
    rumah_tangga_id: '',

    // New Rumah Tangga
    no_kk: '',
    alamat: '',
    wilayah_rt_id: '',
    air_bersih: true,
    jamban_sehat: true,
    dekat_industri: false,

    // PDP Consent
    consent_diberikan: false,
    consent_metode: 'lisan',
    consent_saksi: '',
  })

  useEffect(() => {
    async function loadFormPrerequisites() {
      setLoading(true)
      const supabase = createClient()

      // Fetch current Kader profile to prefill witness and filter RTs by RW
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (user) {
        setFormData((prev) => ({
          ...prev,
          consent_saksi: user.user_metadata?.nama || user.email || '',
        }))

        const kaderRwId = user.app_metadata?.wilayah_id

        // Fetch RTs and households
        const [resHh, resWil] = await Promise.all([getRumahTanggaList(), getWilayahs()])

        if (resHh.success && resHh.data) {
          setHouseholds(resHh.data as unknown as RumahTangga[])
          if (resHh.data.length > 0) {
            setFormData((prev) => ({ ...prev, rumah_tangga_id: resHh.data![0].id }))
          }
        }

        if (resWil.success && resWil.data) {
          // Filter RTs that belong to the Kader's RW
          const allRts = (resWil.data as unknown as WilayahRT[]).filter((w) => w.level === 'rt')
          const filteredRts = kaderRwId ? allRts.filter((rt) => rt.parent_id === kaderRwId) : allRts

          setRts(filteredRts)
          if (filteredRts.length > 0) {
            setFormData((prev) => ({ ...prev, wilayah_rt_id: filteredRts[0].id }))
          }
        }
      }
      setLoading(false)
    }

    loadFormPrerequisites()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.consent_diberikan) {
      setError('Persetujuan PDP (Consent) wajib diberikan untuk melanjutkan pendaftaran warga.')
      return
    }

    setSubmitting(true)
    const res = await submitAction('create_warga', formData)

    if (res.success) {
      if (res.offline) {
        alert(
          'Data pendaftaran warga disimpan secara offline. Data akan disinkronkan otomatis saat koneksi internet kembali pulih.'
        )
        router.push('/dashboard/warga')
      } else if (res.data) {
        const wargaData = res.data as { id: string }
        router.push(`/dashboard/warga/${wargaData.id}`)
      }
      router.refresh()
    } else {
      setError(res.error || 'Gagal mendaftarkan warga.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
        <p className="text-slate-400 text-sm">Menyiapkan formulir pendaftaran...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Daftarkan Warga Baru</h2>
        <p className="text-slate-400 text-sm">
          Pendaftaran identitas warga terintegrasi KK, data kesehatan dasar, dan persetujuan PDP.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Identitas Warga */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardHeader className="border-b border-slate-850">
            <CardTitle className="text-lg font-bold text-white">1. Biodata Warga</CardTitle>
            <CardDescription className="text-slate-400">
              Data NIK terverifikasi dengan profil umur/kategori.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">
                Nomor Induk Kependudukan (NIK) *
              </label>
              <Input
                required
                maxLength={16}
                value={formData.nik}
                onChange={(e) =>
                  setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })
                }
                placeholder="16 Digit NIK KTP/KIA"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">
                Nama Lengkap (Sesuai KTP/KIA) *
              </label>
              <Input
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Nama Lengkap Warga"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Tempat Lahir</label>
              <Input
                value={formData.tempat_lahir}
                onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                placeholder="Kota/Kabupaten Tempat Lahir"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Tanggal Lahir *</label>
              <Input
                required
                type="date"
                value={formData.tanggal_lahir}
                onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Jenis Kelamin *</label>
              <Select
                required
                value={formData.jenis_kelamin}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, jenis_kelamin: e.target.value as 'L' | 'P' })
                }
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Golongan Darah</label>
              <Select
                value={formData.golongan_darah}
                onChange={(e) => setFormData({ ...formData, golongan_darah: e.target.value })}
              >
                <option value="">Tidak Tahu / Belum Cek</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">No. Telepon / HP</label>
              <Input
                type="tel"
                value={formData.telepon}
                onChange={(e) =>
                  setFormData({ ...formData, telepon: e.target.value.replace(/\D/g, '') })
                }
                placeholder="Contoh: 081234567890"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">
                Pembawa Kartu Identitas *
              </label>
              <Select
                required
                value={formData.pembawa_kartu}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFormData({
                    ...formData,
                    pembawa_kartu: e.target.value as 'KTP' | 'KIA' | 'belum_punya',
                  })
                }
              >
                <option value="belum_punya">Belum Memiliki Kartu</option>
                <option value="KTP">KTP (Kartu Tanda Penduduk)</option>
                <option value="KIA">KIA (Kartu Identitas Anak)</option>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-300">Alamat Domisili Warga</label>
              <Input
                value={formData.alamat_domisili}
                onChange={(e) => setFormData({ ...formData, alamat_domisili: e.target.value })}
                placeholder="Tulis jika alamat tinggal berbeda dengan alamat KK"
              />
            </div>

            <div className="space-y-2 flex items-center pt-8">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.disabilitas}
                  onChange={(e) => setFormData({ ...formData, disabilitas: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm font-semibold text-slate-300">
                  Warga Penyandang Disabilitas
                </span>
              </label>
            </div>

            {formData.disabilitas && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <label className="text-sm font-semibold text-slate-300">Jenis Disabilitas *</label>
                <Input
                  required
                  value={formData.jenis_disabilitas}
                  onChange={(e) => setFormData({ ...formData, jenis_disabilitas: e.target.value })}
                  placeholder="Contoh: Tunawicara, Tuna Daksa, dll."
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Rumah Tangga / KK */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardHeader className="border-b border-slate-850">
            <CardTitle className="text-lg font-bold text-white">2. Hubungan Rumah Tangga</CardTitle>
            <CardDescription className="text-slate-400">
              Kaitkan warga dengan nomor Kartu Keluarga (KK).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 border-b border-slate-800 pb-4">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="mode_rumah_tangga"
                  value="exist"
                  checked={formData.mode_rumah_tangga === 'exist'}
                  onChange={() => setFormData({ ...formData, mode_rumah_tangga: 'exist' })}
                  className="h-4 w-4 border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm font-semibold text-slate-300">
                  Pilih Kartu Keluarga (KK) Yang Sudah Ada
                </span>
              </label>
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="mode_rumah_tangga"
                  value="new"
                  checked={formData.mode_rumah_tangga === 'new'}
                  onChange={() => setFormData({ ...formData, mode_rumah_tangga: 'new' })}
                  className="h-4 w-4 border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm font-semibold text-slate-300">
                  Daftarkan KK Baru (Inline)
                </span>
              </label>
            </div>

            {formData.mode_rumah_tangga === 'exist' ? (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">
                  Pilih Nomor KK & Alamat *
                </label>
                {households.length === 0 ? (
                  <p className="text-slate-500 text-sm">
                    Belum ada Kartu Keluarga terdaftar. Silakan pilih &quot;Daftarkan KK Baru&quot;.
                  </p>
                ) : (
                  <Select
                    value={formData.rumah_tangga_id}
                    onChange={(e) => setFormData({ ...formData, rumah_tangga_id: e.target.value })}
                  >
                    {households.map((h) => (
                      <option key={h.id} value={h.id}>
                        KK: {h.no_kk} - {h.alamat}{' '}
                        {h.wilayah_rt
                          ? `(RT ${h.wilayah_rt.kode}/RW ${h.wilayah_rt.parent?.kode || ''})`
                          : ''}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Nomor Kartu Keluarga (KK) *
                  </label>
                  <Input
                    required
                    maxLength={16}
                    value={formData.no_kk}
                    onChange={(e) =>
                      setFormData({ ...formData, no_kk: e.target.value.replace(/\D/g, '') })
                    }
                    placeholder="16 Digit Nomor KK"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Alamat Lengkap KK *
                  </label>
                  <Input
                    required
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    placeholder="Dusun/Jalan, Nomor Rumah"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Rukun Tetangga (RT) Domisili *
                  </label>
                  {rts.length === 0 ? (
                    <p className="text-rose-400 text-xs">
                      Tidak ada wilayah RT terdaftar di bawah RW Anda. Silakan hubungi Admin LKD.
                    </p>
                  ) : (
                    <Select
                      value={formData.wilayah_rt_id}
                      onChange={(e) => setFormData({ ...formData, wilayah_rt_id: e.target.value })}
                    >
                      {rts.map((rt) => (
                        <option key={rt.id} value={rt.id}>
                          RT {rt.kode} {rt.parent ? `/ RW ${rt.parent.kode}` : ''}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 pt-6 md:col-span-2">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.air_bersih}
                      onChange={(e) => setFormData({ ...formData, air_bersih: e.target.checked })}
                      className="h-5 w-5 rounded border-slate-800 bg-slate-950 text-emerald-500"
                    />
                    <span className="text-xs font-semibold text-slate-300">
                      Akses Air Bersih Layak
                    </span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.jamban_sehat}
                      onChange={(e) => setFormData({ ...formData, jamban_sehat: e.target.checked })}
                      className="h-5 w-5 rounded border-slate-800 bg-slate-950 text-emerald-500"
                    />
                    <span className="text-xs font-semibold text-slate-300">Akses Jamban Sehat</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.dekat_industri}
                      onChange={(e) =>
                        setFormData({ ...formData, dekat_industri: e.target.checked })
                      }
                      className="h-5 w-5 rounded border-slate-800 bg-slate-950 text-emerald-500"
                    />
                    <span className="text-xs font-semibold text-slate-300">
                      Dekat Zona Industri
                    </span>
                  </label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: PDP Consent */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl border-emerald-500/20">
          <CardHeader className="border-b border-slate-850">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              3. Pernyataan Persetujuan PDP (Data Consent)
            </CardTitle>
            <CardDescription className="text-slate-400">
              Pernyataan perlindungan privasi data warga sesuai regulasi UU PDP No. 27/2022.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="rounded-2xl bg-emerald-500/5 p-4 border border-emerald-500/10 flex items-start gap-3">
              <Info className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-400 leading-relaxed">
                Sebelum merekam informasi pribadi, Anda wajib menjelaskan kepada warga bahwa data
                NIK, biodata, dan rekam medis posyandu disimpan secara terenkripsi dan hanya
                digunakan untuk keperluan pelayanan 6 Standar Pelayanan Minimal (SPM) Desa
                Lemahduwur.
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  required
                  type="checkbox"
                  checked={formData.consent_diberikan}
                  onChange={(e) =>
                    setFormData({ ...formData, consent_diberikan: e.target.checked })
                  }
                  className="h-6 w-6 mt-0.5 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm font-semibold text-slate-300 leading-relaxed">
                  Saya mengonfirmasi bahwa warga yang bersangkutan secara sadar memberikan
                  persetujuan (consent) untuk perekaman dan pemrosesan data pribadinya di dalam
                  aplikasi Posyandu 6SPM ini. *
                </span>
              </label>

              <div className="grid gap-6 md:grid-cols-2 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Metode Persetujuan *
                  </label>
                  <Select
                    value={formData.consent_metode}
                    onChange={(e) => setFormData({ ...formData, consent_metode: e.target.value })}
                  >
                    <option value="lisan">Pernyataan Lisan</option>
                    <option value="tertulis">Tanda Tangan Formulir Fisik</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Kader Saksi / Verifikator *
                  </label>
                  <Input
                    required
                    value={formData.consent_saksi}
                    onChange={(e) => setFormData({ ...formData, consent_saksi: e.target.value })}
                    placeholder="Nama Lengkap Kader Saksi"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Bar */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/dashboard/warga')}
            className="text-slate-400 hover:text-white rounded-xl"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl active:scale-95 transition flex items-center gap-1.5 px-6"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Mendaftarkan...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Selesaikan Pendaftaran
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
