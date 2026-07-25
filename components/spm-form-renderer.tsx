'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { updateLayananSpm } from '@/app/dashboard/layanan/actions'
import { submitAction } from '@/lib/utils/sync-manager'
import { Loader2, Save } from 'lucide-react'

export type BidangSpm =
  'kesehatan' | 'pendidikan' | 'pekerjaan_umum' | 'perumahan_rakyat' | 'trantibumlinmas' | 'sosial'

interface FormFieldConfig {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'checkbox'
  placeholder?: string
  options?: { label: string; value: string }[]
  required?: boolean
}

const spmFieldsConfig: Record<BidangSpm, FormFieldConfig[]> = {
  kesehatan: [
    {
      name: 'tensi_sistolik',
      label: 'Tekanan Darah Sistolik (mmHg)',
      type: 'number',
      placeholder: 'Contoh: 120',
    },
    {
      name: 'tensi_diastolik',
      label: 'Tekanan Darah Diastolik (mmHg)',
      type: 'number',
      placeholder: 'Contoh: 80',
    },
    {
      name: 'gula_darah',
      label: 'Kadar Gula Darah Sewaktu (mg/dL)',
      type: 'number',
      placeholder: 'Contoh: 100',
    },
    {
      name: 'catatan',
      label: 'Catatan Rekam Medis / Keluhan',
      type: 'text',
      placeholder: 'Tulis keluhan atau resep jika ada',
    },
  ],
  pendidikan: [
    {
      name: 'nama_sekolah',
      label: 'Nama Instansi Sekolah / PAUD',
      type: 'text',
      placeholder: 'Nama Sekolah',
      required: true,
    },
    {
      name: 'tingkat_pendidikan',
      label: 'Tingkat Pendidikan',
      type: 'select',
      options: [
        { label: 'PAUD (Pendidikan Anak Usia Dini)', value: 'PAUD' },
        { label: 'SD / MI', value: 'SD' },
        { label: 'SMP / MTs', value: 'SMP' },
        { label: 'SMA / MA / SMK', value: 'SMA' },
      ],
      required: true,
    },
    {
      name: 'status_sekolah',
      label: 'Status Pendidikan Saat Ini',
      type: 'select',
      options: [
        { label: 'Aktif Belajar', value: 'aktif' },
        { label: 'Putus Sekolah', value: 'putus_sekolah' },
        { label: 'Lulus / Tamat', value: 'lulus' },
      ],
      required: true,
    },
  ],
  pekerjaan_umum: [
    {
      name: 'sumber_air',
      label: 'Sumber Air Bersih Utama',
      type: 'select',
      options: [
        { label: 'Perpipaan (PDAM)', value: 'perpipaan' },
        { label: 'Sumur Bor Terlindungi', value: 'sumur_bor' },
        { label: 'Sumur Gali Terbuka', value: 'sumur_gali' },
        { label: 'Mata Air Alami', value: 'mata_air' },
        { label: 'Penampungan Air Hujan', value: 'hujan' },
      ],
      required: true,
    },
    {
      name: 'kondisi_sanitasi',
      label: 'Kondisi Sanitasi / Jamban',
      type: 'select',
      options: [
        { label: 'Sehat & Layak (Sendiri)', value: 'sehat_layak' },
        { label: 'Milik Bersama (Umum)', value: 'bersama' },
        { label: 'Tidak Layak / Cemplung', value: 'tidak_layak' },
      ],
      required: true,
    },
  ],
  perumahan_rakyat: [
    {
      name: 'kelayakan_rumah',
      label: 'Status Kelayakan Tempat Tinggal',
      type: 'select',
      options: [
        { label: 'RLH (Rumah Layak Huni)', value: 'RLH' },
        { label: 'RTLH (Rumah Tidak Layak Huni)', value: 'RTLH' },
      ],
      required: true,
    },
    {
      name: 'luas_lantai_per_kapita',
      label: 'Luas Lantai Per Anggota Keluarga (m²)',
      type: 'number',
      placeholder: 'Contoh: 9',
      required: true,
    },
  ],
  trantibumlinmas: [
    {
      name: 'jenis_kejadian',
      label: 'Jenis Gangguan Keamanan / Kebencanaan',
      type: 'select',
      options: [
        { label: 'Bencana Kebakaran', value: 'kebakaran' },
        { label: 'Bencana Longsor / Banjir', value: 'longsor' },
        { label: 'Kriminalitas / Pencurian', value: 'kriminalitas' },
        { label: 'Gangguan Kebisingan Lingkungan', value: 'kebisingan' },
        { label: 'Penyuluhan Linmas Lingkungan', value: 'penyuluhan' },
        { label: 'Lainnya', value: 'lainnya' },
      ],
      required: true,
    },
    {
      name: 'lokasi_kejadian',
      label: 'Lokasi Spesifik Kejadian',
      type: 'text',
      placeholder: 'Contoh: Blok Depan RW 01',
      required: true,
    },
    {
      name: 'tindakan_diambil',
      label: 'Tindakan / Solusi yang Diberikan',
      type: 'text',
      placeholder: 'Contoh: Koordinasi Damkar / Ronda Malam',
      required: true,
    },
  ],
  sosial: [
    {
      name: 'jenis_bansos',
      label: 'Program Bantuan Sosial yang Diterima',
      type: 'select',
      options: [
        { label: 'PKH (Program Keluarga Harapan)', value: 'PKH' },
        { label: 'BPNT (Bantuan Pangan Non Tunai)', value: 'BPNT' },
        { label: 'BLT Dana Desa', value: 'BLT' },
        { label: 'PBI Jaminan Kesehatan (JKN)', value: 'PBI_JKN' },
        { label: 'Tidak Menerima Bansos', value: 'tidak_menerima' },
        { label: 'Lainnya', value: 'lainnya' },
      ],
      required: true,
    },
    {
      name: 'status_penerima',
      label: 'Status Kepesertaan Bansos',
      type: 'select',
      options: [
        { label: 'Penerima Aktif', value: 'aktif' },
        { label: 'Calon Penerima (Diusulkan)', value: 'calon_penerima' },
        { label: 'Tidak Layak Menerima', value: 'tidak' },
      ],
      required: true,
    },
  ],
}

