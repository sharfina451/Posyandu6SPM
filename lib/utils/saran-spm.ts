export interface SaranSpm {
  bidang:
    | 'kesehatan'
    | 'pendidikan'
    | 'pekerjaan_umum'
    | 'perumahan_rakyat'
    | 'trantibumlinmas'
    | 'sosial'
  alasan: string
  subKategori?: string
}

export function saranBidang(
  tanggalLahirStr: string,
  jenisKelamin: 'L' | 'P',
  disabilitas: boolean
): SaranSpm[] {
  const saran: SaranSpm[] = []

  if (!tanggalLahirStr) return saran

  const birthDate = new Date(tanggalLahirStr)
  if (isNaN(birthDate.getTime())) return saran

  const today = new Date()
  let ageYears = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    ageYears--
  }

  // 1. Kesehatan (KIA / Balita / PTM / Lansia)
  if (ageYears <= 5) {
    saran.push({
      bidang: 'kesehatan',
      alasan:
        'Balita (0-5 tahun) direkomendasikan untuk pemantauan tumbuh kembang (KMS/Antropometri) & imunisasi rutin.',
      subKategori: 'KIA / Balita',
    })
  } else if (ageYears >= 60) {
    saran.push({
      bidang: 'kesehatan',
      alasan:
        'Lansia (>= 60 tahun) direkomendasikan untuk skrining Penyakit Tidak Menular (PTM) & Lansia Risti.',
      subKategori: 'PTM / Lansia',
    })
  } else {
    saran.push({
      bidang: 'kesehatan',
      alasan: 'Usia produktif direkomendasikan untuk skrining kesehatan umum (PTM/K3).',
      subKategori: 'PTM / K3',
    })
  }

  // 2. Pendidikan (Anak Usia Dini / Sekolah)
  if (ageYears >= 2 && ageYears <= 6) {
    saran.push({
      bidang: 'pendidikan',
      alasan: 'Anak usia 2-6 tahun disarankan mengikuti layanan Pendidikan Anak Usia Dini (PAUD).',
      subKategori: 'PAUD',
    })
  } else if (ageYears >= 7 && ageYears <= 18) {
    saran.push({
      bidang: 'pendidikan',
      alasan: 'Usia sekolah (7-18 tahun) disarankan untuk wajib belajar 12 tahun.',
      subKategori: 'Wajib Belajar 12 Tahun',
    })
  }

  // 3. Sosial
  if (disabilitas) {
    saran.push({
      bidang: 'sosial',
      alasan:
        'Warga penyandang disabilitas disarankan untuk verifikasi perlindungan & bantuan sosial khusus.',
      subKategori: 'Bansos Disabilitas',
    })
  } else if (ageYears >= 60) {
    saran.push({
      bidang: 'sosial',
      alasan:
        'Lansia rentan disarankan untuk evaluasi jaminan hari tua & bantuan kesejahteraan sosial.',
      subKategori: 'Kesejahteraan Lansia',
    })
  }

  return saran
}
