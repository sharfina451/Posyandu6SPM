'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Search, RotateCcw } from 'lucide-react'

interface SearchFiltersProps {
  initialQuery?: string
  initialBidang?: string
}

export function LayananSearchFilters({
  initialQuery = '',
  initialBidang = 'all',
}: SearchFiltersProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [bidang, setBidang] = useState(initialBidang)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/dashboard/layanan?query=${encodeURIComponent(query)}&bidang=${bidang}`)
  }

  const handleReset = () => {
    setQuery('')
    setBidang('all')
    router.push('/dashboard/layanan')
  }

  return (
    <form
      onSubmit={handleSearch}
      className="grid gap-4 md:grid-cols-4 items-end bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-xl"
    >
      <div className="space-y-1.5 md:col-span-2">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Cari Warga (Nama / NIK)
        </label>
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ketik nama atau NIK warga..."
          className="bg-slate-950 border-slate-800 rounded-xl text-xs h-9.5 placeholder-slate-500 text-white"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Bidang SPM
        </label>
        <Select
          value={bidang}
          onChange={(e) => setBidang(e.target.value)}
          className="bg-slate-950 border-slate-800 rounded-xl text-xs h-9.5 w-full text-white"
        >
          <option value="all">Semua Bidang</option>
          <option value="pendidikan">Pendidikan</option>
          <option value="kesehatan">Kesehatan</option>
          <option value="pekerjaan_umum">Pekerjaan Umum</option>
          <option value="perumahan_rakyat">Perumahan Rakyat</option>
          <option value="trantibumlinmas">Trantibumlinmas</option>
          <option value="sosial">Sosial</option>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={handleReset}
          variant="ghost"
          className="bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl h-9.5 flex-1 text-xs font-bold flex gap-1 items-center"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
        <Button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold h-9.5 px-4 rounded-xl flex items-center justify-center gap-1.5 flex-1 transition"
        >
          <Search className="h-4 w-4" /> Cari
        </Button>
      </div>
    </form>
  )
}
