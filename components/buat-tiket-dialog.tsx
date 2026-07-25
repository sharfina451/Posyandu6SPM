'use client'

import React, { useState, useEffect } from 'react'
import { createTiket } from '@/app/dashboard/tiket/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Loader2, Ticket, X, Search, Check } from 'lucide-react'

interface WargaSimple {
  id: string
  nama: string
  nik: string
}

interface BuatTiketDialogProps {
  isOpen: boolean
  onClose: () => void
  wargaList: WargaSimple[]
  onSuccess: () => void
}

export function BuatTiketDialog({ isOpen, onClose, wargaList, onSuccess }: BuatTiketDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [wargaSearch, setWargaSearch] = useState('')
  const [selectedWarga, setSelectedWarga] = useState<WargaSimple | null>(null)
  const [showWargaDropdown, setShowWargaDropdown] = useState(false)

  const [bidang, setBidang] = useState<
    | 'pendidikan'
    | 'kesehatan'
    | 'pekerjaan_umum'
    | 'perumahan_rakyat'
    | 'trantibumlinmas'
    | 'sosial'
  >('kesehatan')
  const [jenisPermohonan, setJenisPermohonan] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [prioritas, setPrioritas] = useState<'rendah' | 'sedang' | 'tinggi' | 'darurat'>('sedang')
  const [rahasia, setRahasia] = useState(false)

  // Reset form when opened/closed
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setSelectedWarga(null)
      setWargaSearch('')
      setBidang('kesehatan')
      setJenisPermohonan('')
      setDeskripsi('')
      setPrioritas('sedang')
      setRahasia(false)
    }
  }, [isOpen])

  // Filter warga list based on search
  const filteredWarga = wargaList
    .filter(
      (w) => w.nama.toLowerCase().includes(wargaSearch.toLowerCase()) || w.nik.includes(wargaSearch)
    )
    .slice(0, 5) // Limit to top 5 results

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedWarga) {
      setError('Warga wajib dipilih.')
      return
    }

    setLoading(true)

    const res = await createTiket({
      warga_id: selectedWarga.id,
      bidang,
      jenis_permohonan: jenisPermohonan,
      deskripsi,
      prioritas,
      rahasia,
    })

    if (res.success) {
      alert(`Sukses membuat tiket baru! Nomor Tiket: ${res.data.nomor_tiket}`)
      onSuccess()
    } else {
      setError(res.error || 'Gagal membuat tiket.')
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-800 p-4">
          <h3 className="text-md font-bold text-white flex items-center gap-2">
            <Ticket className="h-5 w-5 text-emerald-400" />
            Buat Rujukan / Tiket Baru
          </h3>
          <button
            type="button"
            onClick={onClose}
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

          {/* Warga Search/Autocomplete */}
          <div className="space-y-1 relative">
            <label className="text-xs font-semibold text-slate-400">
              Warga Pemohon / Penerima Layanan
            </label>
            {selectedWarga ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white">
                <div>
                  <span className="font-bold">{selectedWarga.nama}</span>
                  <span className="text-xs text-slate-400 font-mono ml-2">
                    ({selectedWarga.nik})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedWarga(null)}
                  className="text-rose-400 hover:text-rose-300 text-xs font-semibold"
                >
                  Ubah
                </button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <Input
                    value={wargaSearch}
                    onChange={(e) => {
                      setWargaSearch(e.target.value)
                      setShowWargaDropdown(true)
                    }}
                    onFocus={() => setShowWargaDropdown(true)}
                    placeholder="Ketik nama atau NIK warga..."
                    className="pl-9 rounded-xl"
                  />
                </div>

                {showWargaDropdown && wargaSearch.trim() !== '' && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto">
                    {filteredWarga.length === 0 ? (
                      <div className="p-3 text-xs text-slate-500 text-center">
                        Warga tidak ditemukan
                      </div>
                    ) : (
                      filteredWarga.map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => {
                            setSelectedWarga(w)
                            setShowWargaDropdown(false)
                          }}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-900 transition border-b border-slate-900 last:border-0"
                        >
                          <div>
                            <div className="text-sm font-bold text-white">{w.nama}</div>
                            <div className="text-xs text-slate-400 font-mono">{w.nik}</div>
                          </div>
                          <Check className="h-4 w-4 text-emerald-400 opacity-0 hover:opacity-100" />
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bidang Select */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Bidang SPM</label>
            <Select
              value={bidang}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const val = e.target.value as
                  | 'pendidikan'
                  | 'kesehatan'
                  | 'pekerjaan_umum'
                  | 'perumahan_rakyat'
                  | 'trantibumlinmas'
                  | 'sosial'
                setBidang(val)
                // Auto check rahasia for trantibumlinmas
                if (val === 'trantibumlinmas') {
                  setRahasia(true)
                } else {
                  setRahasia(false)
                }
              }}
            >
              <option value="kesehatan">Kesehatan</option>
              <option value="pendidikan">Pendidikan</option>
              <option value="pekerjaan_umum">Pekerjaan Umum</option>
              <option value="perumahan_rakyat">Perumahan Rakyat (RTLH)</option>
              <option value="trantibumlinmas">Trantibumlinmas (Ketertiban Umum)</option>
              <option value="sosial">Sosial (Bansos)</option>
            </Select>
          </div>

          {/* Jenis Permohonan */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">
              Jenis Permohonan / Usulan
            </label>
            <Input
              required
              value={jenisPermohonan}
              onChange={(e) => setJenisPermohonan(e.target.value)}
              placeholder="Contoh: Rehab RTLH, Rujukan Stunting, Usulan DTKS"
              className="rounded-xl"
            />
          </div>

          {/* Deskripsi */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">
              Deskripsi Masalah / Rekomendasi
            </label>
            <textarea
              required
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
              placeholder="Tulis kronologi keluhan warga atau hasil verifikasi lapangan..."
            />
          </div>

          {/* Prioritas & Rahasia */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Prioritas</label>
              <Select
                value={prioritas}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setPrioritas(e.target.value as 'rendah' | 'sedang' | 'tinggi' | 'darurat')
                }
              >
                <option value="rendah">Rendah</option>
                <option value="sedang">Sedang</option>
                <option value="tinggi">Tinggi</option>
                <option value="darurat">Darurat</option>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="checkbox-rahasia"
                checked={rahasia}
                onChange={(e) => setRahasia(e.target.checked)}
                className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
              />
              <label
                htmlFor="checkbox-rahasia"
                className="text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Laporan Rahasia (Privat)
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/50">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
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
                'Buat Tiket'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
