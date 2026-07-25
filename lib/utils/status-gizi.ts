interface GrowthPoint {
  month: number
  wMedian: number
  wSD: number
  hMedian: number
  hSD: number
}

// WHO Child Growth Standards (0-60 Months)
const girlsReference: GrowthPoint[] = [
  { month: 0, wMedian: 3.2, wSD: 0.4, hMedian: 49.1, hSD: 1.9 },
  { month: 6, wMedian: 7.3, wSD: 0.8, hMedian: 65.7, hSD: 2.2 },
  { month: 12, wMedian: 8.9, wSD: 1.0, hMedian: 74.0, hSD: 2.6 },
  { month: 24, wMedian: 11.5, wSD: 1.3, hMedian: 86.4, hSD: 3.2 },
  { month: 36, wMedian: 13.9, wSD: 1.6, hMedian: 95.1, hSD: 3.7 },
  { month: 48, wMedian: 16.1, wSD: 1.9, hMedian: 102.7, hSD: 4.1 },
  { month: 60, wMedian: 18.2, wSD: 2.2, hMedian: 109.4, hSD: 4.5 },
]

const boysReference: GrowthPoint[] = [
  { month: 0, wMedian: 3.3, wSD: 0.4, hMedian: 49.9, hSD: 1.9 },
  { month: 6, wMedian: 7.9, wSD: 0.8, hMedian: 67.6, hSD: 2.2 },
  { month: 12, wMedian: 9.6, wSD: 1.0, hMedian: 75.7, hSD: 2.6 },
  { month: 24, wMedian: 12.2, wSD: 1.3, hMedian: 87.8, hSD: 3.2 },
  { month: 36, wMedian: 14.3, wSD: 1.6, hMedian: 96.1, hSD: 3.7 },
  { month: 48, wMedian: 16.3, wSD: 1.9, hMedian: 103.3, hSD: 4.1 },
  { month: 60, wMedian: 18.3, wSD: 2.2, hMedian: 110.0, hSD: 4.5 },
]

function interpolate(
  month: number,
  ref: GrowthPoint[]
): { wMedian: number; wSD: number; hMedian: number; hSD: number } {
  // Clamp month to 0-60
  const m = Math.max(0, Math.min(60, month))

  // Find surrounding points
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
    return {
      wMedian: lower.wMedian,
      wSD: lower.wSD,
      hMedian: lower.hMedian,
      hSD: lower.hSD,
    }
  }

  const factor = (m - lower.month) / range
  return {
    wMedian: lower.wMedian + (upper.wMedian - lower.wMedian) * factor,
    wSD: lower.wSD + (upper.wSD - lower.wSD) * factor,
    hMedian: lower.hMedian + (upper.hMedian - lower.hMedian) * factor,
    hSD: lower.hSD + (upper.hSD - lower.hSD) * factor,
  }
}

export function hitungStatusGizi(
  tanggalLahirStr: string,
  jenisKelamin: 'L' | 'P',
  beratKg: number,
  tinggiCm: number
): string {
  if (!tanggalLahirStr || !beratKg || !tinggiCm) return 'normal'

  const birthDate = new Date(tanggalLahirStr)
  if (isNaN(birthDate.getTime())) return 'normal'

  const today = new Date()
  let ageMonths = (today.getFullYear() - birthDate.getFullYear()) * 12
  ageMonths += today.getMonth() - birthDate.getMonth()
  if (today.getDate() < birthDate.getDate()) {
    ageMonths--
  }

  // KMS / Antropometri is only for Balita (0-60 months)
  if (ageMonths < 0 || ageMonths > 60) {
    return 'normal'
  }

  const ref = jenisKelamin === 'P' ? girlsReference : boysReference
  const { wMedian, wSD, hMedian, hSD } = interpolate(ageMonths, ref)

  const zWeight = (beratKg - wMedian) / wSD
  const zHeight = (tinggiCm - hMedian) / hSD

  // Classification logic (stunting/gizi kurang/gizi buruk/normal)
  if (zHeight < -3) {
    return 'stunting sangat pendek'
  }
  if (zHeight < -2) {
    return 'stunting pendek (resiko stunting)'
  }
  if (zWeight < -3) {
    return 'gizi buruk'
  }
  if (zWeight < -2) {
    return 'gizi kurang'
  }
  if (zWeight > 2.5) {
    return 'obesitas'
  }

  return 'normal'
}
