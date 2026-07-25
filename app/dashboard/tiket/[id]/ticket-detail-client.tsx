'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Clock,
  User,
  Shield,
  FileText,
  Calendar,
  AlertTriangle,
  Building,
  CheckCircle,
  Check,
  Send,
  Loader2,
  FileDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { updateTicketStatus } from '../actions'
import { DocumentUploader } from '@/components/document-uploader'
import { RtlhUploader } from '@/components/rtlh-uploader'
import { deleteDocumentAction, getSignedUrlAction } from '../storage-actions'
import { Trash2 } from 'lucide-react'

interface WargaInfo {
  id: string
  nama: string
  nik: string
  jenis_kelamin: 'L' | 'P'
  tanggal_lahir: string
  hubungan_keluarga: string | null
  disabilitas: boolean
  rumah_tangga: {
    id: string
    no_kk: string | null
    alamat: string | null
    dekat_industri: boolean
  } | null
}

interface RiwayatItem {
  id: string
  status_dari: string | null
  status_ke: string
  catatan: string | null
  pada: string
  oleh: {
    id: string
    nama: string
    peran: {
      kode: string
      nama: string
    }
  } | null
}

export interface DokumenItem {
  id: string
  jenis: string
  url_berkas: string
  keterangan: string | null
  diunggah_pada: string
  diunggah_oleh_user: {
    id: string
    nama: string
  } | null
}

interface TicketDetail {
  id: string
  nomor_tiket: string
  warga_id: string
  rumah_tangga_id: string | null
  bidang:
    | 'pendidikan'
    | 'kesehatan'
    | 'pekerjaan_umum'
    | 'perumahan_rakyat'
    | 'trantibumlinmas'
    | 'sosial'
  jenis_permohonan: string
  deskripsi: string | null
  status:
    'didata' | 'verifikasi_kunjungan' | 'diajukan_pemdes' | 'disposisi_opd' | 'selesai' | 'ditolak'
  prioritas: 'rendah' | 'sedang' | 'tinggi' | 'darurat'
  rahasia: boolean
  tanggal_terbit: string
  tenggat_sla: string | null
  tanggal_selesai: string | null
  kader_id: string | null
  verifikator_id: string | null
  pemdes_id: string | null
  opd_tujuan: string | null
  lewat_sla: boolean
  perlu_eskalasi: boolean
  warga: WargaInfo | null
  kader: { id: string; nama: string; no_hp: string | null } | null
  verifikator: { id: string; nama: string } | null
  pemdes: { id: string; nama: string } | null
  riwayat: RiwayatItem[]
  dokumen: DokumenItem[]
}

interface TicketDetailClientProps {
  ticket: TicketDetail
  currentUserRole: string
}

