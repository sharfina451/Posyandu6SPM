'use client'

import React, { useEffect, useState } from 'react'
import { getWilayahs, createWilayah, updateWilayah, deleteWilayah } from './actions'
import { getPosyandus } from '../posyandu/actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Loader2, Plus, Edit2, Trash2, X, MapPin } from 'lucide-react'

interface Wilayah {
  id: string
  posyandu_id: string
  parent_id: string | null
  level: 'rw' | 'rt'
  kode: string
  nama: string | null
  parent?: {
    id: string
    kode: string
    level: string
  } | null
  posyandu?: {
    id: string
    nama: string
  } | null
}

interface Posyandu {
  id: string
  nama: string
}

export default function AdminWilayahPage() {
  const [wilayahs, setWilayahs] = useState<Wilayah[]>([])
  const [posyandus, setPosyandus] = useState<Posyandu[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [formOpen, setFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    posyandu_id: '',
    parent_id: '',
    level: 'rw' as 'rw' | 'rt',
    kode: '',
    nama: '',
  })

  const loadData = async () => {
    setLoading(true)
    const [resWil, resPos] = await Promise.all([getWilayahs(), getPosyandus()])

    if (resWil.success && resWil.data) {
      setWilayahs(resWil.data as Wilayah[])
    } else {
      setError(resWil.error || 'Gagal memuat data Wilayah')
    }

    if (resPos.success && resPos.data) {
      setPosyandus(resPos.data as Posyandu[])
      if (resPos.data.length > 0 && !formData.posyandu_id) {
        setFormData((prev) => ({ ...prev, posyandu_id: resPos.data![0].id }))
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (isEditing && editingId) {
        const res = await updateWilayah(editingId, formData)
        if (res.success) {
          setFormOpen(false)
          resetForm()
          loadData()
        } else {
          setError(res.error || 'Gagal memperbarui Wilayah')
        }
      } else {
        const res = await createWilayah(formData)
        if (res.success) {
          setFormOpen(false)
          resetForm()
          loadData()
        } else {
          setError(res.error || 'Gagal membuat Wilayah')
        }
      }
    } catch {
      setError('Terjadi kesalahan koneksi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (wil: Wilayah) => {
    setFormData({
      posyandu_id: wil.posyandu_id,
      parent_id: wil.parent_id || '',
      level: wil.level,
      kode: wil.kode,
      nama: wil.nama || '',
    })
    setEditingId(wil.id)
    setIsEditing(true)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Apakah Anda yakin ingin menghapus data wilayah ini? Semua sub-wilayah (RT) di dalamnya akan terhapus.'
      )
    )
      return

    const res = await deleteWilayah(id)
    if (res.success) {
      loadData()
    } else {
      alert(res.error || 'Gagal menghapus data wilayah')
    }
  }

  const resetForm = () => {
    setFormData({
      posyandu_id: posyandus.length > 0 ? posyandus[0].id : '',
      parent_id: '',
      level: 'rw',
      kode: '',
      nama: '',
    })
    setIsEditing(false)
    setEditingId(null)
  }

  // Filter RW only for Parent Selector
  const rwList = wilayahs.filter((w) => w.level === 'rw')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Kelola Wilayah</h2>
          <p className="text-slate-400 text-sm">
            Manajemen hierarki wilayah kerja RW dan RT di Desa Lemahduwur.
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
            <Plus className="h-5 w-5" /> Tambah Wilayah
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Form Card */}
      {formOpen && (
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-850">
            <div>
              <CardTitle className="text-lg font-bold text-white">
                {isEditing ? 'Edit Data Wilayah' : 'Tambah Wilayah Baru'}
              </CardTitle>
              <CardDescription className="text-slate-400">
                Pilih jenis wilayah (RW atau RT) dan isikan kodenya.
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
                  <label className="text-sm font-semibold text-slate-300">Posyandu Induk *</label>
                  <Select
                    required
                    value={formData.posyandu_id}
                    onChange={(e) => setFormData({ ...formData, posyandu_id: e.target.value })}
                  >
                    <option value="" disabled>
                      Pilih Posyandu...
                    </option>
                    {posyandus.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Tingkat Wilayah *</label>
                  <Select
                    required
                    value={formData.level}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData({
                        ...formData,
                        level: e.target.value as 'rw' | 'rt',
                        parent_id: e.target.value === 'rw' ? '' : formData.parent_id,
                      })
                    }
                  >
                    <option value="rw">RW (Rukun Warga)</option>
                    <option value="rt">RT (Rukun Tetangga)</option>
                  </Select>
                </div>

                {formData.level === 'rt' && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">
                      RW Induk (Parent) *
                    </label>
                    <Select
                      required
                      value={formData.parent_id}
                      onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    >
                      <option value="">Pilih RW Induk...</option>
                      {rwList.map((rw) => (
                        <option key={rw.id} value={rw.id}>
                          RW {rw.kode}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Kode Wilayah (Angka) *
                  </label>
                  <Input
                    required
                    value={formData.kode}
                    onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                    placeholder="Contoh: 01, 02, 03"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Nama Wilayah (Opsional)
                  </label>
                  <Input
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Dusun Krajan"
                  />
                </div>
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
                    'Perbarui Wilayah'
                  ) : (
                    'Simpan Wilayah'
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
              <p className="text-slate-400 text-sm">Memuat data Wilayah...</p>
            </div>
          ) : wilayahs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="text-white font-bold text-base">Belum Ada Wilayah Terdaftar</p>
                <p className="text-slate-500 text-sm max-w-sm mt-1">
                  Mulai dengan menambahkan RW atau RT baru untuk pembagian wilayah posyandu.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm font-semibold">
                    <th className="pb-3 pr-4">Nama / Kode Wilayah</th>
                    <th className="pb-3 px-4">Tingkat</th>
                    <th className="pb-3 px-4">RW Induk (Parent)</th>
                    <th className="pb-3 px-4">Posyandu Pengampu</th>
                    <th className="pb-3 pl-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-sm text-slate-300">
                  {wilayahs.map((wil) => (
                    <tr key={wil.id} className="hover:bg-slate-800/35 transition-colors">
                      <td className="py-4 pr-4 font-bold text-white flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        {wil.level.toUpperCase()} {wil.kode} {wil.nama ? `(${wil.nama})` : ''}
                      </td>
                      <td className="py-4 px-4 uppercase font-semibold text-slate-400">
                        {wil.level}
                      </td>
                      <td className="py-4 px-4">{wil.parent ? `RW ${wil.parent.kode}` : '-'}</td>
                      <td className="py-4 px-4 text-slate-400">
                        {wil.posyandu ? wil.posyandu.nama : '-'}
                      </td>
                      <td className="py-4 pl-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(wil)}
                          className="h-8 w-8 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(wil.id)}
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
