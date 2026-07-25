'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getWargas } from '../../warga/actions'
import { submitAction } from '@/lib/utils/sync-manager'
import { hitungStatusGizi } from '@/lib/utils/status-gizi'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Loader2, Heart, Save, ShieldAlert, ArrowLeft, Activity } from 'lucide-react'

interface Warga {
  id: string
  nik: string
  nama: string
  tanggal_lahir: string
  jenis_kelamin: 'L' | 'P'
  disabilitas: boolean
  rumah_tangga?: {
    id: string
    no_kk: string
    alamat: string
    dekat_industri: boolean
  } | null
}

export default function BaruPemeriksaanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlWargaId = searchParams.get('warga_id') || ''

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data lists
  const [wargas, setWargas] = useState<Warga[]>([])
  const [selectedWarga, setSelectedWarga] = useState<Warga | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    warga_id: urlWargaId,
    tanggal: new Date().toISOString().split('T')[0],
    berat_kg: '',
    tinggi_cm: '',
    lingkar_kepala_cm: '',
    lila_cm: '',
    tekanan_sistolik: '',
    tekanan_diastolik: '',
    gula_darah: '',
    keluhan_ispa: false,
    paparan_polutan: false,
    catatan: '',
  })

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const res = await getWargas()
      if (res.success && res.data) {
        const list = res.data as Warga[]
        setWargas(list)

        // Handle prefilled warga from URL query
        if (urlWargaId) {
          const prefilled = list.find((w) => w.id === urlWargaId)
          if (prefilled) {
            setSelectedWarga(prefilled)
          }
        } else if (list.length > 0) {
          setSelectedWarga(list[0])
          setFormData((prev) => ({ ...prev, warga_id: list[0].id }))
        }
      }
      setLoading(false)
    }
    loadData()
  }, [urlWargaId])

  const handleWargaChange = (id: string) => {
    const matched = wargas.find((w) => w.id === id) || null
    setSelectedWarga(matched)
    setFormData((prev) => ({ ...prev, warga_id: id }))
  }

  // Calculate age of selected warga
  const getAgeMonths = () => {
    if (!selectedWarga) return 0
    const birthDate = new Date(selectedWarga.tanggal_lahir)
    const today = new Date()
    let ageMonths = (today.getFullYear() - birthDate.getFullYear()) * 12
    ageMonths += today.getMonth() - birthDate.getMonth()
    if (today.getDate() < birthDate.getDate()) {
      ageMonths--
    }
    return ageMonths
  }

  const ageMonths = selectedWarga ? getAgeMonths() : 0
  const isBalita = ageMonths >= 0 && ageMonths <= 60
  const isDekatIndustri = !!selectedWarga?.rumah_tangga?.dekat_industri

  // Calculate status gizi live on client side
  const getLiveStatusGizi = () => {
    if (!isBalita || !formData.berat_kg || !formData.tinggi_cm || !selectedWarga) return null
    return hitungStatusGizi(
      selectedWarga.tanggal_lahir,
      selectedWarga.jenis_kelamin,
      Number(formData.berat_kg),
      Number(formData.tinggi_cm)
    )
  }

  const liveStatusGizi = getLiveStatusGizi()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    // Prepare numerical values
    const payload = {
      warga_id: formData.warga_id,
      tanggal: formData.tanggal,
      berat_kg: formData.berat_kg ? Number(formData.berat_kg) : null,
      tinggi_cm: formData.tinggi_cm ? Number(formData.tinggi_cm) : null,
      lingkar_kepala_cm: formData.lingkar_kepala_cm ? Number(formData.lingkar_kepala_cm) : null,
      lila_cm: formData.lila_cm ? Number(formData.lila_cm) : null,
      tekanan_sistolik: formData.tekanan_sistolik ? Number(formData.tekanan_sistolik) : null,
      tekanan_diastolik: formData.tekanan_diastolik ? Number(formData.tekanan_diastolik) : null,
      gula_darah: formData.gula_darah ? Number(formData.gula_darah) : null,
      keluhan_ispa: formData.keluhan_ispa,
      paparan_polutan: formData.paparan_polutan,
      catatan: formData.catatan,
    }

    const res = await submitAction('create_pemeriksaan', payload)
    if (res.success) {
      if (res.offline) {
        alert(
          'Data pemeriksaan kesehatan disimpan secara offline. Data akan disinkronkan otomatis saat koneksi internet kembali pulih.'
        )
      }
      router.push('/dashboard/kesehatan')
      router.refresh()
    } else {
      setError(res.error || 'Gagal menyimpan pemeriksaan.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
        <p className="text-slate-400 text-sm">Menyiapkan formulir pemeriksaan...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-slate-400 hover:text-white rounded-xl flex items-center gap-1.5"
        >
          <ArrowLeft className="h-5 w-5" /> Batal & Kembali
        </Button>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          Catat Pemeriksaan Kesehatan Baru
        </h2>
        <p className="text-slate-400 text-sm">
          Pencatatan antropometri (KMS), tekanan darah, gula darah, dan pemeriksaan ISPA wilayah
          industri.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Warga Selection */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardContent className="p-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Pilih Warga *</label>
              <Select value={formData.warga_id} onChange={(e) => handleWargaChange(e.target.value)}>
                <option value="">-- Pilih Warga Penerima Layanan --</option>
                {wargas.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nama} (NIK: {w.nik})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Tanggal Pemeriksaan *</label>
              <Input
                required
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {selectedWarga && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Dynamic Section: Balita Antropometri (KMS) */}
            {isBalita ? (
              <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl border-emerald-500/20">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Heart className="h-5 w-5 text-emerald-400" />
                    Pemeriksaan Antropometri Balita (KMS)
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Pengukuran tumbuh kembang fisik balita (0-60 bulan) terverifikasi standar WHO.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">
                      Berat Badan (kg) *
                    </label>
                    <Input
                      required
                      type="number"
                      step="0.01"
                      value={formData.berat_kg}
                      onChange={(e) => setFormData({ ...formData, berat_kg: e.target.value })}
                      placeholder="Contoh: 12.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">
                      Tinggi / Panjang Badan (cm) *
                    </label>
                    <Input
                      required
                      type="number"
                      step="0.1"
                      value={formData.tinggi_cm}
                      onChange={(e) => setFormData({ ...formData, tinggi_cm: e.target.value })}
                      placeholder="Contoh: 85.0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">
                      Lingkar Kepala (cm)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.lingkar_kepala_cm}
                      onChange={(e) =>
                        setFormData({ ...formData, lingkar_kepala_cm: e.target.value })
                      }
                      placeholder="Contoh: 45.2"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">
                      Lingkar Lengan Atas (LiLA - cm)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.lila_cm}
                      onChange={(e) => setFormData({ ...formData, lila_cm: e.target.value })}
                      placeholder="Contoh: 14.5"
                    />
                  </div>

                  {liveStatusGizi && (
                    <div className="md:col-span-2 rounded-2xl bg-emerald-500/5 p-4 border border-emerald-500/20 flex flex-col justify-center items-start gap-1">
                      <span className="text-xs text-slate-400">
                        Klasifikasi Status Gizi Real-time:
                      </span>
                      <span className="text-lg font-extrabold text-emerald-400 uppercase tracking-wide">
                        {liveStatusGizi}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Dynamic Section: Dewasa/Lansia (PTM Skrining) */
              <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl border-blue-500/20">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-400" />
                    Skrining Penyakit Tidak Menular (PTM) & Lansia
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Pengukuran tekanan darah dan kadar gula darah sewaktu.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">
                      Tekanan Sistolik (mmHg)
                    </label>
                    <Input
                      type="number"
                      value={formData.tekanan_sistolik}
                      onChange={(e) =>
                        setFormData({ ...formData, tekanan_sistolik: e.target.value })
                      }
                      placeholder="Contoh: 120"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">
                      Tekanan Diastolik (mmHg)
                    </label>
                    <Input
                      type="number"
                      value={formData.tekanan_diastolik}
                      onChange={(e) =>
                        setFormData({ ...formData, tekanan_diastolik: e.target.value })
                      }
                      placeholder="Contoh: 80"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">
                      Gula Darah Sewaktu (mg/dL)
                    </label>
                    <Input
                      type="number"
                      value={formData.gula_darah}
                      onChange={(e) => setFormData({ ...formData, gula_darah: e.target.value })}
                      placeholder="Contoh: 110"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dynamic Section: K3 Lingkungan Industri (T-E5.5) */}
            {isDekatIndustri && (
              <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl border-amber-500/20">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-amber-400" />
                    Skrining Kesehatan Kerja (K3) & Lingkungan
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Wajib bagi warga di kawasan pemukiman padat industri (Desa Lemahduwur).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.keluhan_ispa}
                      onChange={(e) => setFormData({ ...formData, keluhan_ispa: e.target.checked })}
                      className="h-6 w-6 mt-0.5 rounded border-slate-800 bg-slate-950 text-emerald-500"
                    />
                    <span className="text-sm font-semibold text-slate-300 leading-relaxed">
                      Mengalami gejala Infeksi Saluran Pernapasan Akut (ISPA) seperti
                      batuk/pilek/sesak dalam 2 minggu terakhir.
                    </span>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.paparan_polutan}
                      onChange={(e) =>
                        setFormData({ ...formData, paparan_polutan: e.target.checked })
                      }
                      className="h-6 w-6 mt-0.5 rounded border-slate-800 bg-slate-950 text-emerald-500"
                    />
                    <span className="text-sm font-semibold text-slate-300 leading-relaxed">
                      Terpapar secara langsung polusi udara konveksi logam/debu industri logam di
                      lingkungan rumah tinggal.
                    </span>
                  </label>
                </CardContent>
              </Card>
            )}

            {/* Catatan Tambahan */}
            <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Catatan Rekam Medis / Pemeriksaan Fisik
                  </label>
                  <Input
                    value={formData.catatan}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    placeholder="Tulis keluhan, diagnosis, rujukan, dll."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/dashboard/kesehatan')}
            className="text-slate-400 hover:text-white rounded-xl"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={submitting || !selectedWarga}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl active:scale-95 transition flex items-center gap-1.5 px-6"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Simpan Pemeriksaan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