const spmJenisLayananOptions: Record<BidangSpm, { label: string; value: string }[]> = {
  kesehatan: [
    { label: 'KIA / Pelayanan Balita', value: 'KIA / Balita' },
    { label: 'Pemeriksaan Lansia / PTM', value: 'PTM / Lansia' },
    { label: 'Imunisasi Rutin Lengkap', value: 'Imunisasi Rutin' },
  ],
  pendidikan: [
    { label: 'Pendidikan Anak Usia Dini (PAUD)', value: 'PAUD' },
    { label: 'Wajib Belajar 12 Tahun', value: 'Wajib Belajar 12 Tahun' },
  ],
  pekerjaan_umum: [
    { label: 'Inspeksi Sanitasi Jamban', value: 'Sanitasi Jamban' },
    { label: 'Pemeriksaan Akses Air Bersih', value: 'Air Bersih' },
  ],
  perumahan_rakyat: [
    { label: 'Skrining Kelaikan Rumah (RTLH)', value: 'RTLH' },
    { label: 'Evaluasi Kepadatan Rumah Tinggal', value: 'Kepadatan Hunian' },
  ],
  trantibumlinmas: [
    { label: 'Penanganan Aduan Bencana/Kebakaran', value: 'Kebencanaan' },
    { label: 'Ronda / Keamanan Ketertiban Lingkungan', value: 'Ketertiban Lingkungan' },
  ],
  sosial: [
    { label: 'Skrining Asesmen Disabilitas', value: 'Asesmen Disabilitas' },
    { label: 'Pendataan Jaminan Lansia Rawan', value: 'Jaminan Lansia' },
  ],
}

interface SpmFormRendererProps {
  wargaId: string
  bidang: BidangSpm
  kunjunganId?: string
  existingData?: {
    id: string
    tanggal_layanan: string
    jenis_layanan: string
    kunjungan_id?: string | null
    detail: Record<string, string | number | boolean>
  }
  kunjungans: { id: string; nama: string; tanggal: string }[]
}

