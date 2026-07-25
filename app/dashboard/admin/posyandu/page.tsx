'use client'

import React, { useEffect, useState } from 'react'
import { getPosyandus, createPosyandu, updatePosyandu, deletePosyandu } from './actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Loader2, Plus, Edit2, Trash2, X, Building2 } from 'lucide-react'

interface Posyandu {
  id: string
  nama: string
  nomor_registrasi: string | null
  status_registrasi: 'draf' | 'diajukan' | 'terdaftar' | 'dikembalikan'
  desa: string
  kecamatan: string
  kabupaten: string
  no_sk_pengurus: string | null
  tanggal_terdaftar: string | null
}

export default function AdminPosyanduPage() {
  const [posyandus, setPosyandus] = useState<Posyandu[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nama: '',
    nomor_registrasi: '',
    desa: 'Lemahduwur',
    kecamatan: 'Adiwerna',
    kabupaten: 'Tegal',
    no_sk_pengurus: '',
    tanggal_terdaftar: '',
    status_registrasi: 'draf' as 'draf' | 'diajukan' | 'terdaftar' | 'dikembalikan',
  })

  // Open/Close Modal or Form state
  const [formOpen, setFormOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const res = await getPosyandus()
    if (res.success && res.data) {
      setPosyandus(res.data as Posyandu[])
    } else {
      setError(res.error || 'Gagal memuat data Posyandu')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (isEditing && editingId) {
        const res = await updatePosyandu(editingId, formData)
        if (res.success) {
          setIsEditing(false)
          setEditingId(null)
          setFormOpen(false)
          resetForm()
          loadData()
        } else {
          setError(res.error || 'Gagal memperbarui Posyandu')
        }
      } else {
        const res = await createPosyandu(formData)
        if (res.success) {
          setFormOpen(false)
          resetForm()
          loadData()
        } else {
          setError(res.error || 'Gagal membuat Posyandu')
        }
      }
    } catch {
      setError('Terjadi kesalahan koneksi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (pos: Posyandu) => {
    setFormData({
      nama: pos.nama,
      nomor_registrasi: pos.nomor_registrasi || '',
      desa: pos.desa,
      kecamatan: pos.kecamatan,
      kabupaten: pos.kabupaten,
      no_sk_pengurus: pos.no_sk_pengurus || '',
      tanggal_terdaftar: pos.tanggal_terdaftar || '',
      status_registrasi: pos.status_registrasi,
    })
    setEditingId(pos.id)
    setIsEditing(true)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data Posyandu ini?')) return

    const res = await deletePosyandu(id)
    if (res.success) {
      loadData()
    } else {
      alert(res.error || 'Gagal menghapus data Posyandu')
    }
  }

  const resetForm = () => {
    setFormData({
      nama: '',
      nomor_registrasi: '',
      desa: 'Lemahduwur',
      kecamatan: 'Adiwerna',
      kabupaten: 'Tegal',
      no_sk_pengurus: '',
      tanggal_terdaftar: '',
      status_registrasi: 'draf',
    })
    setIsEditing(false)
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Kelola Posyandu</h2>
          <p className="text-slate-400 text-sm">
            Manajemen entitas Posyandu dan status registrasi LKD tingkat Desa.
          </p>
        </div>
        {!formOpen && (
          <Button
            onClick={() => {
              resetForm()
              setFormOpen(true)
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-2 rounded-xl active:scale-95 transition"
          >
            <Plus className="h-5 w-5" /> Tambah Posyandu
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Form Card (Open on Add or Edit) */}
      {formOpen && (
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-850">
            <div>
              <CardTitle className="text-lg font-bold text-white">
                {isEditing ? 'Edit Data Posyandu' : 'Registrasi Posyandu Baru'}
              </CardTitle>
              <CardDescription className="text-slate-400">
                Lengkapi formulir di bawah ini dengan lengkap.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setFormOpen(false)
                resetForm()
              }}
              className="text-slate-400 hover:text-white rounded-xl"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Nama Posyandu *</label>
                  <Input
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Posyandu Mawar I"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Nomor Registrasi</label>
                  <Input
                    value={formData.nomor_registrasi}
                    onChange={(e) => setFormData({ ...formData, nomor_registrasi: e.target.value })}
                    placeholder="Contoh: 11.01.10.2001.001"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Desa/Kelurahan *</label>
                  <Input
                    required
                    value={formData.desa}
                    onChange={(e) => setFormData({ ...formData, desa: e.target.value })}
                    placeholder="Lemahduwur"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Kecamatan *</label>
                  <Input
                    required
                    value={formData.kecamatan}
                    onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                    placeholder="Adiwerna"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Kabupaten/Kota *</label>
                  <Input
                    required
                    value={formData.kabupaten}
                    onChange={(e) => setFormData({ ...formData, kabupaten: e.target.value })}
                    placeholder="Tegal"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Nomor SK Pengurus LKD
                  </label>
                  <Input
                    value={formData.no_sk_pengurus}
                    onChange={(e) => setFormData({ ...formData, no_sk_pengurus: e.target.value })}
                    placeholder="Contoh: SK-12/PEM/2026"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Tanggal Terdaftar</label>
                  <Input
                    type="date"
                    value={formData.tanggal_terdaftar}
                    onChange={(e) =>
                      setFormData({ ...formData, tanggal_terdaftar: e.target.value })
                    }
                  />
                </div>

                {isEditing && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">
                      Status Registrasi
                    </label>
                    <Select
                      value={formData.status_registrasi}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setFormData({
                          ...formData,
                          status_registrasi: e.target.value as
                            'draf' | 'diajukan' | 'terdaftar' | 'dikembalikan',
                        })
                      }
                    >
                      <option value="draf">Draf</option>
                      <option value="diajukan">Diajukan</option>
                      <option value="terdaftar">Terdaftar</option>
                      <option value="dikembalikan">Dikembalikan</option>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setFormOpen(false)
                    resetForm()
                  }}
                  className="text-slate-400 hover:text-white rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl active:scale-95 transition"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : isEditing ? (
                    'Perbarui Data'
                  ) : (
                    'Simpan Registrasi'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List Card */}
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
              <p className="text-slate-400 text-sm">Memuat data Posyandu...</p>
            </div>
          ) : posyandus.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-white font-bold text-base">Belum Ada Posyandu Terdaftar</p>
                <p className="text-slate-500 text-sm max-w-sm mt-1">
                  Mulai dengan mendaftarkan Posyandu LKD baru di Desa Lemahduwur.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm font-semibold">
                    <th className="pb-3 pr-4">Nama Posyandu</th>
                    <th className="pb-3 px-4">No. Registrasi</th>
                    <th className="pb-3 px-4">Lokasi Wilayah</th>
                    <th className="pb-3 px-4">No. SK Pengurus</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 pl-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-sm text-slate-300">
                  {posyandus.map((pos) => (
                    <tr key={pos.id} className="hover:bg-slate-800/35 transition-colors">
                      <td className="py-4 pr-4 font-bold text-white flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-500" />
                        {pos.nama}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-400">
                        {pos.nomor_registrasi || '-'}
                      </td>
                      <td className="py-4 px-4">
                        Desa {pos.desa}, Kec. {pos.kecamatan}, {pos.kabupaten}
                      </td>
                      <td className="py-4 px-4 text-slate-400">{pos.no_sk_pengurus || '-'}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            pos.status_registrasi === 'terdaftar'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : pos.status_registrasi === 'diajukan'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : pos.status_registrasi === 'dikembalikan'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {pos.status_registrasi}
                        </span>
                      </td>
                      <td className="py-4 pl-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(pos)}
                          className="h-8 w-8 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(pos.id)}
                          className="h-8 w-8 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
