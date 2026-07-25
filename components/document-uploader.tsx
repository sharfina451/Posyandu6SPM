'use client'

import React, { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { saveDocumentMetadataAction } from '@/app/dashboard/tiket/storage-actions'
import { compressImage, getCompressedSizeRatio } from '@/lib/utils/image-compression'
import { Button } from '@/components/ui/button'
import { UploadCloud, Loader2, CheckCircle, FileText, AlertCircle } from 'lucide-react'
import type { DokumenItem } from '@/app/dashboard/tiket/[id]/ticket-detail-client'

interface DocumentUploaderProps {
  ticketId: string
  wargaId: string
  jenis: string
  onUploadSuccess: (newDoc: DokumenItem) => void
  label?: string
}

export function DocumentUploader({
  ticketId,
  wargaId,
  jenis,
  onUploadSuccess,
  label = 'Pilih Berkas',
}: DocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Compression Stats
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number
    compressedSize: number
    ratio: string
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setSuccess(false)
    setCompressionStats(null)

    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      // Limit file size to 10MB before compression
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Ukuran berkas melebihi batas 10MB.')
        return
      }
      setFile(selectedFile)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      let fileToUpload = file
      const originalSize = file.size

      // 1. Client-side image compression for quota saving
      if (file.type.startsWith('image/')) {
        fileToUpload = await compressImage(file, 1200, 0.7)
        const compressedSize = fileToUpload.size

        if (compressedSize < originalSize) {
          const ratio = getCompressedSizeRatio(originalSize, compressedSize)
          setCompressionStats({
            originalSize,
            compressedSize,
            ratio,
          })
          console.log(
            `[Compression] Saved ${ratio} size (${formatSize(originalSize)} -> ${formatSize(compressedSize)})`
          )
        }
      }

      // 2. Initialize Supabase Browser Client
      const supabase = createClient()

      // 3. Define unique storage path: ticket_id/jenis_timestamp_filename
      const safeFileName = fileToUpload.name.replace(/[^a-zA-Z0-9.]/g, '_')
      const storagePath = `${ticketId}/${jenis.toLowerCase()}_${Date.now()}_${safeFileName}`

      // 4. Upload file to 'dokumen' private bucket
      const { data: storageData, error: errStorage } = await supabase.storage
        .from('dokumen')
        .upload(storagePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
        })

      if (errStorage) {
        throw new Error(`Gagal mengunggah berkas ke storage: ${errStorage.message}`)
      }

      // 5. Call server action to save metadata in public.dokumen_persyaratan
      const res = await saveDocumentMetadataAction({
        ticketId,
        wargaId,
        jenis,
        urlBerkas: storageData.path,
        keterangan: compressionStats ? `Compressed: ${compressionStats.ratio} saved` : undefined,
      })

      if (!res.success || !res.data) {
        // Cleanup storage file on metadata failure
        await supabase.storage.from('dokumen').remove([storageData.path])
        throw new Error(res.error || 'Gagal menyimpan metadata dokumen.')
      }

      setSuccess(true)
      setFile(null)
      onUploadSuccess(res.data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunggah.'
      setError(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-slate-950/60 p-4 border border-slate-800/80 rounded-xl space-y-3">
      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <div>
            <p className="font-bold">Unggahan Berhasil!</p>
            {compressionStats && (
              <p className="text-[10px] text-emerald-400/80 mt-0.5">
                Gambar berhasil dikompresi (Hemat kuota sebesar {compressionStats.ratio}).
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          disabled={uploading}
        />

        {/* Picker Trigger */}
        {!file ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="border-slate-800 hover:bg-slate-900 hover:text-white rounded-xl text-xs flex items-center justify-center gap-1.5 h-9"
          >
            <UploadCloud className="h-4 w-4 text-slate-500" />
            {label}
          </Button>
        ) : (
          <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-2 px-3 border border-slate-800 rounded-xl text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                  {file.name}
                </p>
                <p className="text-[10px] text-slate-500">{formatSize(file.size)}</p>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setFile(null)}
                disabled={uploading}
                className="text-slate-400 hover:text-white h-8 text-[11px] rounded-lg px-2.5"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold h-8 text-[11px] rounded-lg px-3 flex items-center gap-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Mengunggah...
                  </>
                ) : (
                  'Unggah'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
