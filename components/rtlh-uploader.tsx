'use client'

import React, { useState, useTransition } from 'react'
import { DocumentUploader } from './document-uploader'
import { deleteDocumentAction, getSignedUrlAction } from '@/app/dashboard/tiket/storage-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Trash2, Image as ImageIcon, Loader2, FileDown } from 'lucide-react'
import type { DokumenItem } from '@/app/dashboard/tiket/[id]/ticket-detail-client'

interface RtlhUploaderProps {
  ticketId: string
  wargaId: string
  existingDocs: DokumenItem[]
  onUploadSuccess: (newDoc: DokumenItem) => void
  onDeleteSuccess: (docId: string) => void
}

export function RtlhUploader({
  ticketId,
  wargaId,
  existingDocs,
  onUploadSuccess,
  onDeleteSuccess,
}: RtlhUploaderProps) {
  const [, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const slots = [
    {
      key: 'FOTO_RUMAH_DEPAN',
      title: 'Tampak Depan Rumah',
      guideline: 'Menampilkan tampak muka rumah secara utuh termasuk bagian atap.',
    },
    {
      key: 'FOTO_RUMAH_SAMPING',
      title: 'Tampak Samping Rumah',
      guideline: 'Menampilkan kondisi dinding samping, pondasi, dan kusen jendela.',
    },
    {
      key: 'FOTO_RUMAH_DALAM',
      title: 'Tampak Dalam Rumah',
      guideline: 'Menampilkan kondisi dalam ruangan, lantai, sekat, atau area dapur.',
    },
  ]

  const handleDownload = async (urlBerkas: string) => {
    try {
      const res = await getSignedUrlAction(urlBerkas)
      if (res.success && res.signedUrl) {
        window.open(res.signedUrl, '_blank')
      } else {
        alert(res.error || 'Gagal mengunduh berkas.')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan sistem saat mencoba mengunduh.')
    }
  }

  const handleDelete = (docId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus foto ini?')) return

    setDeletingId(docId)
    startTransition(async () => {
      const res = await deleteDocumentAction(docId)
      if (res.success) {
        onDeleteSuccess(docId)
      } else {
        alert(res.error || 'Gagal menghapus dokumen.')
      }
      setDeletingId(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-xs text-blue-400">
        📌 <strong>Panduan RTLH:</strong> Harap mengunggah 3 foto rumah dari sudut yang berbeda
        sesuai panduan slot di bawah untuk verifikasi kelayakan bantuan rehab.
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {slots.map((slot) => {
          const uploadedDoc = existingDocs.find((d) => d.jenis.toUpperCase() === slot.key)

          return (
            <Card
              key={slot.key}
              className="bg-slate-900 border-slate-800/80 rounded-xl overflow-hidden shadow-lg flex flex-col justify-between"
            >
              <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                    {slot.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">{slot.guideline}</p>
                </div>

                <div className="pt-2">
                  {uploadedDoc ? (
                    <div className="bg-emerald-500/5 border border-emerald-500/15 p-3 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400">
                        <Check className="h-3.5 w-3.5 shrink-0 bg-emerald-500/10 rounded-full p-0.5" />
                        <span>Foto Berhasil Diunggah</span>
                      </div>
                      <div className="flex gap-1.5 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(uploadedDoc.url_berkas)}
                          className="h-7 w-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5 rounded-lg"
                          title="Unduh Berkas"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(uploadedDoc.id)}
                          disabled={deletingId === uploadedDoc.id}
                          className="h-7 w-7 text-rose-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg"
                          title="Hapus Berkas"
                        >
                          {deletingId === uploadedDoc.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <DocumentUploader
                      ticketId={ticketId}
                      wargaId={wargaId}
                      jenis={slot.key}
                      onUploadSuccess={onUploadSuccess}
                      label={`Unggah ${slot.title.split(' ')[1] || 'Foto'}`}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