export function SpmFormRenderer({
  wargaId,
  bidang,
  kunjunganId = '',
  existingData,
  kunjungans,
}: SpmFormRendererProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!existingData
  const fields = spmFieldsConfig[bidang]
  const jenisOptions = spmJenisLayananOptions[bidang]

  // Form States
  const [jenisLayanan, setJenisLayanan] = useState(
    existingData?.jenis_layanan || (jenisOptions.length > 0 ? jenisOptions[0].value : '')
  )
  const [tanggalLayanan, setTanggalLayanan] = useState(
    existingData?.tanggal_layanan || new Date().toISOString().split('T')[0]
  )
  const [selectedKunjungan, setSelectedKunjungan] = useState(
    existingData?.kunjungan_id || kunjunganId
  )

  // Dynamic fields state
  const [detailData, setDetailData] = useState<Record<string, string | number | boolean>>(() => {
    const initial: Record<string, string | number | boolean> = {}
    fields.forEach((f) => {
      initial[f.name] = existingData?.detail[f.name] ?? (f.type === 'checkbox' ? false : '')
    })
    return initial
  })

  const handleFieldChange = (name: string, value: string | number | boolean) => {
    setDetailData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    // Simple validation check
    for (const f of fields) {
      if (f.required && !detailData[f.name] && detailData[f.name] !== false) {
        setError(`Kolom "${f.label}" wajib diisi!`)
        setSubmitting(false)
        return
      }
    }

    try {
      if (isEditing && existingData) {
        const res = await updateLayananSpm(existingData.id, {
          kunjungan_id: selectedKunjungan || undefined,
          tanggal_layanan: tanggalLayanan,
          jenis_layanan: jenisLayanan,
          detail: detailData,
        })
        if (res.success) {
          router.push(`/dashboard/warga/${wargaId}`)
          router.refresh()
        } else {
          setError(res.error || 'Gagal mengubah layanan.')
        }
      } else {
        const res = await submitAction('create_layanan', {
          warga_id: wargaId,
          kunjungan_id: selectedKunjungan || undefined,
          tanggal_layanan: tanggalLayanan,
          bidang,
          jenis_layanan: jenisLayanan,
          detail: detailData,
        })
        if (res.success) {
          if (res.offline) {
            alert(
              'Data pelayanan SPM disimpan secara offline. Data akan disinkronkan otomatis saat koneksi internet kembali pulih.'
            )
          }
          router.push(`/dashboard/warga/${wargaId}`)
          router.refresh()
        } else {
          setError(res.error || 'Gagal menyimpan layanan.')
        }
      }
    } catch {
      setError('Terjadi kesalahan koneksi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Tanggal Layanan */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Tanggal Pelayanan *</label>
            <Input
              required
              type="date"
              value={tanggalLayanan}
              onChange={(e) => setTanggalLayanan(e.target.value)}
            />
          </div>

          {/* Sesi Kunjungan */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Kaitkan Sesi Kunjungan</label>
            <Select
              value={selectedKunjungan}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedKunjungan(e.target.value)
              }
            >
              <option value="">-- Tidak Terkait Sesi Kunjungan --</option>
              {kunjungans.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama} ({k.tanggal})
                </option>
              ))}
            </Select>
          </div>

          {/* Kategori Jenis Layanan */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-300">Jenis Layanan SPM *</label>
            <Select value={jenisLayanan} onChange={(e) => setJenisLayanan(e.target.value)}>
              {jenisOptions.map((j) => (
                <option key={j.value} value={j.value}>
                  {j.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-slate-800 my-6" />

        {/* Dynamic Fields */}
        <div className="grid gap-6 md:grid-cols-2">
          <h4 className="text-sm font-bold text-emerald-400 md:col-span-2">
            Rincian Formulir: Bidang {bidang.toUpperCase()}
          </h4>

          {fields.map((field) => (
            <div
              key={field.name}
              className={`space-y-2 ${field.type === 'checkbox' ? 'flex items-center pt-8' : ''}`}
            >
              {field.type === 'checkbox' ? (
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!detailData[field.name]}
                    onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                    className="h-5 w-5 rounded border-slate-800 bg-slate-950 text-emerald-500"
                  />
                  <span className="text-sm font-semibold text-slate-300">{field.label}</span>
                </label>
              ) : (
                <>
                  <label className="text-sm font-semibold text-slate-300">
                    {field.label} {field.required ? '*' : ''}
                  </label>
                  {field.type === 'select' ? (
                    <Select
                      required={field.required}
                      value={detailData[field.name] as string}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    >
                      <option value="">Pilih Opsi...</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      required={field.required}
                      type={field.type}
                      value={(detailData[field.name] as string | number) ?? ''}
                      onChange={(e) =>
                        handleFieldChange(
                          field.name,
                          field.type === 'number'
                            ? e.target.value
                              ? Number(e.target.value)
                              : ''
                            : e.target.value
                        )
                      }
                      placeholder={field.placeholder}
                    />
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`/dashboard/warga/${wargaId}`)}
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
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                {isEditing ? 'Simpan Perubahan' : 'Catat Pelayanan'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  )
}
