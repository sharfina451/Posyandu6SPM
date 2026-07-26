'use client'

import React, { useEffect, useState } from 'react'
import {
  getPengurus,
  createPengurus,
  updatePengurus,
  deletePengurus,
  getUsersList,
} from './actions'
import { getPosyandus } from '../posyandu/actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Loader2, Plus, Edit2, Trash2, X, UsersRound, Shield } from 'lucide-react'

interface Pengurus {
  id: string
  posyandu_id: string
  pengguna_id: string | null
  nama: string
  jabatan: string
  no_sk: string | null
  aktif: boolean
  posyandu?: {
    id: string
    nama: string
  } | null
  pengguna?: {
    id: string
    nama: string
    username: string
  } | null
}

interface Posyandu {
  id: string
  nama: string
}

interface User {
  id: string
  nama: string
  username: string
}

export default function AdminPengurusPage() {
  const [pengurusList, setPengurusList] = useState<Pengurus[]>([])
  const [posyandus, setPosyandus] = useState<Posyandu[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [formOpen, setFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    posyandu_id: '',
    pengguna_id: '',
    nama: '',
    jabatan: 'Ketua',
    no_sk: '',
    aktif: true,
  })

  const loadData = async () => {
    setLoading(true)
    const [resPengurus, resPosyandu, resUsers] = await Promise.all([
      getPengurus(),
      getPosyandus(),
      getUsersList(),
    ])

    if (resPengurus.success && resPengurus.data) {
      setPengurusList(resPengurus.data as Pengurus[])
    } else {
      setError(resPengurus.error || 'Gagal memuat data Pengurus')
    }

    if (resPosyandu.success && resPosyandu.data) {
      setPosyandus(resPosyandu.data as Posyandu[])
      if (resPosyandu.data.length > 0 && !formData.posyandu_id) {
        setFormData((prev) => ({ ...prev, posyandu_id: resPosyandu.data![0].id }))
      }
    }

    if (resUsers.success && resUsers.data) {
      setUsers(resUsers.data as User[])
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
        const res = await updatePengurus(editingId, formData)
        if (res.success) {
          setFormOpen(false)
          resetForm()
          loadData()
        } else {
          setError(res.error || 'Gagal memperbarui Pengurus')
        }
      } else {
        const res = await createPengurus(formData)
        if (res.success) {
          setFormOpen(false)
          resetForm()
          loadData()
        } else {
          setError(res.error || 'Gagal menambahkan Pengurus')
        }
      }
    } catch {
      setError('Terjadi kesalahan koneksi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (p: Pengurus) => {
    setFormData({
      posyandu_id: p.posyandu_id,
      pengguna_id: p.pengguna_id || '',
      nama: p.nama,
      jabatan: p.jabatan,
      no_sk: p.no_sk || '',
      aktif: p.aktif,
    })
    setEditingId(p.id)
    setIsEditing(true)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data pengurus ini?')) return

    const res = await deletePengurus(id)
    if (res.success) {
      loadData()
    } else {
      alert(res.error || 'Gagal menghapus pengurus')
    }
  }

  const resetForm = () => {
    setFormData({
      posyandu_id: posyandus.length > 0 ? posyandus[0].id : '',
      pengguna_id: '',
      nama: '',
      jabatan: 'Ketua',
      no_sk: '',
      aktif: true,
    })
    setIsEditing(false)
    setEditingId(null)
  }

  const jabatanOptions = [
    'Ketua',
    'Sekretaris',
    'Bendahara',
    'Ketua Bidang Kesehatan',
    'Ketua Bidang Pendidikan',
    'Ketua Bidang Pekerjaan Umum',
    'Ketua Bidang Perumahan Rakyat',
    'Ketua Bidang Trantibumlinmas',
    'Ketua Bidang Sosial',
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Kelola Pengurus LKD</h2>
          <p className="text-slate-400 text-sm">
            Manajemen susunan pengurus LKD TP Posyandu tingkat Desa Lemahduwur.
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
            <Plus className="h-5 w-5" /> Tambah Pengurus
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
                {isEditing ? 'Edit Data Pengurus' : 'Tambah Pengurus Baru'}
              </CardTitle>
              <CardDescription className="text-slate-400">
                Pilih jabatan pengurus dan posyandu yang diampu.
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
                  <label className="text-sm font-semibold text-slate-300">Posyandu LKD *</label>
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
                  <label className="text-sm font-semibold text-slate-300">Jabatan Pengurus *</label>
                  <Select
                    required
                    value={!jabatanOptions.includes(formData.jabatan) ? 'Anggota' : formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  >
                    {jabatanOptions.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                    <option value="Anggota">Anggota / Teks Bebas</option>
                  </Select>
                </div>

                {!jabatanOptions.includes(formData.jabatan) && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">
                      Detail Jabatan Kustom
                    </label>
                    <Input
                      value={formData.jabatan === 'Anggota' ? '' : formData.jabatan}
                      onChange={(e) =>
                        setFormData({ ...formData, jabatan: e.target.value || 'Anggota' })
                      }
                      placeholder="Contoh: Kader Pembantu"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Nama Lengkap *</label>
                  <Input
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Nama Lengkap Pengurus"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Tautkan Akun Aplikasi (Opsional)
                  </label>
                  <Select
                    value={formData.pengguna_id}
                    onChange={(e) => setFormData({ ...formData, pengguna_id: e.target.value })}
                  >
                    <option value="">-- Tidak Tautkan Akun (Tamu/Offline) --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nama} ({u.username})
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Nomor SK Pengurus LKD
                  </label>
                  <Input
                    value={formData.no_sk}
                    onChange={(e) => setFormData({ ...formData, no_sk: e.target.value })}
                    placeholder="Contoh: SK-12/PEM/VIII/2025"
                  />
                </div>

                <div className="space-y-2 flex items-center pt-8">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.aktif}
                      onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                      className="h-5 w-5 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-semibold text-slate-300">
                      Aktif Sebagai Pengurus
                    </span>
                  </label>
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
                    'Perbarui Pengurus'
                  ) : (
                    'Simpan Pengurus'
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
              <p className="text-slate-400 text-sm">Memuat data Pengurus LKD...</p>
            </div>
          ) : pengurusList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
                <UsersRound className="h-6 w-6" />
              </div>
              <div>
                <p className="text-white font-bold text-base">Belum Ada Susunan Pengurus</p>
                <p className="text-slate-500 text-sm max-w-sm mt-1">
                  Mulai dengan menambahkan ketua, sekretaris, atau pengurus bidang LKD Posyandu.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm font-semibold">
                    <th className="pb-3 pr-4">Nama Pengurus</th>
                    <th className="pb-3 px-4">Jabatan</th>
                    <th className="pb-3 px-4">Posyandu</th>
                    <th className="pb-3 px-4">Tautan Akun</th>
                    <th className="pb-3 px-4">No. SK</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 pl-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-sm text-slate-300">
                  {pengurusList.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/35 transition-colors">
                      <td className="py-4 pr-4 font-bold text-white flex items-center gap-2">
                        <UsersRound className="h-4 w-4 text-slate-500" />
                        {p.nama}
                      </td>
                      <td className="py-4 px-4 font-semibold text-emerald-400 flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5" />
                        {p.jabatan}
                      </td>
                      <td className="py-4 px-4">{p.posyandu ? p.posyandu.nama : '-'}</td>
                      <td className="py-4 px-4 text-slate-400">
                        {p.pengguna ? (
                          <span className="text-slate-200">
                            {p.pengguna.nama} ({p.pengguna.username})
                          </span>
                        ) : (
                          <span className="text-slate-600">Offline / Tanpa Akun</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-400">{p.no_sk || '-'}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            p.aktif
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          {p.aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-4 pl-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(p)}
                          className="h-8 w-8 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(p.id)}
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
