'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { getDashboardStats, DashboardStats } from './actions'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Users,
  Ticket,
  AlertTriangle,
  MapPin,
  RefreshCw,
  TrendingUp,
  BarChart4,
  PieChart as PieIcon,
  ShieldAlert,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'

interface DashboardClientProps {
  initialStats: DashboardStats
  currentUserRole: string
  currentUserWilayahCode: string | null
}

const STATUS_COLORS: Record<string, string> = {
  didata: '#64748b', // slate
  verifikasi_kunjungan: '#3b82f6', // blue
  diajukan_pemdes: '#f59e0b', // amber
  disposisi_opd: '#a855f7', // purple
  selesai: '#10b981', // emerald
  ditolak: '#f43f5e', // rose
}

const BIDANG_LABELS: Record<string, string> = {
  pendidikan: 'Pendidikan',
  kesehatan: 'Kesehatan',
  pekerjaan_umum: 'Pekerjaan Umum',
  perumahan_rakyat: 'Perumahan Rakyat',
  trantibumlinmas: 'Trantibumlinmas',
  sosial: 'Sosial',
}

const STATUS_LABELS: Record<string, string> = {
  didata: 'Didata',
  verifikasi_kunjungan: 'Verifikasi Kunjungan',
  diajukan_pemdes: 'Diajukan Pemdes',
  disposisi_opd: 'Disposisi OPD',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
}

