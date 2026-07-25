'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { AlertCircle, User, Eye, PlusCircle, Award, ListFilter } from 'lucide-react'
import type { HouseholdData } from '@/app/dashboard/actions'

interface PriorityClientProps {
  priorityList: HouseholdData[]
  exclusionList: HouseholdData[]
}

export function PriorityClient({ priorityList, exclusionList }: PriorityClientProps) {
  const [activeTab, setActiveTab] = useState<'priority' | 'exclusion'>('priority')

  const getRiskBadge = (klasifikasi: string | null) => {
    switch (klasifikasi) {
      case 'kritis':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
      case 'bahaya':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
      case 'waspada':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      default:
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs Selector */}
      <div className="flex border-b border-slate-800 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('priority')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition ${
            activeTab === 'priority'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Daftar Prioritas Kunjungan ({priorityList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('exclusion')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition relative ${
            activeTab === 'exclusion'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Potensi Eksklusi ({exclusionList.length})
          {exclusionList.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white animate-pulse">
              {exclusionList.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'priority' ? (
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl rounded-2xl shadow-xl">
          <CardHeader className="border-b border-slate-800/80 pb-3 flex flex-row items-center gap-2">
            <ListFilter className="h-4 w-4 text-emerald-400" />
            <CardTitle className="text-sm font-bold text-slate-300">
              Urutan Kerentanan Rumah Tangga
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {priorityList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-950/40">
                      <th className="p-4 w-12 text-center">No</th>
                      <th className="p-4">Kepala Keluarga</th>
                      <th className="p-4">Alamat Rumah</th>
                      <th className="p-4">Status Ekonomi</th>
                      <th className="p-4 text-center">Persentase</th>
                      <th className="p-4 text-center">Klasifikasi</th>
                      <th className="p-4 text-center w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priorityList.map((house, index) => (
                      <tr
                        key={house.rumah_tangga_id}
                        className="border-b border-slate-850 hover:bg-slate-950/20 text-slate-300 transition"
                      >
                        <td className="p-4 text-center font-bold text-slate-500">{index + 1}</td>
                        <td className="p-4 font-bold text-white flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          {house.nama_kepala_keluarga || 'Tidak Ada'}
                        </td>
                        <td className="p-4 max-w-[200px] truncate">{house.alamat || '-'}</td>
                        <td className="p-4">{house.status_ekonomi || '-'}</td>
                        <td className="p-4 text-center font-bold text-emerald-400">
                          {house.persen ? `${Math.round(house.persen)}%` : '0%'}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getRiskBadge(house.klasifikasi)}`}
                          >
                            {house.klasifikasi || 'Aman'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <Link
                            href={`/dashboard/warga?rt=${house.rumah_tangga_id}`}
                            className="inline-flex items-center justify-center h-8 w-8 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                            title="Tinjau Keluarga"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500">
                Belum ada data penilaian kerentanan yang terhitung.
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h4 className="font-bold text-rose-400">Rekomendasi Tinjau Eksklusi Bansos</h4>
              <p className="text-rose-400/80 leading-relaxed mt-1">
                Daftar di bawah memuat rumah tangga yang terklasifikasi berisiko tinggi (
                <strong>Bahaya/Kritis</strong>) berdasarkan rule-based scoring, namun{' '}
                <strong>belum tercatat menerima bantuan sosial aktif</strong> (tidak memiliki tiket
                bidang Sosial yang berstatus Selesai). Prioritaskan kunjungan rumah untuk
                mengusulkan bantuan yang sesuai.
              </p>
            </div>
          </div>

          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl rounded-2xl shadow-xl">
            <CardHeader className="border-b border-slate-800/80 pb-3 flex flex-row items-center gap-2">
              <Award className="h-4 w-4 text-emerald-400" />
              <CardTitle className="text-sm font-bold text-slate-300">
                Potensi Exclusion Error
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {exclusionList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-950/40">
                        <th className="p-4 w-12 text-center">No</th>
                        <th className="p-4">Kepala Keluarga</th>
                        <th className="p-4">Alamat Rumah</th>
                        <th className="p-4">Status Ekonomi</th>
                        <th className="p-4 text-center">Skor</th>
                        <th className="p-4 text-center">Klasifikasi</th>
                        <th className="p-4 text-center w-36">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exclusionList.map((house, index) => (
                        <tr
                          key={house.rumah_tangga_id}
                          className="border-b border-slate-850 hover:bg-slate-950/20 text-slate-300 transition"
                        >
                          <td className="p-4 text-center font-bold text-slate-500">{index + 1}</td>
                          <td className="p-4 font-bold text-white flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            {house.nama_kepala_keluarga || 'Tidak Ada'}
                          </td>
                          <td className="p-4 max-w-[200px] truncate">{house.alamat || '-'}</td>
                          <td className="p-4">{house.status_ekonomi || '-'}</td>
                          <td className="p-4 text-center font-bold text-rose-400">
                            {house.persen ? `${Math.round(house.persen)}%` : '0%'}
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getRiskBadge(house.klasifikasi)}`}
                            >
                              {house.klasifikasi || 'Kritis'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center gap-1.5">
                              <Link
                                href={`/dashboard/warga?rt=${house.rumah_tangga_id}`}
                                className="inline-flex items-center justify-center h-8 w-8 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                                title="Tinjau Keluarga"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <Link
                                href={`/dashboard/tiket?rt=${house.rumah_tangga_id}&bidang=sosial`}
                                className="inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold h-8 text-[11px] px-3.5 rounded-lg gap-1 transition"
                              >
                                <PlusCircle className="h-3.5 w-3.5" />
                                Usulkan Bansos
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-500">
                  🎉 Tidak ditemukan potensi exclusion. Semua warga rentan tinggi telah terdaftar
                  menerima bantuan.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
