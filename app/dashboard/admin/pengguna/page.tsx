'use client'

import React, { useEffect, useState } from 'react'
import { getUsers, updateUser, createUserAndInvite } from './actions'
import { getPosyandus } from '../posyandu/actions'
import { getWilayahs } from '../wilayah/actions'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Loader2, Plus, Edit2, X, UserCheck, UserX } from 'lucide-react'

interface UserProfile {
  id: string
  nama: string
  username: string
  peran_id: number
  wilayah_id: string | null
  posyandu_id: string | null
  aktif: boolean
  dibuat_pada: string
  peran?: {
    id: number
    kode: string
    nama: string
  } | null
  wilayah?: {
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

interface Wilayah {
  id: string
  kode: string
  level: string
}

interface Role {
  id: number
  kode: string
  nama: string
}

export default function AdminPenggunaPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [posyandus, setPosyandus] = useState<Posyandu[]>([])
  const [wilayahs, setWilayahs] = useState<Wilayah[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [formOpen, setFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Fields for Invite
  const [formData, setFormData] = useState({
    email: '',
    nama: '',
    username: '',
    peran_id: '' as unknown as number,
    wilayah_id: '',
    posyandu_id: '',
    aktif: true,
  })

  const loadData = async () => {
    setLoading(true)
    const supabase = createClient()

    const [resUsers, resPosyandu, resWilayah, { data: resRoles }] = await Promise.all([
      getUsers(),
      getPosyandus(),
      getWilayahs(),
      supabase.from('peran').select('id, kode, nama'),
    ])

    if (resUsers.success && resUsers.data) {
      setUsers(resUsers.data as UserProfile[])
    } else {
      setError(resUsers.error || 'Gagal memuat data Pengguna')
    }

    if (resPosyandu.success && resPosyandu.data) {
      setPosyandus(resPosyandu.data as Posyandu[])
    }

    if (resWilayah.success && resWilayah.data) {
      // Filter wilayah RW saja untuk scope penugasan kader
      setWilayahs((resWilayah.data as Wilayah[]).filter((w) => w.level === 'rw'))
    }

    if (resRoles) {
      setRoles(resRoles as Role[])
      if (resRoles.length > 0 && !formData.peran_id) {
        // Cari id kader sebagai default
        const defaultRole = resRoles.find((r) => r.kode === 'kader')
        setFormData((prev) => ({
          ...prev,
          peran_id: defaultRole ? defaultRole.id : resRoles[0].id,
        }))
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
        const res = await updateUser(editingId, {
          peran_id: Number(formData.peran_id),
          wilayah_id: formData.wilayah_id,
          posyandu_id: formData.posyandu_id,
          aktif: formData.aktif,
        })
        if (res.success) {
          setFormOpen(false)
          resetForm()
          loadData()
        } else {
          setError(res.error || 'Gagal memperbarui pengguna')
        }
      } else {
        const res = await createUserAndInvite({
          email: formData.email,
          nama: formData.nama,
          username: formData.username,
          peran_id: Number(formData.peran_id),
          wilayah_id: formData.wilayah_id,
          posyandu_id: formData.posyandu_id,
        })
        if (res.success) {
          setFormOpen(false)
          resetForm()
          loadData()
          alert('Akun pengguna berhasil dibuat! Kata sandi default: password123')
        } else {
          setError(res.error || 'Gagal mengundang pengguna baru')
        }
      }
    } catch {
      setError('Terjadi kesalahan koneksi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (u: UserProfile) => {
    setFormData({
      email: '', // Not editable in edit mode
      nama: u.nama,
      username: u.username,
      peran_id: u.peran_id,
      wilayah_id: u.wilayah_id || '',
      posyandu_id: u.posyandu_id || '',
      aktif: u.aktif,
    })
    setEditingId(u.id)
    setIsEditing(true)
    setFormOpen(true)
  }

  const resetForm = () => {
    const defaultRole = roles.find((r) => r.kode === 'kader')
    setFormData({
      email: '',
      nama: '',
      username: '',
      peran_id: defaultRole
        ? defaultRole.id
        : roles.length > 0
          ? roles[0].id
          : ('' as unknown as number),
      wilayah_id: '',
      posyandu_id: posyandus.length > 0 ? posyandus[0].id : '',
      aktif: true,
    })
    setIsEditing(false)
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Manajemen Pengguna</h2>
          <p className="text-slate-400 text-sm">
            Undang kader baru, kelola peran (RBAC), wilayah penugasan (RLS), dan penonaktifan akun.
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
            <Plus className="h-5 w-5" /> Undang Kader / Pengguna
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
                {isEditing ? `Edit Hak Akses: ${formData.nama}` : 'Undang Kader / Pengurus Baru'}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {isEditing
                  ? 'Perbarui penugasan wilayah atau ubah peran pengguna.'
                  : 'Akun baru akan dibuat langsung dengan kata sandi bawaan.'}
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
                {!isEditing && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">Alamat Email *</label>
                      <Input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="kader@desa.id"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">
                        Username Unik *
                      </label>
                      <Input
                        required
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            username: e.target.value.toLowerCase().replace(/\s+/g, ''),
                          })
                        }
                        placeholder="Contoh: budiwarga"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Nama Lengkap *</label>
                  <Input
                    required
                    disabled={isEditing} // Edit profile is done by user themselves
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Nama Lengkap Pengguna"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Peran / Hak Akses *
                  </label>
                  <Select
                    required
                    value={formData.peran_id}
                    onChange={(e) => setFormData({ ...formData, peran_id: Number(e.target.value) })}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nama} ({r.kode})
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Posyandu LKD Pengampu
                  </label>
                  <Select
                    value={formData.posyandu_id}
                    onChange={(e) => setFormData({ ...formData, posyandu_id: e.target.value })}
                  >
                    <option value="">-- Tidak Ada Posyandu (Global) --</option>
                    {posyandus.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Wilayah Penugasan RW (Cakupan RLS)
                  </label>
                  <Select
                    value={formData.wilayah_id}
                    onChange={(e) => setFormData({ ...formData, wilayah_id: e.target.value })}
                  >
                    <option value="">-- Semua Wilayah Desa (Global) --</option>
                    {wilayahs.map((w) => (
                      <option key={w.id} value={w.id}>
                        RW {w.kode}
                      </option>
                    ))}
                  </Select>
                </div>

                {isEditing && (
                  <div className="space-y-2 flex items-center pt-8">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.aktif}
                        onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                        className="h-5 w-5 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-semibold text-slate-300">
                        Status Akun Aktif
                      </span>
                    </label>
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
                      Memproses...
                    </>
                  ) : isEditing ? (
                    'Perbarui Akun'
                  ) : (
                    'Buat & Undang User'
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
              <p className="text-slate-400 text-sm">Memuat data pengguna...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm font-semibold">
                    <th className="pb-3 pr-4">Nama / Username</th>
                    <th className="pb-3 px-4">Peran (Role)</th>
                    <th className="pb-3 px-4">Posyandu</th>
                    <th className="pb-3 px-4">Cakupan Wilayah (RLS)</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 pl-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-sm text-slate-300">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/35 transition-colors">
                      <td className="py-4 pr-4 font-bold text-white flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                          {u.aktif ? (
                            <UserCheck className="h-4 w-4" />
                          ) : (
                            <UserX className="h-4 w-4 text-rose-400" />
                          )}
                        </div>
                        <div>
                          <span>{u.nama}</span>
                          <span className="block text-xs font-mono font-normal text-slate-500">
                            @{u.username}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-200 capitalize">
                        {u.peran ? u.peran.nama : 'Kader'}
                      </td>
                      <td className="py-4 px-4 text-slate-400">
                        {u.posyandu ? u.posyandu.nama : 'Akses Global'}
                      </td>
                      <td className="py-4 px-4 text-slate-400">
                        {u.wilayah ? `RW ${u.wilayah.kode}` : 'Semua Wilayah'}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            u.aktif
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {u.aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-4 pl-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(u)}
                          className="h-8 w-8 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                        >
                          <Edit2 className="h-4 w-4" />
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