export function DashboardClient({
  initialStats,
  currentUserRole,
  currentUserWilayahCode,
}: DashboardClientProps) {
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [filterRw, setFilterRw] = useState<string>('all')
  const [filterPeriod, setFilterPeriod] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFilterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    startTransition(async () => {
      const res = await getDashboardStats({
        rwId: filterRw,
        periodBulan: filterPeriod || undefined,
      })
      if (res.success && res.data) {
        setStats(res.data)
      } else {
        alert(res.error || 'Gagal menyegarkan dasbor.')
      }
    })
  }

  // Bidang Stats mapped for Recharts
  const chartBidangData = stats.bidangStats.map((item) => ({
    name: BIDANG_LABELS[item.bidang] || item.bidang,
    Jumlah: item.count,
  }))

  // Status Stats mapped for Recharts
  const chartStatusData = stats.statusStats
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: STATUS_LABELS[item.status] || item.status,
      value: item.count,
      statusKey: item.status,
    }))

  // Monthly trend data
  const chartTrendData = stats.monthlyTrend.map((item) => ({
    Bulan: item.month,
    Tiket: item.count,
  }))

  return (
    <div className="space-y-6">
      {/* Filters Form */}
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl rounded-2xl shadow-xl">
        <CardContent className="p-4 sm:p-5">
          <form
            onSubmit={handleFilterSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4"
          >
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Cakupan Wilayah RW
              </label>
              <Select
                value={filterRw}
                onChange={(e) => setFilterRw(e.target.value)}
                disabled={isPending || currentUserRole === 'kader'}
                className="bg-slate-950 border-slate-800 rounded-xl text-xs h-9 w-full"
              >
                <option value="all">Semua RW (Lemahduwur)</option>
                {initialStats.rwsList.map((rw) => (
                  <option key={rw.id} value={rw.id}>
                    RW {rw.kode} ({rw.nama})
                  </option>
                ))}
              </Select>
            </div>

            <div className="w-full sm:w-48 space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Periode Bulan
              </label>
              <Input
                type="month"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                disabled={isPending}
                className="bg-slate-950 border-slate-800 rounded-xl text-xs h-9"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold h-9 px-4 rounded-xl flex items-center justify-center gap-1.5 shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
              Segarkan
            </Button>
          </form>

          {currentUserRole === 'kader' && currentUserWilayahCode && (
            <p className="text-[10px] text-amber-500 font-bold mt-2">
              ⚠️ Hak akses Anda dibatasi pada wilayah kerja: {currentUserWilayahCode}
            </p>
          )}
        </CardContent>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Warga */}
        <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-xl rounded-2xl relative overflow-hidden group hover:border-emerald-500/20 transition duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-400">Total Warga Terdata</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-white">{stats.totalWarga}</div>
            <p className="text-[10px] text-slate-500 mt-1">Dalam basis data 6 SPM</p>
          </CardContent>
        </Card>

        {/* Total Active Tickets */}
        <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-xl rounded-2xl relative overflow-hidden group hover:border-emerald-500/20 transition duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-400">Tiket Aktif Berjalan</span>
            <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
              <Ticket className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-white">{stats.totalTiketActive}</div>
            <p className="text-[10px] text-slate-500 mt-1">Proses verifikasi & rujukan</p>
          </CardContent>
        </Card>

        {/* Total Overdue SLA */}
        <Card
          className={`border-slate-800/80 backdrop-blur-xl rounded-2xl relative overflow-hidden group transition duration-300 ${
            stats.totalTiketOverdue > 0
              ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/30'
              : 'bg-slate-900/40 hover:border-emerald-500/20'
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-400">Tiket Terlambat (SLA)</span>
            <div
              className={`p-1.5 rounded-lg ${
                stats.totalTiketOverdue > 0
                  ? 'bg-rose-500/15 text-rose-400'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-extrabold ${
                stats.totalTiketOverdue > 0 ? 'text-rose-500 animate-pulse' : 'text-white'
              }`}
            >
              {stats.totalTiketOverdue}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Melebihi tenggat 5 hari kerja</p>
          </CardContent>
        </Card>

        {/* Total Kunjungan */}
        <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-xl rounded-2xl relative overflow-hidden group hover:border-emerald-500/20 transition duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-400">Total Kunjungan Rumah</span>
            <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg">
              <MapPin className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-white">{stats.totalKunjungan}</div>
            <p className="text-[10px] text-slate-500 mt-1">Door-to-door / hari buka</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Graphs Grid */}
      {mounted && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Bidang SPM BarChart */}
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl rounded-2xl lg:col-span-2 shadow-xl flex flex-col justify-between">
            <CardHeader className="border-b border-slate-800 pb-3 flex flex-row items-center gap-2">
              <BarChart4 className="h-4 w-4 text-emerald-400" />
              <CardTitle className="text-sm font-bold text-slate-300">
                Sebaran Usulan per Bidang SPM
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartBidangData}
                  margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                >
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#f8fafc',
                    }}
                  />
                  <Bar dataKey="Jumlah" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status PieChart */}
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl rounded-2xl shadow-xl flex flex-col justify-between">
            <CardHeader className="border-b border-slate-800 pb-3 flex flex-row items-center gap-2">
              <PieIcon className="h-4 w-4 text-emerald-400" />
              <CardTitle className="text-sm font-bold text-slate-300 flex-1">
                Proporsi Status Tiket
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex-1 flex flex-col items-center justify-center min-h-[300px]">
              {chartStatusData.length > 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-between">
                  <div className="w-full flex-1 min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartStatusData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={STATUS_COLORS[entry.statusKey] || '#64748b'}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#1e293b',
                            borderRadius: '12px',
                            color: '#f8fafc',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full text-[10px] text-slate-400 mt-2 px-1">
                    {chartStatusData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 truncate">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: STATUS_COLORS[item.statusKey] }}
                        />
                        <span className="truncate">
                          {item.name} ({item.value})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center py-10">
                  Tidak ada tiket aktif pada filter ini.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly trend LineChart */}
          {chartTrendData.length > 0 && (
            <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl rounded-2xl lg:col-span-3 shadow-xl flex flex-col justify-between">
              <CardHeader className="border-b border-slate-800 pb-3 flex flex-row items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <CardTitle className="text-sm font-bold text-slate-300">
                  Tren Pengajuan Permohonan Bulanan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartTrendData}
                    margin={{ top: 15, right: 20, left: -25, bottom: 5 }}
                  >
                    <XAxis dataKey="Bulan" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#f8fafc',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Tiket"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Exclusions Warning Alert Panel */}
      {stats.totalTiketOverdue > 0 && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-rose-400">Peringatan Kepatuhan SLA Posyandu 6 SPM</h4>
            <p className="text-rose-400/80 leading-relaxed mt-1">
              Terdapat <strong>{stats.totalTiketOverdue} tiket aktif</strong> yang telah melebihi
              batas waktu pelayanan <strong>5 hari kerja</strong>. Harap Pemerintah Desa segera
              melakukan disposisi, atau mengoordinasikan tindak lanjut hasil disposisi dengan
              OPD/Kecamatan terkait.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
