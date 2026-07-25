'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createRujukanTiket } from '@/app/dashboard/kesehatan/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Loader2, Ticket, X } from 'lucide-react'

interface BuatRujukanDialogProps {
  wargaId: string
  wargaNama: string
  defaultJenis: string
  defaultDeskripsi: string
}

export function BuatRujukanDialog({
  wargaId,
  wargaNama,
  defaultJenis,
  defaultDeskripsi,
}: BuatRujukanDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [bidang, setBidang] = useState<
    | 'kesehatan'
    | 'pendidikan'
    | 'pekerjaan_umum'
    | 'perumahan_rakyat'
    | 'trantibumlinmas'
    | 'sosial'
  >('kesehatan')
  const [jenisPermohonan, setJenisPermohonan] = useState(defaultJenis)
  const [deskripsi, setDeskripsi] = useState(defaultDeskripsi)
  const [prioritas, setPrioritas] = useState<'rendah' | 'sedang' | 'tinggi'>('tinggi')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await createRujukanTiket({
      warga_id: wargaId,
      bidang,
      jenis_permohonan: jenisPermohonan,
      deskripsi,
      prioritas,
    })

    if (res.success) {
      alert(`Sukses membuat rujukan! Nomor Tiket: ${res.data.nomor_tiket}`)
      setIsOpen(false)
      router.refresh()
    } else {
      setError(res.error || 'Gagal membuat rujukan.')
    }
    setLoading(false)
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs py-1 h-8 flex items-center gap-1 shadow-md active:scale-95 transition"
      >
        <Ticket className="h-3.5 w-3.5" /> Buat Rujukan
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-800 p-4">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <Ticket className="h-5 w-5 text-emerald-400" />
                Buat Rujukan Warga: {wargaNama}
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 text-left">
              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Bidang Pelayanan SPM</label>
                <Select
                  value={bidang}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setBidang(
                      e.target.value as
                        | 'kesehatan'
                        | 'pendidikan'
                        | 'pekerjaan_umum'
                        | 'perumahan_rakyat'
                        | 'trantibumlinmas'
                        | 'sosial'
                    )
                  }
                >
                  <option value="kesehatan">Kesehatan</option>
                  <option value="perumahan_rakyat">Perumahan Rakyat (RTLH)</option>
                  <option value="sosial">Sosial (Bansos/Disabilitas)</option>
                  <option value="pekerjaan_umum">Pekerjaan Umum</option>
                  <option value="pendidikan">Pendidikan</option>
                  <option value="trantibumlinmas">Trantibumlinmas</option>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">
                  Jenis Permohonan / Rujukan
                </label>
                <Input
                  required
                  value={jenisPermohonan}
                  onChange={(e) => setJenisPermohonan(e.target.value)}
                  placeholder="Contoh: Rujukan Stunting"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">
                  Deskripsi Kasus & Tindak Lanjut
                </label>
                <textarea
                  required
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                  placeholder="Tulis deskripsi rekomendasi bidan desa..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Prioritas Rujukan</label>
                <Select
                  value={prioritas}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setPrioritas(e.target.value as 'rendah' | 'sedang' | 'tinggi')
                  }
                >
                  <option value="tinggi">Tinggi (SLA Mendesak)</option>
                  <option value="sedang">Sedang</option>
                  <option value="rendah">Rendah</option>
                </Select>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white rounded-xl text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs active:scale-95 transition flex items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Membuat...
                    </>
                  ) : (
                    'Kirim Rujukan'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
