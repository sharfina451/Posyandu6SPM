'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Ticket,
  Plus,
  Filter,
  Search,
  KanbanSquare,
  List,
  AlertTriangle,
  Clock,
  User,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { BuatTiketDialog } from '@/components/buat-tiket-dialog'

interface WargaSimple {
  id: string
  nama: string
  nik: string
}

interface TicketData {
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
  warga: WargaSimple | null
  rumah_tangga: { id: string; alamat: string } | null
  kader: { id: string; nama: string } | null
}

interface TicketBoardClientProps {
  initialTickets: TicketData[]
  wargaList: WargaSimple[]
  currentUserRole: string
}

export function TicketBoardClient({
  initialTickets,
  wargaList,
  currentUserRole,
}: TicketBoardClientProps) {
  const router = useRouter()
  const [tickets] = useState<TicketData[]>(initialTickets)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBidang, setFilterBidang] = useState<string>('all')
  const [filterPrioritas, setFilterPrioritas] = useState<string>('all')
  const [filterSla, setFilterSla] = useState<string>('all')

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Search matches ticket number, citizen name, or request type
      const matchSearch =
        t.nomor_tiket.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.jenis_permohonan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.warga?.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.warga?.nik || '').includes(searchQuery)

      // Bidang matches
      const matchBidang = filterBidang === 'all' || t.bidang === filterBidang

      // Prioritas matches
      const matchPrioritas = filterPrioritas === 'all' || t.prioritas === filterPrioritas

      // SLA matches
      let matchSla = true
      if (filterSla === 'lewat') {
        matchSla = t.lewat_sla
      } else if (filterSla === 'eskalasi') {
        matchSla = t.perlu_eskalasi
      } else if (filterSla === 'normal') {
        matchSla = !t.lewat_sla && !t.perlu_eskalasi
      }

      return matchSearch && matchBidang && matchPrioritas && matchSla
    })
  }, [tickets, searchQuery, filterBidang, filterPrioritas, filterSla])

  // Group tickets by status for Kanban Board
  const kanbanColumns = useMemo(() => {
    const cols: Record<
      | 'didata'
      | 'verifikasi_kunjungan'
      | 'diajukan_pemdes'
      | 'disposisi_opd'
      | 'selesai'
      | 'ditolak',
      TicketData[]
    > = {
      didata: [],
      verifikasi_kunjungan: [],
      diajukan_pemdes: [],
      disposisi_opd: [],
      selesai: [],
      ditolak: [],
    }

    filteredTickets.forEach((t) => {
      if (cols[t.status]) {
        cols[t.status].push(t)
      }
    })

    return cols
  }, [filteredTickets])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'didata':
        return 'border-slate-800 bg-slate-900/40 text-slate-400'
      case 'verifikasi_kunjungan':
        return 'border-blue-500/20 bg-blue-500/5 text-blue-400'
      case 'diajukan_pemdes':
        return 'border-amber-500/20 bg-amber-500/5 text-amber-400'
      case 'disposisi_opd':
        return 'border-purple-500/20 bg-purple-500/5 text-purple-400'
      case 'selesai':
        return 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
      case 'ditolak':
        return 'border-rose-500/20 bg-rose-500/5 text-rose-400'
      default:
        return 'border-slate-800 bg-slate-900/40 text-slate-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'didata':
        return 'Didata'
      case 'verifikasi_kunjungan':
        return 'Verifikasi Kunjungan'
      case 'diajukan_pemdes':
        return 'Diajukan Pemdes'
      case 'disposisi_opd':
        return 'Disposisi OPD'
      case 'selesai':
        return 'Selesai'
      case 'ditolak':
        return 'Ditolak'
      default:
        return status
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
        return 'Perumahan Rakyat'
      case 'trantibumlinmas':
        return 'Trantibumlinmas'
      case 'sosial':
        return 'Sosial'
      default:
        return bidang
    }
  }

  const getPriorityBadge = (prioritas: string) => {
    switch (prioritas) {
      case 'darurat':
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
      case 'tinggi':
        return 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
      case 'sedang':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
      case 'rendah':
        return 'bg-slate-800 text-slate-400 border border-slate-700'
      default:
        return 'bg-slate-800 text-slate-400'
    }
  }

  const handleTicketCreated = () => {
    router.refresh()
    setIsCreateOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Ticket className="h-8 w-8 text-emerald-400" />
            Alur Kerja Rujukan & Tiket
          </h2>
          <p className="text-slate-400 text-sm">
            Pelacakan tindak lanjut permohonan 6 SPM dengan SLA pelayanan 5 hari kerja.
          </p>
        </div>
        {['kader', 'bidan', 'admin'].includes(currentUserRole) && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 active:scale-95 transition"
          >
            <Plus className="h-5 w-5" /> Buat Tiket Baru
          </Button>
        )}
      </div>

      {/* SLA & Escalation Stats Banner */}
      {tickets.some((t) => t.lewat_sla || t.perlu_eskalasi) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {tickets.some((t) => t.lewat_sla) && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-pulse">
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Ada Tiket Melebihi Batas Waktu!</h4>
                <p className="text-xs text-rose-400/80">
                  Terdapat {tickets.filter((t) => t.lewat_sla).length} tiket yang belum selesai
                  setelah melewati tenggat 5 hari kerja.
                </p>
              </div>
            </div>
          )}
          {tickets.some((t) => t.perlu_eskalasi) && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Tiket Memerlukan Eskalasi</h4>
                <p className="text-xs text-amber-400/80">
                  Terdapat {tickets.filter((t) => t.perlu_eskalasi).length} tiket mandek &gt; 3 hari
                  kerja tanpa perpindahan status.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 bg-slate-900/40 p-4 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor tiket, nama warga, NIK..."
            className="pl-10 rounded-xl"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
          <div className="w-full sm:w-44 flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500 shrink-0" />
            <Select value={filterBidang} onChange={(e) => setFilterBidang(e.target.value)}>
              <option value="all">Semua Bidang</option>
              <option value="kesehatan">Kesehatan</option>
              <option value="pendidikan">Pendidikan</option>
              <option value="pekerjaan_umum">Pekerjaan Umum</option>
              <option value="perumahan_rakyat">Perumahan Rakyat</option>
              <option value="trantibumlinmas">Trantibumlinmas</option>
              <option value="sosial">Sosial</option>
            </Select>
          </div>

          <Select
            value={filterPrioritas}
            onChange={(e) => setFilterPrioritas(e.target.value)}
            className="w-full sm:w-36"
          >
            <option value="all">Semua Prioritas</option>
            <option value="darurat">Darurat</option>
            <option value="tinggi">Tinggi</option>
            <option value="sedang">Sedang</option>
            <option value="rendah">Rendah</option>
          </Select>

          <Select
            value={filterSla}
            onChange={(e) => setFilterSla(e.target.value)}
            className="w-full sm:w-40"
          >
            <option value="all">Semua SLA</option>
            <option value="normal">SLA Berjalan</option>
            <option value="eskalasi">Butuh Eskalasi</option>
            <option value="lewat">Lewat SLA</option>
          </Select>

          {/* Toggle View Mode */}
          <div className="flex items-center gap-1 border border-slate-800 bg-slate-950 p-1.5 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'kanban'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-500 hover:text-white'
              }`}
              title="Papan Kanban"
            >
              <KanbanSquare className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-500 hover:text-white'
              }`}
              title="Daftar Tabel"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'kanban' ? (
        /* KANBAN BOARD */
        <div className="flex gap-4 overflow-x-auto pb-4 select-none min-h-[500px]">
          {(
            [
              'didata',
              'verifikasi_kunjungan',
              'diajukan_pemdes',
              'disposisi_opd',
              'selesai',
              'ditolak',
            ] as const
          ).map((status) => {
            const columnTickets = kanbanColumns[status]
            return (
              <div
                key={status}
                className="flex flex-col w-72 shrink-0 bg-slate-900/20 border border-slate-800/80 rounded-2xl overflow-hidden"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between p-3.5 bg-slate-900/60 border-b border-slate-800/60">
                  <span className="font-bold text-sm text-slate-200">{getStatusLabel(status)}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {columnTickets.length}
                  </span>
                </div>

                {/* Card Container */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[600px] min-h-[400px]">
                  {columnTickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-xs text-slate-600">
                      Tidak ada tiket
                    </div>
                  ) : (
                    columnTickets.map((ticket) => (
                      <Link
                        href={`/dashboard/tiket/${ticket.id}`}
                        key={ticket.id}
                        className="block"
                      >
                        <Card className="bg-slate-900 border-slate-800/70 hover:border-slate-700 hover:shadow-lg active:scale-[0.99] transition duration-150 cursor-pointer">
                          <CardContent className="p-3.5 space-y-3">
                            {/* Ticket Num & Priority */}
                            <div className="flex items-center justify-between gap-1 text-[10px]">
                              <span className="font-mono text-slate-400 font-bold truncate">
                                {ticket.nomor_tiket}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${getPriorityBadge(ticket.prioritas)}`}
                              >
                                {ticket.prioritas}
                              </span>
                            </div>

                            {/* Permohonan */}
                            <div>
                              <h4 className="font-bold text-sm text-white line-clamp-1">
                                {ticket.jenis_permohonan}
                              </h4>
                              <span className="inline-block text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md mt-1 capitalize">
                                {getBidangLabel(ticket.bidang)}
                              </span>
                            </div>

                            {/* Warga */}
                            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-2 rounded-xl border border-slate-800/40">
                              <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <span className="truncate font-semibold text-slate-300">
                                {ticket.warga?.nama || 'Tanpa Nama'}
                              </span>
                            </div>

                            {/* SLA Alerts */}
                            <div className="flex flex-wrap gap-1">
                              {ticket.lewat_sla && (
                                <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                  <Clock className="h-3 w-3" /> Overdue
                                </span>
                              )}
                              {ticket.perlu_eskalasi && (
                                <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  <AlertTriangle className="h-3 w-3" /> Eskalasi
                                </span>
                              )}
                              {ticket.rahasia && (
                                <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                  🔒 Rahasia
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="overflow-x-auto bg-slate-900/20 border border-slate-800/80 rounded-2xl">
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 font-bold text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Nomor Tiket</th>
                <th className="px-6 py-4">Warga / NIK</th>
                <th className="px-6 py-4">Bidang / Urusan</th>
                <th className="px-6 py-4">Permohonan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Tenggat SLA</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data tiket sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-white">
                      {ticket.nomor_tiket}
                      {ticket.rahasia && (
                        <span className="ml-1 text-[10px] text-purple-400">🔒</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200">
                        {ticket.warga?.nama || 'Tanpa Nama'}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">{ticket.warga?.nik}</div>
                    </td>
                    <td className="px-6 py-4 capitalize text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-800/80 text-emerald-400 border border-slate-700/50">
                        {getBidangLabel(ticket.bidang)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200">{ticket.jenis_permohonan}</div>
                      <div className="text-xs text-slate-500 max-w-xs truncate">
                        {ticket.deskripsi || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusColor(ticket.status)}`}
                      >
                        {getStatusLabel(ticket.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span>
                          {ticket.tenggat_sla
                            ? new Date(ticket.tenggat_sla).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </span>
                        {ticket.lewat_sla && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            LEWAT
                          </span>
                        )}
                        {ticket.perlu_eskalasi && !ticket.lewat_sla && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            BUTUH ESKALASI
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/tiket/${ticket.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-400 hover:text-emerald-300 font-bold hover:bg-emerald-500/5 rounded-xl flex items-center gap-1"
                        >
                          Detail <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Buat Tiket Dialog */}
      <BuatTiketDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        wargaList={wargaList}
        onSuccess={handleTicketCreated}
      />
    </div>
  )
}