export function TicketDetailClient({ ticket, currentUserRole }: TicketDetailClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<DokumenItem[]>(ticket.dokumen || [])

  const handleUploadSuccess = (newDoc: DokumenItem) => {
    setDocuments((prev) => [newDoc, ...prev])
    router.refresh()
  }

  const handleDeleteSuccess = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId))
    router.refresh()
  }

  // Action Form State
  const [actionStatus, setActionStatus] = useState<string>('')
  const [actionCatatan, setActionCatatan] = useState('')
  const [actionOpd, setActionOpd] = useState('Dispermades')

  // Calculate Warga Age
  const age = React.useMemo(() => {
    if (!ticket.warga?.tanggal_lahir) return null
    const birthDate = new Date(ticket.warga.tanggal_lahir)
    const today = new Date()
    let ageYears = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      ageYears--
    }
    return ageYears
  }, [ticket.warga])

  // Get status metadata
  const statusMeta = (status: string) => {
    switch (status) {
      case 'didata':
        return { label: 'Didata', bg: 'bg-slate-800 text-slate-400 border-slate-700' }
      case 'verifikasi_kunjungan':
        return {
          label: 'Verifikasi Kunjungan',
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        }
      case 'diajukan_pemdes':
        return {
          label: 'Diajukan Pemdes',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        }
      case 'disposisi_opd':
        return {
          label: 'Disposisi OPD',
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        }
      case 'selesai':
        return { label: 'Selesai', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
      case 'ditolak':
        return { label: 'Ditolak', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
      default:
        return { label: status, bg: 'bg-slate-800 text-slate-400 border-slate-700' }
    }
  }

  const priorityMeta = (priority: string) => {
    switch (priority) {
      case 'darurat':
        return { label: 'Darurat', bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30' }
      case 'tinggi':
        return { label: 'Tinggi', bg: 'bg-orange-500/15 text-orange-400 border-orange-500/30' }
      case 'sedang':
        return { label: 'Sedang', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/20' }
      case 'rendah':
        return { label: 'Rendah', bg: 'bg-slate-800 text-slate-400 border-slate-700' }
      default:
        return { label: priority, bg: 'bg-slate-800 text-slate-400 border-slate-700' }
    }
  }

  const getBidangLabel = (bidang: string) => {
    switch (bidang) {
      case 'pendidikan':
        return 'Pendidikan'
      case 'kesehatan':
        return 'Kesehatan'
      case 'pekerjaan_umum':
        return 'Pekerjaan Umum'
      case 'perumahan_rakyat':
        return 'Perumahan Rakyat (RTLH)'
      case 'trantibumlinmas':
        return 'Trantibumlinmas'
      case 'sosial':
        return 'Sosial (Bansos)'
      default:
        return bidang
    }
  }

  // Required documents checklist based on bidang
  const getRequiredDocs = (bidang: string) => {
    switch (bidang) {
      case 'pendidikan':
        return [
          { key: 'KTP', label: 'Fotokopi KTP Pemohon' },
          { key: 'KK', label: 'Fotokopi Kartu Keluarga' },
          { key: 'SKTM_RT', label: 'Surat Pernyataan Tidak Mampu dari RT' },
        ]
      case 'perumahan_rakyat':
        return [
          { key: 'KTP', label: 'Fotokopi KTP Pemohon' },
          { key: 'KK', label: 'Fotokopi Kartu Keluarga' },
          { key: 'SK_PENGHASILAN', label: 'Surat Keterangan Penghasilan dari Desa' },
          { key: 'SURAT_TANAH', label: 'Fotokopi Surat Tanah / Hak Milik' },
          { key: 'FOTO_RUMAH_3_SISI', label: 'Foto Kondisi Rumah 3 Sisi (Depan, Samping, Dalam)' },
          { key: 'PERNYATAAN_BEBAS_BANTUAN', label: 'Surat Pernyataan Belum Pernah Terima Rehab' },
        ]
      case 'pekerjaan_umum':
        return [
          { key: 'PERMOHONAN_RT', label: 'Surat Permohonan Kepala Dusun / RT' },
          { key: 'TITIK_KOORDINAT', label: 'Titik/Lokasi Pembangunan Sarpras' },
        ]
      case 'trantibumlinmas':
        return [
          { key: 'IDENTITAS_PELAPOR', label: 'Identitas Diri Pelapor (KTP / Surat Pernyataan)' },
        ]
      case 'sosial':
        return [
          { key: 'KTP_SASARAN', label: 'Fotokopi KTP Sasaran' },
          { key: 'DESKRIPSI_KELUHAN', label: 'Gambaran Keluhan / Kondisi Sasaran' },
          { key: 'SURAT_PEMDES', label: 'Surat Pernyataan dari Pemdes' },
        ]
      default:
        return []
    }
  }

  const requiredDocs = getRequiredDocs(ticket.bidang)

  // Determine allowed transitions for the dropdown
  const allowedTransitions = React.useMemo(() => {
    const list: { value: string; label: string }[] = []
    const role = currentUserRole
    const status = ticket.status

    if (status === 'selesai' || status === 'ditolak') return list

    if (status === 'didata') {
      if (['kader', 'bidan', 'pemdes', 'admin'].includes(role)) {
        list.push({ value: 'verifikasi_kunjungan', label: 'Verifikasi Kunjungan Lapangan' })
        list.push({ value: 'ditolak', label: 'Tolak Permohonan' })
      }
    } else if (status === 'verifikasi_kunjungan') {
      if (['kader', 'bidan', 'pemdes', 'admin'].includes(role)) {
        list.push({ value: 'diajukan_pemdes', label: 'Ajukan ke Pemerintah Desa' })
        list.push({ value: 'ditolak', label: 'Tolak Permohonan' })
      }
    } else if (status === 'diajukan_pemdes') {
      if (['pemdes', 'admin'].includes(role)) {
        list.push({ value: 'disposisi_opd', label: 'Disposisi ke OPD Kecamatan/Kabupaten' })
        list.push({ value: 'selesai', label: 'Selesaikan Tiket (Tingkat Desa)' })
        list.push({ value: 'ditolak', label: 'Tolak Permohonan' })
      }
    } else if (status === 'disposisi_opd') {
      if (['opd', 'pemdes', 'admin'].includes(role)) {
        list.push({ value: 'selesai', label: 'Selesaikan Tiket (Tindak Lanjut OPD)' })
        list.push({ value: 'ditolak', label: 'Tolak Permohonan' })
      }
    }

    return list
  }, [ticket.status, currentUserRole])

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!actionStatus) {
      setError('Pilih status tujuan transisi terlebih dahulu.')
      return
    }

    if (actionCatatan.trim() === '') {
      setError('Catatan transisi wajib diisi.')
      return
    }

    startTransition(async () => {
      const res = await updateTicketStatus(
        ticket.id,
        actionStatus as
          | 'didata'
          | 'verifikasi_kunjungan'
          | 'diajukan_pemdes'
          | 'disposisi_opd'
          | 'selesai'
          | 'ditolak',
        actionCatatan,
        actionStatus === 'disposisi_opd' ? actionOpd : undefined
      )

      if (res.success) {
        alert('Status tiket berhasil diperbarui!')
        setActionCatatan('')
        setActionStatus('')
        router.refresh()
      } else {
        setError(res.error || 'Gagal memperbarui status.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link
          href="/dashboard/tiket"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Tiket
        </Link>
      </div>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-6 border border-slate-800/80 rounded-3xl backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-2xl font-mono font-bold text-white tracking-tight">
              {ticket.nomor_tiket}
            </h2>
            {ticket.rahasia && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/25 text-purple-300 border border-purple-500/30">
                🔒 Rahasia
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm">
            Tipe Permohonan:{' '}
            <span className="font-bold text-slate-200">{ticket.jenis_permohonan}</span> | Urusan:{' '}
            <span className="font-bold text-slate-200">{getBidangLabel(ticket.bidang)}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${statusMeta(ticket.status).bg}`}
          >
            {statusMeta(ticket.status).label}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${priorityMeta(ticket.prioritas).bg}`}
          >
            Prioritas: {priorityMeta(ticket.prioritas).label}
          </span>
        </div>
      </div>

      {/* Main Grid Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Columns (Details & SLA & Warga) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detail Tiket & SLA Card */}
          <Card className="bg-slate-900 border-slate-800/80 rounded-2xl shadow-xl">
            <CardHeader className="border-b border-slate-800 pb-3">
              <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-400" /> Detail Permohonan & SLA
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <span className="text-xs text-slate-500 block font-semibold">
                  Deskripsi Permasalahan
                </span>
                <p className="text-sm text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800/40 mt-1 leading-relaxed whitespace-pre-line">
                  {ticket.deskripsi || 'Tidak ada deskripsi.'}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 bg-slate-950/30 p-4 rounded-xl border border-slate-800/40">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Tanggal Terbit
                  </span>
                  <span className="text-sm text-slate-300 flex items-center gap-1.5 mt-1 font-semibold">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    {new Date(ticket.tanggal_terbit).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Tenggat SLA (5 Hari Kerja)
                  </span>
                  <span className="text-sm text-slate-300 flex items-center gap-1.5 mt-1 font-semibold">
                    <Clock className="h-4 w-4 text-slate-500" />
                    {ticket.tenggat_sla
                      ? new Date(ticket.tenggat_sla).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Status SLA
                  </span>
                  <div className="mt-1">
                    {ticket.status === 'selesai' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                        <CheckCircle className="h-4 w-4" /> Selesai Tepat Waktu
                      </span>
                    ) : ticket.lewat_sla ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 animate-pulse">
                        <Shield className="h-4 w-4" /> Melebihi SLA (Terlambat)
                      </span>
                    ) : ticket.perlu_eskalasi ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                        <AlertTriangle className="h-4 w-4" /> Mandek (Butuh Eskalasi)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-400">
                        <Clock className="h-4 w-4" /> SLA Berjalan
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {ticket.opd_tujuan && (
                <div className="flex items-center gap-2 text-xs text-purple-300 bg-purple-500/5 p-3 rounded-xl border border-purple-500/10">
                  <Building className="h-4 w-4" />
                  <span>
                    Diteruskan ke OPD Tujuan:{' '}
                    <strong className="text-white">{ticket.opd_tujuan}</strong>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Citizen Profil Card */}
          <Card className="bg-slate-900 border-slate-800/80 rounded-2xl shadow-xl">
            <CardHeader className="border-b border-slate-800 pb-3">
              <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-400" /> Profil Pemohon / Warga
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {ticket.warga ? (
                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold block">
                        Nama Lengkap
                      </span>
                      <span className="text-white font-bold text-base">{ticket.warga.nama}</span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 font-semibold block">
                        Nomor Induk Kependudukan (NIK)
                      </span>
                      <span className="text-slate-300 font-mono font-bold">{ticket.warga.nik}</span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 font-semibold block">
                        Jenis Kelamin / Umur
                      </span>
                      <span className="text-slate-300">
                        {ticket.warga.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} (
                        {age !== null ? `${age} tahun` : '-'})
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold block">Nomor KK</span>
                      <span className="text-slate-300 font-mono font-bold">
                        {ticket.warga.rumah_tangga?.no_kk || '-'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 font-semibold block">
                        Alamat Rumah
                      </span>
                      <span className="text-slate-300 leading-relaxed">
                        {ticket.warga.rumah_tangga?.alamat || '-'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 font-semibold block">
                        Kedekatan Industri Produktif
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${ticket.warga.rumah_tangga?.dekat_industri ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'}`}
                      >
                        {ticket.warga.rumah_tangga?.dekat_industri
                          ? 'Kawasan Logam/Konveksi'
                          : 'Bukan Kawasan Industri'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Data warga pemohon tidak tersedia.</p>
              )}
            </CardContent>
          </Card>

          {/* Document checklist card */}
          {ticket.bidang === 'perumahan_rakyat' ? (
            <Card className="bg-slate-900 border-slate-800/80 rounded-2xl shadow-xl">
              <CardHeader className="border-b border-slate-800 pb-3">
                <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-400" /> Kelengkapan Foto RTLH (3 Sisi)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <RtlhUploader
                  ticketId={ticket.id}
                  wargaId={ticket.warga_id}
                  existingDocs={documents}
                  onUploadSuccess={handleUploadSuccess}
                  onDeleteSuccess={handleDeleteSuccess}
                />
              </CardContent>
            </Card>
          ) : (
            requiredDocs.length > 0 && (
              <Card className="bg-slate-900 border-slate-800/80 rounded-2xl shadow-xl">
                <CardHeader className="border-b border-slate-800 pb-3">
                  <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-400" /> Checklist Dokumen Persyaratan
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <p className="text-xs text-slate-500">
                    Berikut berkas dokumen yang disyaratkan untuk usulan bidang ini. Pastikan kader
                    telah memverifikasi kelengkapan berkas fisik / digital:
                  </p>

                  <div className="space-y-3">
                    {requiredDocs.map((doc) => {
                      const uploadedData = documents.find(
                        (d) => d.jenis.toLowerCase() === doc.key.toLowerCase()
                      )
                      const isUploaded = !!uploadedData

                      return (
                        <div
                          key={doc.key}
                          className={`flex flex-col gap-3 p-4 rounded-xl border transition ${
                            isUploaded
                              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                              : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-1 rounded-full ${isUploaded ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-sm font-semibold text-slate-200">
                                {doc.label}
                              </span>
                            </div>
                            {isUploaded && uploadedData && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const res = await getSignedUrlAction(uploadedData.url_berkas)
                                      if (res.success && res.signedUrl) {
                                        window.open(res.signedUrl, '_blank')
                                      } else {
                                        alert(res.error || 'Gagal mengunduh berkas.')
                                      }
                                    } catch (err) {
                                      console.error(err)
                                      alert('Gagal mengunduh berkas.')
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold"
                                >
                                  <FileDown className="h-4 w-4" /> Unduh
                                </button>
                                {['kader', 'pemdes', 'admin'].includes(currentUserRole) && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!confirm('Apakah Anda yakin ingin menghapus berkas ini?'))
                                        return
                                      const res = await deleteDocumentAction(uploadedData.id)
                                      if (res.success) {
                                        handleDeleteSuccess(uploadedData.id)
                                      } else {
                                        alert(res.error || 'Gagal menghapus berkas.')
                                      }
                                    }}
                                    className="inline-flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-400 font-bold ml-2"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {!isUploaded && ['kader', 'admin'].includes(currentUserRole) && (
                            <div className="pl-8 pt-1">
                              <DocumentUploader
                                ticketId={ticket.id}
                                wargaId={ticket.warga_id}
                                jenis={doc.key}
                                onUploadSuccess={handleUploadSuccess}
                                label={`Pilih file ${doc.label.toLowerCase()}`}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>

        {/* Right Column (Actions Form & Status History) */}
        <div className="space-y-6">
          {/* Transition Action Card */}
          {allowedTransitions.length > 0 ? (
            <Card className="bg-slate-900 border-slate-800/80 rounded-2xl shadow-xl">
              <CardHeader className="border-b border-slate-800 pb-3">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Send className="h-4 w-4 text-emerald-400" /> Proses Layanan / Tindak Lanjut
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <form onSubmit={handleStatusSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">
                      Pilih Aksi Tindak Lanjut
                    </label>
                    <Select
                      value={actionStatus}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setActionStatus(e.target.value)
                      }
                      required
                    >
                      <option value="">-- Pilih Transisi Status --</option>
                      {allowedTransitions.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {actionStatus === 'disposisi_opd' && (
                    <div className="space-y-1 animate-in slide-in-from-top-2 duration-150">
                      <label className="text-xs font-semibold text-slate-400">
                        OPD Tujuan Disposisi
                      </label>
                      <Select
                        value={actionOpd}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setActionOpd(e.target.value)
                        }
                        required
                      >
                        <option value="Dispermades">Dispermades (Pemberdayaan Desa)</option>
                        <option value="Dinas Kesehatan">Dinas Kesehatan (Puskesmas)</option>
                        <option value="Dinas Sosial">Dinas Sosial (Bansos)</option>
                        <option value="Dinas PU / PR">Dinas Pekerjaan Umum & PR</option>
                        <option value="Satpol PP / Kepolisian">
                          Satpol PP / Kepolisian (Trantibum)
                        </option>
                        <option value="Dinas Pendidikan">Dinas Pendidikan & Kebudayaan</option>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">
                      Catatan Rekomendasi / Kunjungan
                    </label>
                    <textarea
                      required
                      value={actionCatatan}
                      onChange={(e) => setActionCatatan(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                      placeholder="Masukkan alasan perpindahan status, hasil temuan kunjungan lapangan, atau instruksi disposisi..."
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs active:scale-95 transition flex items-center justify-center gap-1.5"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      'Simpan Tindak Lanjut'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-900/50 border-slate-800/80 rounded-2xl shadow-xl border-dashed">
              <CardContent className="p-6 text-center text-slate-500 text-xs">
                {ticket.status === 'selesai' || ticket.status === 'ditolak' ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-8 w-8 text-slate-600 mx-auto" />
                    <p className="font-semibold text-slate-400">Tiket Telah Selesai Diproses</p>
                    <p>Status tiket bersifat final (terminal state) dan tidak dapat diubah lagi.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Shield className="h-8 w-8 text-slate-600 mx-auto" />
                    <p className="font-semibold text-slate-400">Aksi Tidak Tersedia</p>
                    <p>
                      Peran Anda ({currentUserRole}) tidak memiliki hak akses untuk memproses tiket
                      pada status saat ini ({ticket.status}).
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline History Card */}
          <Card className="bg-slate-900 border-slate-800/80 rounded-2xl shadow-xl">
            <CardHeader className="border-b border-slate-800 pb-3">
              <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" /> Riwayat Progres Layanan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative pl-6 border-l border-slate-800 space-y-6">
                {ticket.riwayat.map((hist) => (
                  <div key={hist.id} className="relative">
                    {/* Timeline dot */}
                    <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 border border-slate-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>

                    {/* Timeline Content */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] gap-2">
                        <span
                          className={`px-2 py-0.5 rounded font-bold uppercase ${statusMeta(hist.status_ke).bg}`}
                        >
                          {statusMeta(hist.status_ke).label}
                        </span>
                        <span className="text-slate-500 font-mono">
                          {new Date(hist.pada).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          {new Date(hist.pada).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Oleh:{' '}
                        <strong className="text-slate-300">{hist.oleh?.nama || 'Sistem'}</strong> (
                        {hist.oleh?.peran?.nama || 'Trigger'})
                      </p>
                      {hist.catatan && (
                        <p className="text-xs text-slate-300 italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-900/60 mt-1 leading-normal">
                          &ldquo;{hist.catatan}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
