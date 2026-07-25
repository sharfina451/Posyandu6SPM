'use client'

import React, { useState, useTransition } from 'react'
import { generateMonthlyReport, deleteLaporanAction, LaporanHistoryItem } from './laporan-actions'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  FileSpreadsheet,
  FileText,
  Download,
  Trash2,
  Calendar,
  Sparkles,
  Loader2,
  PlusCircle,
} from 'lucide-react'

interface LaporanClientProps {
  initialHistory: LaporanHistoryItem[]
  currentUserRole: string
}

const BIDANG_LABELS: Record<string, string> = {
  pendidikan: 'Pendidikan',
  kesehatan: 'Kesehatan',
  pekerjaan_umum: 'Pekerjaan Umum',
  perumahan_rakyat: 'Perumahan Rakyat',
  trantibumlinmas: 'Trantibumlinmas',
  sosial: 'Sosial',
}

export function LaporanClient({ initialHistory, currentUserRole }: LaporanClientProps) {
  const [history, setHistory] = useState<LaporanHistoryItem[]>(initialHistory)
  const [periode, setPeriode] = useState<string>(() => {
    const today = new Date()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    return `${today.getFullYear()}-${month}`
  })
  const [bidang, setBidang] = useState<string>('all')
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf')
  const [isPending, startTransition] = useTransition()
  const [generating, setGenerating] = useState(false)

  const isEditor =
    currentUserRole === 'admin' || currentUserRole === 'pemdes' || currentUserRole === 'kader'

  // Handle generation action
  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault()
    if (!periode) return

    setGenerating(true)
    startTransition(async () => {
      try {
        const res = await generateMonthlyReport(periode, bidang, format)
        if (res.success && res.url) {
          // Open download in new tab
          window.open(res.url, '_blank')

          // Refresh list of logs
          const { getLaporanHistory } = await import('./laporan-actions')
          const refreshed = await getLaporanHistory()
          if (refreshed.success && refreshed.list) {
            setHistory(refreshed.list)
          }
        } else {
          alert(res.error || 'Gagal membuat laporan.')
        }
      } catch {
        alert('Terjadi kesalahan saat memproses laporan.')
      } finally {
        setGenerating(false)
      }
    })
  }

  // Handle deletion of report log
  const handleDeleteReport = (id: string, filePath: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus log laporan dan file fisiknya dari storage?'))
      return

    startTransition(async () => {
      const res = await deleteLaporanAction(id, filePath)
      if (res.success) {
        setHistory((prev) => prev.filter((item) => item.id !== id))
      } else {
        alert(res.error || 'Gagal menghapus laporan.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Export Report Form */}
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl rounded-2xl shadow-xl">
        <CardHeader className="border-b border-slate-850 pb-3 flex flex-row items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <CardTitle className="text-sm font-bold text-slate-300">
            Ekspor Laporan Bulanan LKD 6 SPM
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleGenerateReport} className="grid gap-6 md:grid-cols-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Periode Bulan laporan
              </label>
              <Input
                type="month"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                disabled={generating || isPending}
                className="bg-slate-950 border-slate-800 rounded-xl text-xs h-9.5"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Bidang SPM (Opsional)
              </label>
              <Select
                value={bidang}
                onChange={(e) => setBidang(e.target.value)}
                disabled={generating || isPending}
                className="bg-slate-950 border-slate-800 rounded-xl text-xs h-9.5 w-full"
              >
                <option value="all">Semua Bidang (Gabungan)</option>
                {Object.entries(BIDANG_LABELS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Format Dokumen Output
              </label>
              <Select
                value={format}
                onChange={(e) => setFormat(e.target.value as 'pdf' | 'excel')}
                disabled={generating || isPending}
                className="bg-slate-950 border-slate-800 rounded-xl text-xs h-9.5 w-full"
              >
                <option value="pdf">Dokumen Portable (PDF)</option>
                <option value="excel">Spreadsheet Excel (XLSX)</option>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={generating || isPending || !isEditor}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold h-9.5 px-4 rounded-xl flex items-center justify-center gap-1.5 w-full transition"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Membuat File...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Buat & Unduh Laporan
                </>
              )}
            </Button>
          </form>

          {!isEditor && (
            <p className="text-[10px] text-amber-500 font-semibold mt-2.5">
              ⚠️ Peran Anda dibatasi. Hanya Kader, Bidan, Pemdes, dan Admin yang dapat memicu
              pembuatan laporan baru.
            </p>
          )}
        </CardContent>
      </Card>

      {/* History Log Table */}
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl rounded-2xl shadow-xl">
        <CardHeader className="border-b border-slate-850 pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <CardTitle className="text-sm font-bold text-slate-300">
              Riwayat Berkas Hasil Laporan
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-950/40">
                    <th className="p-4 w-12 text-center">No</th>
                    <th className="p-4">Periode</th>
                    <th className="p-4">Bidang SPM</th>
                    <th className="p-4">Nama File</th>
                    <th className="p-4 text-center">Format</th>
                    <th className="p-4">Dibuat Oleh</th>
                    <th className="p-4">Dibuat Pada</th>
                    <th className="p-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => {
                    const monthYear = item.periode.substring(0, 7)
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-850 hover:bg-slate-950/20 text-slate-300 transition"
                      >
                        <td className="p-4 text-center font-bold text-slate-500">{index + 1}</td>
                        <td className="p-4 font-bold text-white">{monthYear}</td>
                        <td className="p-4">
                          {item.bidang ? BIDANG_LABELS[item.bidang] || item.bidang : 'Semua Bidang'}
                        </td>
                        <td className="p-4 font-mono truncate max-w-[180px]">{item.nama_file}</td>
                        <td className="p-4 text-center">
                          {item.format === 'excel' ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                              <FileSpreadsheet className="h-3 w-3" />
                              EXCEL
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-[10px]">
                              <FileText className="h-3 w-3" />
                              PDF
                            </span>
                          )}
                        </td>
                        <td className="p-4">{item.creator_name || 'Sistem'}</td>
                        <td className="p-4 text-slate-400">
                          {new Date(item.dibuat_pada).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-1.5">
                            {/* Download Button */}
                            <Button
                              onClick={async () => {
                                const { getRegistrationSignedUrl } =
                                  await import('../registrasi/registrasi-actions')
                                const res = await getRegistrationSignedUrl(item.file_path)
                                if (res.success && res.url) {
                                  window.open(res.url, '_blank')
                                } else {
                                  alert(res.error || 'Gagal mengunduh berkas.')
                                }
                              }}
                              type="button"
                              variant="ghost"
                              className="h-8 w-8 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 p-0"
                              title="Unduh Berkas"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {/* Delete Button (Only for Admin/Pemdes roles) */}
                            {(currentUserRole === 'admin' || currentUserRole === 'pemdes') && (
                              <Button
                                onClick={() => handleDeleteReport(item.id, item.file_path)}
                                type="button"
                                variant="ghost"
                                className="h-8 w-8 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 p-0"
                                title="Hapus Berkas"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs">
              Tidak ada riwayat ekspor laporan bulanan terdata saat ini.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
