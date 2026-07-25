'use client'

import React, { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  saveRegistrationDocumentMetadata,
  deleteRegistrationDocument,
  submitRegistrationAction,
  reviewRegistrationAction,
  getRegistrationSignedUrl,
  PosyanduRegistrasiDetails,
} from './registrasi-actions'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Trash2,
  Download,
  Building,
  UserCheck,
  Send,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react'

interface RegistrasiClientProps {
  initialDetails: PosyanduRegistrasiDetails
  submittedList: PosyanduRegistrasiDetails[]
  currentUserRole: string
}

const DOCUMENT_LABELS = {
  sk_tp_posyandu: 'SK Tim Pembina (TP) Posyandu',
  sk_pengurus: 'SK Kepengurusan Pengurus Posyandu',
  matriks_rekap: 'Matriks Rekapitulasi Data / Capaian SPM',
}

export function RegistrasiClient({
  initialDetails,
  submittedList,
  currentUserRole,
}: RegistrasiClientProps) {
  const [details, setDetails] = useState<PosyanduRegistrasiDetails>(initialDetails)
  const [activeReviewPosyandu, setActiveReviewPosyandu] =
    useState<PosyanduRegistrasiDetails | null>(submittedList.length > 0 ? submittedList[0] : null)

  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()

  // Review form states
  const [nomorRegistrasi, setNomorRegistrasi] = useState('')
  const [catatanReview, setCatatanReview] = useState('')
  const [reviewError, setReviewError] = useState<string | null>(null)

  const isReviewer = currentUserRole === 'admin' || currentUserRole === 'pemdes'
  const activeDetails = isReviewer && activeReviewPosyandu ? activeReviewPosyandu : details

  const supabase = createClient()

  // Refresh data helper
  const refreshData = async (posId: string) => {
    const { getRegistrationDetails } = await import('./registrasi-actions')
    const res = await getRegistrationDetails(posId)
    if (res.success && res.data) {
      if (isReviewer) {
        setActiveReviewPosyandu(res.data)
      } else {
        setDetails(res.data)
      }
    }
  }

  // Handle document upload
  const handleFileUpload = async (
    jenis: 'sk_tp_posyandu' | 'sk_pengurus' | 'matriks_rekap',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading((prev) => ({ ...prev, [jenis]: true }))

    try {
      const filePath = `registrasi/${activeDetails.id}/${jenis}/${Date.now()}_${file.name}`

      // 1. Upload to Supabase Storage Bucket 'dokumen'
      const { error: uploadError } = await supabase.storage
        .from('dokumen')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      // 2. Save metadata to table
      const res = await saveRegistrationDocumentMetadata(
        activeDetails.id,
        jenis,
        filePath,
        file.name
      )
      if (!res.success) throw new Error(res.error)

      await refreshData(activeDetails.id)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal mengunggah dokumen.')
    } finally {
      setUploading((prev) => ({ ...prev, [jenis]: false }))
    }
  }

  // Handle document delete
  const handleFileDelete = async (docId: string, filePath: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus berkas ini?')) return

    startTransition(async () => {
      const res = await deleteRegistrationDocument(docId, filePath)
      if (res.success) {
        await refreshData(activeDetails.id)
      } else {
        alert(res.error || 'Gagal menghapus berkas.')
      }
    })
  }

  // Handle document download
  const handleFileDownload = async (filePath: string) => {
    try {
      const res = await getRegistrationSignedUrl(filePath)
      if (res.success && res.url) {
        window.open(res.url, '_blank')
      } else {
        throw new Error(res.error)
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal mengunduh berkas.')
    }
  }

  // Handle submission of checklist
  const handleRegistrationSubmit = () => {
    if (!confirm('Apakah berkas sudah diisi dengan benar dan siap dikirim?')) return

    startTransition(async () => {
      const res = await submitRegistrationAction(activeDetails.id)
      if (res.success) {
        await refreshData(activeDetails.id)
        alert('Berkas pendaftaran berhasil diajukan ke Pemerintah Desa.')
      } else {
        alert(res.error || 'Gagal mengajukan berkas.')
      }
    })
  }

  // Handle review actions (approve or reject)
  const handleReviewSubmit = (action: 'terdaftar' | 'dikembalikan') => {
    setReviewError(null)

    if (action === 'terdaftar' && !nomorRegistrasi) {
      setReviewError('Nomor registrasi resmi wajib diisi.')
      return
    }

    const confirmMsg =
      action === 'terdaftar'
        ? 'Setujui pendaftaran dan terbitkan nomor registrasi resmi ini?'
        : 'Kembalikan berkas ke Posyandu untuk diperbaiki?'

    if (!confirm(confirmMsg)) return

    startTransition(async () => {
      const res = await reviewRegistrationAction(
        activeDetails.id,
        action,
        action === 'terdaftar' ? nomorRegistrasi : undefined,
        action === 'dikembalikan' ? catatanReview : undefined
      )

      if (res.success) {
        alert(
          action === 'terdaftar'
            ? 'Posyandu berhasil terdaftar resmi!'
            : 'Berkas berhasil dikembalikan.'
        )
        // Refresh local state lists
        window.location.reload()
      } else {
        setReviewError(res.error || 'Gagal menyimpan hasil peninjauan.')
      }
    })
  }

  // Checklist helper
  const getDocumentByJenis = (jenis: string) =>
    activeDetails.dokumen.find((d) => d.jenis_dokumen === jenis)
  const allDocumentsUploaded = activeDetails.dokumen.length === 3

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {/* Reviewer Sidebar List */}
      {isReviewer && (
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl rounded-2xl shadow-xl">
            <CardHeader className="border-b border-slate-850 pb-3">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pengajuan Masuk ({submittedList.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {submittedList.length > 0 ? (
                submittedList.map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => {
                      setActiveReviewPosyandu(pos)
                      setReviewError(null)
                    }}
                    className={`w-full text-left p-3 rounded-xl transition border text-xs flex flex-col gap-1 ${
                      activeReviewPosyandu?.id === pos.id
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-950/40 border-slate-850 text-slate-300 hover:bg-slate-900/40'
                    }`}
                  >
                    <span className="font-extrabold">{pos.nama}</span>
                    <span className="text-[10px] text-slate-500">Desa: {pos.desa}</span>
                  </button>
                ))
              ) : (
                <p className="text-center text-slate-500 text-xs py-6">
                  Tidak ada pengajuan tertunda.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Registration Content */}
      <div className={isReviewer ? 'lg:col-span-3 space-y-6' : 'lg:col-span-4 space-y-6'}>
        {/* Registration Tracker Status Header */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl rounded-2xl shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Building className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">{activeDetails.nama}</h3>
                  <p className="text-xs text-slate-400">
                    Administrasi: Desa {activeDetails.desa}, Kec. {activeDetails.kecamatan}, Kab.{' '}
                    {activeDetails.kabupaten}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Status Kelembagaan
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    activeDetails.status_registrasi === 'terdaftar'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : activeDetails.status_registrasi === 'diajukan'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : activeDetails.status_registrasi === 'dikembalikan'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {activeDetails.status_registrasi}
                </span>
              </div>
            </div>

            {/* Official Registration Number Badge */}
            {activeDetails.status_registrasi === 'terdaftar' && activeDetails.nomor_registrasi && (
              <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" />
                  <span className="text-slate-300 font-semibold">Nomor Registrasi Resmi:</span>
                  <span className="text-emerald-400 font-mono font-bold text-sm tracking-wider">
                    {activeDetails.nomor_registrasi}
                  </span>
                </div>
                {activeDetails.tanggal_terdaftar && (
                  <span className="text-[10px] text-slate-500">
                    Terdaftar sejak: {activeDetails.tanggal_terdaftar}
                  </span>
                )}
              </div>
            )}

            {/* Catatan Registrasi Feedback Alert */}
            {activeDetails.status_registrasi === 'dikembalikan' &&
              activeDetails.catatan_registrasi && (
                <div className="mt-4 p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-xl flex gap-2 text-xs text-rose-400">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold">Catatan Pengembalian Berkas:</h5>
                    <p className="text-rose-400/80 leading-relaxed mt-0.5">
                      {activeDetails.catatan_registrasi}
                    </p>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Guided File Checklist panel */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl rounded-2xl shadow-xl">
          <CardHeader className="border-b border-slate-850 pb-3">
            <CardTitle className="text-sm font-bold text-slate-300">
              Persyaratan Kelengkapan Berkas (Kepmendagri)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {(Object.keys(DOCUMENT_LABELS) as Array<keyof typeof DOCUMENT_LABELS>).map((key) => {
                const uploadedDoc = getDocumentByJenis(key)
                const isUploaded = !!uploadedDoc
                const isUploading = !!uploading[key]

                return (
                  <div
                    key={key}
                    className={`p-4 rounded-xl border flex flex-col justify-between min-h-[170px] relative transition ${
                      isUploaded
                        ? 'bg-slate-950/20 border-emerald-500/20 text-slate-300'
                        : 'bg-slate-950/40 border-slate-850 text-slate-400'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <FileText
                          className={`h-8 w-8 ${isUploaded ? 'text-emerald-400' : 'text-slate-600'}`}
                        />
                        {isUploaded ? (
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="h-4.5 w-4.5 text-slate-600" />
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white leading-normal">
                        {DOCUMENT_LABELS[key]}
                      </h4>
                      {isUploaded && (
                        <p className="text-[10px] text-slate-500 truncate mt-1">
                          {uploadedDoc.nama_file}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-850 flex gap-2">
                      {isUploaded ? (
                        <>
                          <Button
                            onClick={() => handleFileDownload(uploadedDoc.file_path)}
                            type="button"
                            variant="ghost"
                            className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg h-7.5 text-[10px] font-bold flex gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Unduh
                          </Button>
                          {activeDetails.status_registrasi !== 'diajukan' &&
                            activeDetails.status_registrasi !== 'terdaftar' && (
                              <Button
                                onClick={() =>
                                  handleFileDelete(uploadedDoc.id, uploadedDoc.file_path)
                                }
                                disabled={isPending}
                                type="button"
                                variant="ghost"
                                className="px-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 rounded-lg h-7.5 text-[10px]"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                        </>
                      ) : (
                        activeDetails.status_registrasi !== 'diajukan' &&
                        activeDetails.status_registrasi !== 'terdaftar' && (
                          <label className="w-full flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold h-7.5 rounded-lg text-[10px] cursor-pointer gap-1 transition">
                            {isUploading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <UploadCloud className="h-3 w-3" />
                            )}
                            {isUploading ? 'Mengunggah...' : 'Unggah Berkas'}
                            <input
                              type="file"
                              className="hidden"
                              disabled={isUploading}
                              onChange={(e) => handleFileUpload(key, e)}
                            />
                          </label>
                        )
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Submit Action for Posyandu */}
            {activeDetails.status_registrasi !== 'diajukan' &&
              activeDetails.status_registrasi !== 'terdaftar' && (
                <div className="pt-4 border-t border-slate-850 flex justify-end">
                  <Button
                    onClick={handleRegistrationSubmit}
                    disabled={!allDocumentsUploaded || isPending}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold h-9 px-4 rounded-xl flex items-center gap-1.5"
                  >
                    <Send className="h-4 w-4" />
                    Kirim Berkas Registrasi
                  </Button>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Reviewer Action form (Pemdes/Admin) */}
        {isReviewer && activeDetails.status_registrasi === 'diajukan' && (
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl border-emerald-500/20 rounded-2xl shadow-xl">
            <CardHeader className="border-b border-slate-850 pb-3 flex flex-row items-center gap-2">
              <UserCheck className="h-4.5 w-4.5 text-emerald-400" />
              <CardTitle className="text-sm font-bold text-slate-300">
                Form Peninjauan Berkas Pengajuan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {reviewError && (
                <div className="p-3 bg-rose-500/5 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{reviewError}</span>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Nomor Registrasi Resmi (Format PP.KK.KC.DDD.NNN)
                  </label>
                  <Input
                    type="text"
                    value={nomorRegistrasi}
                    onChange={(e) => setNomorRegistrasi(e.target.value)}
                    placeholder="Contoh: 11.01.10.2001.001"
                    disabled={isPending}
                    className="bg-slate-950 border-slate-800 rounded-xl h-9.5 text-xs font-mono tracking-wider"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Catatan Review / Umpan Balik
                  </label>
                  <textarea
                    value={catatanReview}
                    onChange={(e) => setCatatanReview(e.target.value)}
                    placeholder="Isi catatan apabila berkas dikembalikan/ditolak"
                    disabled={isPending}
                    rows={2}
                    className="bg-slate-950 border border-slate-800 rounded-xl text-xs h-9.5 min-h-[38px] py-1.5 px-3 resize-none w-full text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850 flex justify-end gap-3">
                <Button
                  onClick={() => handleReviewSubmit('dikembalikan')}
                  disabled={isPending}
                  type="button"
                  variant="ghost"
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-extrabold h-9 px-4 rounded-xl flex items-center gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  Kembalikan Berkas
                </Button>
                <Button
                  onClick={() => handleReviewSubmit('terdaftar')}
                  disabled={isPending}
                  type="button"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold h-9 px-4 rounded-xl flex items-center gap-1.5"
                >
                  <FileCheck2 className="h-4 w-4" />
                  Setujui & Daftarkan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
