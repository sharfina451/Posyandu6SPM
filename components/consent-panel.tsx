'use client'

import React, { useState, useTransition } from 'react'
import { saveConsentAction, ConsentHistoryItem } from '@/app/dashboard/warga/consent-actions'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck,
  ShieldAlert,
  PlusCircle,
  X,
  Loader2,
  CheckCircle2,
  History,
} from 'lucide-react'

interface ConsentPanelProps {
  wargaId: string
  initialHistory: ConsentHistoryItem[]
}

const METODE_LABELS: Record<string, string> = {
  tertulis: 'Tertulis (Tanda Tangan Fisik)',
  lisan: 'Lisan (Pernyataan Verbal)',
  digital: 'Digital (Checkbox/OTP)',
}

const TUJUAN_OPTIONS = [
  { value: 'Semua pemrosesan data layanan LKD Posyandu 6 SPM', label: 'Semua Layanan LKD 6 SPM' },
  {
    value: 'Pemrosesan data kesehatan dan deteksi stunting',
    label: 'Kesehatan & Deteksi Stunting',
  },
  {
    value: 'Pengajuan program bantuan sosial (Bansos) & data ekonomi',
    label: 'Bansos & Data Ekonomi',
  },
  { value: 'Pemrosesan data kependudukan dan registrasi wilayah', label: 'Kependudukan & Wilayah' },
]

export function ConsentPanel({ wargaId, initialHistory }: ConsentPanelProps) {
  const [history, setHistory] = useState<ConsentHistoryItem[]>(initialHistory)
  const [isOpen, setIsOpen] = useState(false)
  const [tujuan, setTujuan] = useState(TUJUAN_OPTIONS[0].value)
  const [disetujui, setDisetujui] = useState(true)
  const [metode, setMetode] = useState('tertulis')
  const [isPending, startTransition] = useTransition()

  const activeConsent = history[0]
  const isConsentActive = activeConsent?.disetujui === true

  const handleSaveConsent = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await saveConsentAction(wargaId, tujuan, disetujui, metode)
      if (res.success) {
        // Refresh local list of logs
        const { getConsentHistory } = await import('@/app/dashboard/warga/consent-actions')
        const refreshed = await getConsentHistory(wargaId)
        if (refreshed.success && refreshed.list) {
          setHistory(refreshed.list)
        }
        setIsOpen(false)
      } else {
        alert(res.error || 'Gagal menyimpan persetujuan.')
      }
    })
  }

  return (
    <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
      <CardHeader className="border-b border-slate-850 pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-md font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          Kepatuhan UU PDP (Consent)
        </CardTitle>
        <Button
          onClick={() => setIsOpen(true)}
          type="button"
          variant="ghost"
          className="h-8 px-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold flex gap-1 items-center"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Catat Consent
        </Button>
      </CardHeader>
      <CardContent className="pt-6 space-y-4 text-xs">
        {/* Active Status Banner */}
        {isConsentActive ? (
          <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 rounded-xl flex gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Persetujuan Pemrosesan Aktif</span>
              <p className="text-[10px] mt-0.5 leading-relaxed text-emerald-400/80">
                Warga memberikan persetujuan untuk: <strong>{activeConsent.tujuan}</strong> via{' '}
                {METODE_LABELS[activeConsent.metode || ''] || activeConsent.metode}.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-rose-500/5 border border-rose-500/20 text-rose-400 rounded-xl flex gap-2">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Belum Ada Persetujuan Aktif</span>
              <p className="text-[10px] mt-0.5 leading-relaxed text-rose-400/80">
                Persetujuan pemrosesan data PII belum tercatat/ditolak. Harap mintakan formulir
                persetujuan UU PDP kepada warga sebelum melakukan pendataan lebih lanjut.
              </p>
            </div>
          </div>
        )}

        {/* History log collapsible / small list */}
        <div className="space-y-2 pt-2 border-t border-slate-850">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block flex items-center gap-1">
            <History className="h-3.5 w-3.5" /> Riwayat Deklarasi Consent ({history.length})
          </span>
          {history.length > 0 ? (
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {history.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-850 flex justify-between gap-3 text-[10px] text-slate-400"
                >
                  <div className="space-y-0.5">
                    <span
                      className={`font-bold ${log.disetujui ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                      {log.disetujui ? 'DISETUJUI' : 'DITOLAK'} - {log.tujuan}
                    </span>
                    <div className="flex gap-2 text-slate-500 font-semibold">
                      <span>Metode: {METODE_LABELS[log.metode || ''] || log.metode || '-'}</span>
                      <span>•</span>
                      <span>Verifikator: {log.operator_name}</span>
                    </div>
                  </div>
                  <span className="text-right text-[9px] text-slate-600 font-bold block shrink-0 mt-0.5">
                    {new Date(log.tanggal).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-[10px] text-slate-600 italic block py-4 text-center">
              Belum ada log riwayat PDP.
            </span>
          )}
        </div>
      </CardContent>

      {/* Record Consent Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveConsent}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col justify-between animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="border-b border-slate-850 p-5 flex justify-between items-center bg-slate-950/30">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="font-extrabold text-white text-sm">
                  Catat Deklarasi Persetujuan (Consent)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs text-slate-300">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tujuan Pemrosesan Data
                </label>
                <Select
                  value={tujuan}
                  onChange={(e) => setTujuan(e.target.value)}
                  disabled={isPending}
                  className="bg-slate-950 border-slate-800 rounded-xl text-xs h-9.5 w-full"
                >
                  {TUJUAN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Metode Deklarasi Persetujuan
                </label>
                <Select
                  value={metode}
                  onChange={(e) => setMetode(e.target.value)}
                  disabled={isPending}
                  className="bg-slate-950 border-slate-800 rounded-xl text-xs h-9.5 w-full"
                >
                  {Object.entries(METODE_LABELS).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex items-start gap-2.5 p-3.5 bg-slate-950 rounded-2xl border border-slate-850">
                <input
                  type="checkbox"
                  id="consent_check"
                  checked={disetujui}
                  onChange={(e) => setDisetujui(e.target.checked)}
                  disabled={isPending}
                  className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500 mt-0.5 shrink-0"
                />
                <label
                  htmlFor="consent_check"
                  className="text-[11px] text-slate-400 leading-normal select-none cursor-pointer font-medium"
                >
                  Dengan ini menyatakan warga memberikan persetujuan secara sadar untuk pemrosesan
                  data pribadi tersebut di atas sesuai UU PDP.
                </label>
              </div>
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
                type="submit"
                disabled={isPending}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold h-9 px-4 rounded-xl flex items-center gap-1.5 transition"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Persetujuan'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </Card>
  )
}
