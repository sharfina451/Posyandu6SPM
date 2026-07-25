'use client'

import React, { useState, useTransition } from 'react'
import { getAuditLogs, AuditLogItem } from './audit-actions'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ShieldAlert, Search, Eye, X, User, Database } from 'lucide-react'

interface AuditClientProps {
  initialLogs: AuditLogItem[]
}

const ACTION_LABELS: Record<string, string> = {
  create: 'TAMBAH (Create)',
  update: 'UBAH (Update)',
  delete: 'HAPUS (Delete)',
  export: 'EKSPOR (Export)',
  login: 'MASUK (Login)',
  sync: 'SINKRONISASI (Sync)',
}

const TABLE_LABELS: Record<string, string> = {
  warga: 'Data Warga',
  rumah_tangga: 'Data Rumah Tangga',
  pemeriksaan_kesehatan: 'Pemeriksaan Kesehatan',
  laporan_bulanan: 'Laporan Bulanan',
  pengguna: 'Data Pengguna',
}

export function AuditClient({ initialLogs }: AuditClientProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>(initialLogs)
  const [aksi, setAksi] = useState('all')
  const [tabel, setTabel] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null)
  const [isPending, startTransition] = useTransition()

  // Handle filter submissions
  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await getAuditLogs({
        aksi,
        tabel,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      if (res.success && res.logs) {
        setLogs(res.logs)
      } else {
        alert(res.error || 'Gagal memuat log audit.')
      }
    })
  }

  // Reset filters
  const handleReset = () => {
    setAksi('all')
    setTabel('all')
    setStartDate('')
    setEndDate('')
    startTransition(async () => {
      const res = await getAuditLogs()
      if (res.success && res.logs) {
        setLogs(res.logs)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl rounded-2xl shadow-xl">
        <CardHeader className="border-b border-slate-850 pb-3 flex flex-row items-center gap-2">
          <Search className="h-4 w-4 text-emerald-400" />
          <CardTitle className="text-sm font-bold text-slate-300">
            Filter Log Penelusuran Audit
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleFilter} className="grid gap-4 md:grid-cols-5 items-end">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Jenis Tindakan (Aksi)
              </label>
              <Select
                value={aksi}
                onChange={(e) => setAksi(e.target.value)}
                disabled={isPending}
                className="bg-slate-950 border-slate-800 rounded-xl text-xs h-9.5 w-full"
              >
                <option value="all">Semua Tindakan</option>
                {Object.entries(ACTION_LABELS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Tabel Basis Data
              </label>
              <Select
                value={tabel}
                onChange={(e) => setTabel(e.target.value)}
                disabled={isPending}
                className="bg-slate-950 border-slate-800 rounded-xl text-xs h-9.5 w-full"
              >
                <option value="all">Semua Tabel</option>
                {Object.entries(TABLE_LABELS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Mulai Tanggal
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isPending}
                className="bg-slate-950 border-slate-800 rounded-xl text-xs h-9.5"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Sampai Tanggal
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isPending}
                className="bg-slate-950 border-slate-800 rounded-xl text-xs h-9.5"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleReset}
                disabled={isPending}
                variant="ghost"
                className="bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl h-9.5 flex-1 text-xs font-bold"
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold h-9.5 px-4 rounded-xl flex items-center justify-center gap-1.5 flex-1 transition"
              >
                Cari Log
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl rounded-2xl shadow-xl">
        <CardHeader className="border-b border-slate-850 pb-3">
          <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-400" />
            Catatan Perubahan Data Aktif (Limit 100 Entri Terbaru)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-950/40">
                    <th className="p-4 w-12 text-center">No</th>
                    <th className="p-4">Tanggal (Kapan)</th>
                    <th className="p-4">Operator (Siapa)</th>
                    <th className="p-4">Tindakan</th>
                    <th className="p-4">Tabel</th>
                    <th className="p-4">Record ID</th>
                    <th className="p-4 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((item, index) => {
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-850 hover:bg-slate-950/20 text-slate-300 transition"
                      >
                        <td className="p-4 text-center font-bold text-slate-500">{index + 1}</td>
                        <td className="p-4 font-bold text-white">
                          {new Date(item.pada).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-1 font-bold text-slate-200">
                            <User className="h-3.5 w-3.5 text-slate-500" />
                            {item.operator_name}
                          </span>
                        </td>
                        <td className="p-4">
                          {item.aksi === 'create' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                              CREATE
                            </span>
                          )}
                          {item.aksi === 'update' && (
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-[10px]">
                              UPDATE
                            </span>
                          )}
                          {item.aksi === 'delete' && (
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-[10px]">
                              DELETE
                            </span>
                          )}
                          {item.aksi === 'export' && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[10px]">
                              EXPORT
                            </span>
                          )}
                          {item.aksi === 'login' && (
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold text-[10px]">
                              LOGIN
                            </span>
                          )}
                          {item.aksi === 'sync' && (
                            <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold text-[10px]">
                              SYNC
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-semibold text-slate-400">
                          {item.tabel ? TABLE_LABELS[item.tabel] || item.tabel : '-'}
                        </td>
                        <td className="p-4 font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                          {item.record_id || '-'}
                        </td>
                        <td className="p-4 text-center">
                          {item.data_lama || item.data_baru ? (
                            <Button
                              onClick={() => setSelectedLog(item)}
                              type="button"
                              variant="ghost"
                              className="h-8 px-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold flex gap-1 items-center mx-auto"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Detail
                            </Button>
                          ) : (
                            <span className="text-[10px] text-slate-600 font-medium">
                              No Payload
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs">
              Tidak ada catatan perubahan data yang cocok dengan kriteria filter.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Difference JSON Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col justify-between animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="border-b border-slate-850 p-5 flex justify-between items-center bg-slate-950/30">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-emerald-400" />
                <h3 className="font-extrabold text-white text-sm">
                  Payload Detail Perubahan: Tabel {selectedLog.tabel}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                {/* Data Lama */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">
                    Sebelum (Data Lama)
                  </span>
                  {selectedLog.data_lama ? (
                    <pre className="p-4 bg-rose-950/10 border border-rose-500/20 text-rose-300 font-mono text-[10px] rounded-2xl overflow-auto max-h-[40vh] leading-relaxed">
                      {JSON.stringify(selectedLog.data_lama, null, 2)}
                    </pre>
                  ) : (
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 text-slate-500 italic text-center text-[10px]">
                      (Tidak ada data sebelumnya / record baru dibuat)
                    </div>
                  )}
                </div>

                {/* Data Baru */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                    Sesudah (Data Baru)
                  </span>
                  {selectedLog.data_baru ? (
                    <pre className="p-4 bg-emerald-950/10 border border-emerald-500/20 text-emerald-300 font-mono text-[10px] rounded-2xl overflow-auto max-h-[40vh] leading-relaxed">
                      {JSON.stringify(selectedLog.data_baru, null, 2)}
                    </pre>
                  ) : (
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 text-slate-500 italic text-center text-[10px]">
                      (Tidak ada data baru / record dihapus)
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata log info */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850 flex gap-4 text-[10px] text-slate-500 font-medium justify-between">
                <span>ID Log: {selectedLog.id}</span>
                <span>IP Operator: {selectedLog.ip || 'Local / API'}</span>
                <span>Tanggal Log: {new Date(selectedLog.pada).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-850 p-4 flex justify-end bg-slate-950/30">
              <Button
                onClick={() => setSelectedLog(null)}
                type="button"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold h-9 px-6 rounded-xl"
              >
                Tutup Detail
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
