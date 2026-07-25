'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getKunjungans, createKunjungan, updateKunjungan, deleteKunjungan } from './actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Loader2, Plus, Edit2, Trash2, X, Calendar, MapPin, Eye } from 'lucide-react'

interface Kunjungan {
  id: string
  nama: string
  tanggal: string
  jenis: 'posyandu' | 'kunjungan_rumah'
  keterangan: string | null
  wilayah_id: string
  wilayah?: {
    kode: string
    level: string
  } | null
}

export default function KunjunganPage() {
  const [kunjungans, setKunjungans] = useState<Kunjungan[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [formOpen, setFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nama: '',
    tanggal: new Date().toISOString().split('T')[0],
    jenis: 'posyandu' as 'posyandu' | 'kunjungan_rumah',
    keterangan: '',
  })

  const loadData = async () => {
    setLoading(true)
    const res = await getKunjungans()
    if (res.success && res.data) {
      setKunjungans(res.data as Kunjungan[])
    } else {
      setError(res.error || 'Gagal memuat data kunjungan.')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetForm = () => {
    setFormData({
      nama: '',
      tanggal: new Date().toISOString().split('T')[0],
      jenis: 'posyandu',
      keterangan: '',
    })
    setIsEditing(false)
    setEditingId(null)
  }

  const handleEdit = (k: Kunjungan) => {
    setFormData({
      nama: k.nama,
      tanggal: k.tanggal,
      jenis: k.jenis,
      keterangan: k.keterangan || '',
    })
    setEditingId(k.id)
    setIsEditing(true)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Apakah Anda yakin ingin menghapus sesi kunjungan ini? Semua data layanan terkait akan kehilangan relasi kunjungan.'
      )
    ) {
      return
    }

    const res = await deleteKunjungan(id)
    if (res.success) {
      loadData()
    } else {
      setError(res.error || 'Gagal menghapus kunjungan.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (isEditing && editingId) {
        const res = await updateKunjungan(editingId, formData)
        if (res.success) {
          setFormOpen(false)
          resetForm()
          loadData()
        } else {
          setError(res.error || 'Gagal memperbarui kunjungan.')
        }
      } else {
        const res = await createKunjungan(formData)
        if (res.success) {
          setFormOpen(false)
          resetForm()
          loadData()
        } else {
          setError(res.error || 'Gagal membuat kunjungan.')
        }
      }
    } catch {
      setError('Terjadi kesalahan koneksi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Sesi Kunjungan Posyandu</h2>
          <p className="text-slate-400 text-sm">
            Manajemen sesi Hari Buka Posyandu bulanan dan Kunjungan Rumah (door-to-door).
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
            <Plus className="h-5 w-5" /> Buat Sesi Baru
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
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl animate-in fade-in duration-300">
          <CardHeader className="flex flex-row justify-between items-center border-b border-slate-850">
            <div>
              <CardTitle className="text-lg font-bold text-white">
                {isEditing ? 'Edit Sesi Kunjungan' : 'Buat Sesi Kunjungan Baru'}
              </CardTitle>
              <CardDescription className="text-slate-400">
                Lengkapi rincian sesi pelayanan di wilayah Anda.
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
                  <label className="text-sm font-semibold text-slate-300">
                    Nama Sesi Pelayanan *
                  </label>
                  <Input
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Posyandu Balita RW01 - Juli 2026"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Tanggal Pelaksanaan *
                  </label>
                  <Input
                    required
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Jenis Kunjungan *</label>
                  <Select
                    required
                    value={formData.jenis}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData({
                        ...formData,
                        jenis: e.target.value as 'posyandu' | 'kunjungan_rumah',
                      })
                    }
                  >
                    <option value="posyandu">Hari Buka Posyandu (Lembaga)</option>
                    <option value="kunjungan_rumah">Kunjungan Rumah (Door-to-Door)</option>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Keterangan Tambahan
                  </label>
                  <Input
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    placeholder="Catatan pelaksanaan, jumlah petugas, dll."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-850 pt-4">
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
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl active:scale-95 transition flex items-center gap-1.5 px-6"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Sesi'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Visits List */}
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Daftar Sesi Kunjungan</h3>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
              <p className="text-slate-400 text-sm">Memuat sesi kunjungan...</p>
            </div>
          ) : kunjungans.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Belum ada sesi kunjungan yang dibuat di wilayah Anda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm font-semibold">
                    <th className="pb-3 pr-4">Nama Sesi</th>
                    <th className="pb-3 px-4">Tanggal</th>
                    <th className="pb-3 px-4">Jenis</th>
                    <th className="pb-3 px-4">Cakupan Wilayah</th>
                    <th className="pb-3 px-4">Keterangan</th>
                    <th className="pb-3 pl-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-sm text-slate-300">
                  {kunjungans.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-800/35 transition-colors">
                      <td className="py-4 pr-4 font-bold text-white flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        {k.nama}
                      </td>
                      <td className="py-4 px-4">
                        {new Date(k.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-4 capitalize">
                        {k.jenis === 'posyandu' ? 'Hari Buka Posyandu' : 'Kunjungan Rumah'}
                      </td>
                      <td className="py-4 px-4 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        {k.wilayah ? `${k.wilayah.level.toUpperCase()} ${k.wilayah.kode}` : '-'}
                      </td>
                      <td className="py-4 px-4 truncate max-w-[200px]">{k.keterangan || '-'}</td>
                      <td className="py-4 pl-4 text-right flex justify-end gap-2">
                        <Link href={`/dashboard/kunjungan/${k.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-400 hover:text-emerald-350 hover:bg-emerald-500/10 rounded-lg text-xs flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" /> Rekap
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(k)}
                          className="text-amber-400 hover:text-amber-350 hover:bg-amber-500/10 rounded-lg text-xs"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(k.id)}
                          className="text-rose-400 hover:text-rose-350 hover:bg-rose-500/10 rounded-lg text-xs"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
