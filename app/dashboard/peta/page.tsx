import React from 'react'
import dynamic from 'next/dynamic'
import { getSpatialHouseholds } from '../actions'

// Load Leaflet map client dynamically because it requires window environment access
const MapClient = dynamic(() => import('@/components/map-client'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-slate-900/40 border border-slate-800 rounded-2xl min-h-[450px] md:min-h-[550px]">
      <span className="text-xs text-slate-500 font-semibold animate-pulse">
        Memuat Peta Spasial...
      </span>
    </div>
  ),
})

export default async function PetaKerentananPage() {
  const res = await getSpatialHouseholds()
  const households = res.success ? res.households : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Peta Kerentanan Wilayah
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Pemetaan spasial tingkat risiko rumah tangga Desa Lemahduwur (RW 01 - RW 08) berbasis
          rule-based scoring.
        </p>
      </div>

      <MapClient households={households} />
    </div>
  )
}
