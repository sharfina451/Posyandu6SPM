'use client'

import React, { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface KmsChartProps {
  jenisKelamin: 'L' | 'P'
  history: {
    tanggal: string
    berat_kg: number
    tinggi_cm?: number
    ageMonths: number
  }[]
}

interface GrowthPoint {
  month: number
  wMedian: number
  wSD: number
}

const girlsReference: GrowthPoint[] = [
  { month: 0, wMedian: 3.2, wSD: 0.4 },
  { month: 6, wMedian: 7.3, wSD: 0.8 },
  { month: 12, wMedian: 8.9, wSD: 1.0 },
  { month: 24, wMedian: 11.5, wSD: 1.3 },
  { month: 36, wMedian: 13.9, wSD: 1.6 },
  { month: 48, wMedian: 16.1, wSD: 1.9 },
  { month: 60, wMedian: 18.2, wSD: 2.2 },
]

const boysReference: GrowthPoint[] = [
  { month: 0, wMedian: 3.3, wSD: 0.4 },
  { month: 6, wMedian: 7.9, wSD: 0.8 },
  { month: 12, wMedian: 9.6, wSD: 1.0 },
  { month: 24, wMedian: 12.2, wSD: 1.3 },
  { month: 36, wMedian: 14.3, wSD: 1.6 },
  { month: 48, wMedian: 16.3, wSD: 1.9 },
  { month: 60, wMedian: 18.3, wSD: 2.2 },
]

function interpolate(month: number, ref: GrowthPoint[]): { wMedian: number; wSD: number } {
  const m = Math.max(0, Math.min(60, month))
  let lower = ref[0]
  let upper = ref[ref.length - 1]

  for (let i = 0; i < ref.length - 1; i++) {
    if (m >= ref[i].month && m <= ref[i + 1].month) {
      lower = ref[i]
      upper = ref[i + 1]
      break
    }
  }

  const range = upper.month - lower.month
  if (range === 0) {
    return { wMedian: lower.wMedian, wSD: lower.wSD }
  }

  const factor = (m - lower.month) / range
  return {
    wMedian: lower.wMedian + (upper.wMedian - lower.wMedian) * factor,
    wSD: lower.wSD + (upper.wSD - lower.wSD) * factor,
  }
}

export function KmsChart({ jenisKelamin, history }: KmsChartProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">
        Memuat Grafik KMS...
      </div>
    )
  }

  const ref = jenisKelamin === 'P' ? girlsReference : boysReference
  const maxChildMonth = history.length > 0 ? Math.max(...history.map((h) => h.ageMonths)) : 0
  const endMonth = Math.max(24, Math.min(60, maxChildMonth + 3))

  const chartData = []
  for (let m = 0; m <= endMonth; m++) {
    const { wMedian, wSD } = interpolate(m, ref)

    // Group child checks by month (average if multiple checks exist in same month range)
    const matchedChecks = history.filter((h) => h.ageMonths === m)
    const childWeight =
      matchedChecks.length > 0
        ? Number(
            (
              matchedChecks.reduce((sum, curr) => sum + curr.berat_kg, 0) / matchedChecks.length
            ).toFixed(2)
          )
        : null

    chartData.push({
      bulan: m,
      'Median (Normal)': Number(wMedian.toFixed(1)),
      '-2 SD (Gizi Kurang)': Number((wMedian - 2 * wSD).toFixed(1)),
      '-3 SD (Gizi Buruk)': Number((wMedian - 3 * wSD).toFixed(1)),
      'Berat Badan Anak': childWeight,
    })
  }

  return (
    <div className="h-[350px] w-full bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="bulan"
            stroke="#64748b"
            tickLine={false}
            label={{ value: 'Umur (Bulan)', position: 'insideBottom', offset: -5, fill: '#64748b' }}
          />
          <YAxis
            stroke="#64748b"
            tickLine={false}
            label={{
              value: 'Berat (kg)',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              fill: '#64748b',
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '12px',
            }}
            labelClassName="text-slate-400 font-bold"
            itemStyle={{ color: '#fff' }}
          />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
          <Line
            type="monotone"
            dataKey="Median (Normal)"
            stroke="#10b981"
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="-2 SD (Gizi Kurang)"
            stroke="#f59e0b"
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="-3 SD (Gizi Buruk)"
            stroke="#ef4444"
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="Berat Badan Anak"
            stroke="#3b82f6"
            strokeWidth={3}
            connectNulls={true}
            dot={{ r: 4, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
