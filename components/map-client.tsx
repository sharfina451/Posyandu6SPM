'use client'

import React, { useEffect, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { AlertCircle, MapPin, Eye } from 'lucide-react'
import type { HouseholdData } from '@/app/dashboard/actions'
import 'leaflet/dist/leaflet.css'

interface MapClientProps {
  households: HouseholdData[]
}

const getMarkerIcon = (klasifikasi: string | null) => {
  let color = 'bg-emerald-500 border-emerald-200 text-emerald-400'
  if (klasifikasi === 'waspada') {
    color = 'bg-amber-500 border-amber-200 text-amber-400'
  } else if (klasifikasi === 'bahaya') {
    color = 'bg-orange-500 border-orange-200 text-orange-400'
  } else if (klasifikasi === 'kritis') {
    color = 'bg-rose-500 border-rose-200 text-rose-400 animate-bounce'
  }

  return L.divIcon({
    html: `<div class="h-4.5 w-4.5 rounded-full border-2 ${color} shadow-lg shadow-black/60 flex items-center justify-center">
             <div class="h-1.5 w-1.5 rounded-full bg-white"></div>
           </div>`,
    className: 'custom-marker-icon',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
  })
}

export default function MapClient({ households }: MapClientProps) {
  // Center coordinates of Desa Lemahduwur, Kec. Adiwerna, Kab. Tegal
  const center: [number, number] = [-6.9498, 109.1296]
  const [selectedHouse, setSelectedHouse] = useState<HouseholdData | null>(null)

  useEffect(() => {
    // Leaflet relative image path fix
    const DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })
    L.Marker.prototype.options.icon = DefaultIcon
  }, [])

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Map Section */}
      <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-slate-800 shadow-xl min-h-[450px] md:min-h-[550px] relative z-10">
        <MapContainer center={center} zoom={16} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {households.map((house) => {
            const pos: [number, number] = [house.latitude, house.longitude]
            return (
              <Marker
                key={house.rumah_tangga_id}
                position={pos}
                icon={getMarkerIcon(house.klasifikasi)}
                eventHandlers={{
                  click: () => {
                    setSelectedHouse(house)
                  },
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-slate-800">
                      {house.nama_kepala_keluarga || 'Tidak Terdaftar'}
                    </p>
                    <p className="text-[10px] text-slate-500">{house.alamat || '-'}</p>
                    <p className="font-semibold text-emerald-600 mt-1">
                      Kerentanan: {house.persen ? `${Math.round(house.persen)}%` : '0%'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      {/* Selected Household Detail panel */}
      <div className="space-y-6">
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl rounded-2xl shadow-xl h-full flex flex-col justify-between">
          <CardHeader className="border-b border-slate-800 pb-3 flex flex-row items-center gap-2">
            <Eye className="h-4 w-4 text-emerald-400" />
            <CardTitle className="text-sm font-bold text-slate-300">Detail Rumah Tangga</CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex-1 flex flex-col justify-between">
            {selectedHouse ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-500 font-bold block uppercase tracking-wider text-[9px]">
                    Nama Kepala Keluarga
                  </span>
                  <span className="text-sm font-extrabold text-white">
                    {selectedHouse.nama_kepala_keluarga || 'Tidak Ada'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-bold block uppercase tracking-wider text-[9px]">
                    Nomor KK
                  </span>
                  <span className="text-slate-300 font-mono font-bold">
                    {selectedHouse.no_kk || '-'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-bold block uppercase tracking-wider text-[9px]">
                    Alamat Rumah
                  </span>
                  <span className="text-slate-300 leading-relaxed">
                    {selectedHouse.alamat || '-'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-500 font-bold block uppercase tracking-wider text-[9px]">
                      Kawasan Industri
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedHouse.dekat_industri
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {selectedHouse.dekat_industri ? 'Rumah Produktif' : 'Bukan Industri'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-bold block uppercase tracking-wider text-[9px]">
                      Ekonomi / Desil
                    </span>
                    <span className="text-slate-300 font-bold text-xs">
                      {selectedHouse.status_ekonomi || '-'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-400 font-bold">Skor Kerentanan:</span>
                    <span className="text-lg font-black text-emerald-400">
                      {selectedHouse.persen ? `${Math.round(selectedHouse.persen)}%` : '0%'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-semibold">Klasifikasi Risiko:</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-extrabold uppercase ${
                        selectedHouse.klasifikasi === 'kritis'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                          : selectedHouse.klasifikasi === 'bahaya'
                            ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                            : selectedHouse.klasifikasi === 'waspada'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {selectedHouse.klasifikasi || 'Aman'}
                    </span>
                  </div>
                </div>

                {selectedHouse.potensi_eksklusi && (
                  <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl flex gap-2 items-start text-[10px] text-rose-400">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Potensi Eksklusi!</p>
                      <p className="text-rose-400/80 leading-normal mt-0.5">
                        Rumah tangga rentan tinggi namun belum tercatat menerima Bantuan Sosial.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 text-xs">
                <MapPin className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                Pilih salah satu titik rumah tangga pada peta untuk melihat detail kondisi & skor.
              </div>
            )}

            {selectedHouse && (
              <div className="pt-4 border-t border-slate-800/80">
                <a
                  href={`/dashboard/warga?rt=${selectedHouse.rumah_tangga_id}`}
                  className="inline-flex items-center justify-center w-full bg-slate-950 border border-slate-800 hover:bg-slate-900 text-white rounded-xl h-8.5 text-xs font-bold transition"
                >
                  Lihat Anggota Keluarga
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
