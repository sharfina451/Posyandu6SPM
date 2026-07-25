export type KlasifikasiRisiko = 'aman' | 'waspada' | 'bahaya' | 'kritis'

export interface ScoringFactors {
  lansia_tunggal: boolean
  miskin_dtks: boolean
  dekat_industri: boolean
  balita_stunting: boolean
  disabilitas: boolean
}

export interface ScoringResult {
  totalSkor: number
  persen: number
  klasifikasi: KlasifikasiRisiko
  potensiEksklusi: boolean
}

const BOBOT = {
  lansia_tunggal: 0.25,
  miskin_dtks: 0.25,
  dekat_industri: 0.15,
  balita_stunting: 0.2,
  disabilitas: 0.15,
}

/**
 * Recalculates the vulnerability score for a household based on its factors
 * matching the database trigger rule-based-v1 scoring model.
 */
export function calculateVulnerabilityScore(
  factors: ScoringFactors,
  hasActiveBansosTicket = false
): ScoringResult {
  let totalSkor = 0.0

  if (factors.lansia_tunggal) {
    totalSkor += BOBOT.lansia_tunggal
  }
  if (factors.miskin_dtks) {
    totalSkor += BOBOT.miskin_dtks
  }
  if (factors.dekat_industri) {
    totalSkor += BOBOT.dekat_industri
  }
  if (factors.balita_stunting) {
    totalSkor += BOBOT.balita_stunting
  }
  if (factors.disabilitas) {
    totalSkor += BOBOT.disabilitas
  }

  const persen = Math.round(totalSkor * 100 * 100) / 100 // round to 2 decimals

  let klasifikasi: KlasifikasiRisiko = 'aman'
  if (persen < 25.0) {
    klasifikasi = 'aman'
  } else if (persen < 50.0) {
    klasifikasi = 'waspada'
  } else if (persen < 75.0) {
    klasifikasi = 'bahaya'
  } else {
    klasifikasi = 'kritis'
  }

  const potensiEksklusi =
    (klasifikasi === 'bahaya' || klasifikasi === 'kritis') && !hasActiveBansosTicket

  return {
    totalSkor,
    persen,
    klasifikasi,
    potensiEksklusi,
  }
}
