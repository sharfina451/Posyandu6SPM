'use client'

import React, { useState, useTransition } from 'react'
import { getHariBukaSummary } from '@/app/dashboard/laporan/laporan-actions'
import { Button } from '@/components/ui/button'
import { FileText, Copy, Check, X, Loader2, Calendar, Users, AlertTriangle } from 'lucide-react'

interface SummaryButtonProps {
  kunjunganId: string
}

interface SummaryData {
  tanggal: string
  wilayahNama: string
  catatan: string
  totalWarga: number
  bidangCount: Record<string, number>
  stuntingCount: number
  totalRujukan: number
}

export function SummaryButton({ kunjunganId }: SummaryButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Fetch summary data
  const handleOpen = () => {
    setIsOpen(true)
    startTransition(async () => {
      const res = await getHariBukaSummary(kunjunganId)
      if (res.success && res.summary) {
        setSummary(res.summary)
      } else {
        alert(res.error || 'Gagal memuat ringkasan.')
        setIsOpen(false)
      }
    })
  }

  // Copy narrative to clipboard
  const handleCopy = () => {
    if (!summary) return
    const text = `RINGKASAN HARI BUKA POSYANDU LEMAHDUWUR
Tanggal: ${new Date(summary.tanggal).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}
Lokasi/Wilayah: ${summary.wilayahNama}
Total Warga Terlayani: ${summary.totalWarga} Jiwa

RINCIAN LAYANAN 6 SPM:
- Kesehatan: ${summary.bidangCount.kesehatan} layanan
- Pendidikan: ${summary.bidangCount.pendidikan} layanan
- Pekerjaan Umum: ${summary.bidangCount.pekerjaan_umum} layanan
- Perumahan Rakyat: ${summary.bidangCount.perumahan_rakyat} layanan
- Trantibumlinmas: ${summary.bidangCount.trantibumlinmas} layanan
- Sosial: ${summary.bidangCount.sosial} layanan

TEMUAN & TINDAK LANJUT:
- Balita Rawan Stunting/Gizi: ${summary.stuntingCount} Balita
- Rujukan Rencana Aksi (Tiket SPM Baru): ${summary.totalRujukan} Berkas
Catatan Kader: ${summary.catatan || '-'}`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button
        onClick={handleOpen}
        type="button"
        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold h-9.5 px-4 rounded-xl flex items-center gap-1.5 shrink-0 transition"
      >
        <FileText className="h-4 w-4" />
        Ringkasan Hari Buka
      </Button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col justify-between animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="border-b border-slate-850 p-5 flex justify-between items-center bg-slate-950/30">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                <h3 className="font-extrabold text-white text-sm">Ringkasan Sesi Hari Buka</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto max-h-[65vh] space-y-5 text-xs text-slate-300">
              {isPending ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
                  <span className="font-semibold text-slate-400">Menyusun ringkasan data...</span>
                </div>
              ) : summary ? (
                <>
                  {/* Session Overview */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-950/40 rounded-2xl border border-slate-850 flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">
                          Tanggal
                        </span>
                        <span className="font-extrabold text-white">
                          {new Date(summary.tanggal).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/40 rounded-2xl border border-slate-850 flex items-center gap-3">
                      <Users className="h-5 w-5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">
                          Warga Hadir
                        </span>
                        <span className="font-extrabold text-white">
                          {summary.totalWarga} Orang
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 6 SPM Fields Count Grid */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Jumlah Layanan 6 SPM Terdata
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 bg-slate-950/20 rounded-xl border border-slate-850">
                        <span className="text-[10px] text-slate-500 block">Kesehatan</span>
                        <span className="font-bold text-white text-sm">
                          {summary.bidangCount.kesehatan}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-950/20 rounded-xl border border-slate-850">
                        <span className="text-[10px] text-slate-500 block">Pendidikan</span>
                        <span className="font-bold text-white text-sm">
                          {summary.bidangCount.pendidikan}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-950/20 rounded-xl border border-slate-850">
                        <span className="text-[10px] text-slate-500 block">Pekerjaan Umum</span>
                        <span className="font-bold text-white text-sm">
                          {summary.bidangCount.pekerjaan_umum}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-950/20 rounded-xl border border-slate-850">
                        <span className="text-[10px] text-slate-500 block">Perumahan</span>
                        <span className="font-bold text-white text-sm">
                          {summary.bidangCount.perumahan_rakyat}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-950/20 rounded-xl border border-slate-850">
                        <span className="text-[10px] text-slate-500 block">Trantibum</span>
                        <span className="font-bold text-white text-sm">
                          {summary.bidangCount.trantibumlinmas}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-950/20 rounded-xl border border-slate-850">
                        <span className="text-[10px] text-slate-500 block">Sosial</span>
                        <span className="font-bold text-white text-sm">
                          {summary.bidangCount.sosial}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Findings & Actions */}
                  <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex gap-3 items-start">
                    <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-rose-400">Deteksi Risiko & Tindak Lanjut</h5>
                      <p className="text-[11px] text-rose-400/80 leading-relaxed mt-0.5">
                        Ditemukan{' '}
                        <strong>{summary.stuntingCount} balita stunting/gizi kurang</strong> pada
                        hari ini. Sistem telah menerbitkan{' '}
                        <strong>{summary.totalRujukan} rujukan tiket aktif</strong> untuk
                        dikoordinasikan dengan instansi/OPD terkait.
                      </p>
                    </div>
                  </div>

                  {/* Narrative Preview */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Teks Ringkasan Laporan (WA / Pemdes)
                    </span>
                    <pre className="p-3.5 bg-slate-950 rounded-2xl border border-slate-855 font-mono text-[10px] text-emerald-400 leading-relaxed whitespace-pre-wrap select-all">
                      {`RINGKASAN HARI BUKA POSYANDU LEMAHDUWUR\nTanggal: ${new Date(summary.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\nLokasi: ${summary.wilayahNama}\n\n- Layanan Kesehatan: ${summary.bidangCount.kesehatan} anak\n- Layanan Pendidikan: ${summary.bidangCount.pendidikan} anak\n- Kasus Stunting: ${summary.stuntingCount} balita\n- Rujukan Diterbitkan: ${summary.totalRujukan} tiket\n- Total Hadir: ${summary.totalWarga} warga`}
                    </pre>
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-850 p-4 flex justify-end gap-3 bg-slate-950/30">
              <Button
                onClick={() => setIsOpen(false)}
                type="button"
                variant="ghost"
                className="bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl h-9 text-xs font-bold"
              >
                Tutup
              </Button>
              <Button
                onClick={handleCopy}
                disabled={!summary}
                type="button"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold h-9 px-4 rounded-xl flex items-center gap-1.5 transition"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Salin Ringkasan
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
