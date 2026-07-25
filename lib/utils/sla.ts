/**
 * Menghitung tanggal tenggat SLA (default: 5 hari kerja dari tanggal terbit)
 * Mengecualikan akhir pekan (Sabtu & Minggu) dan daftar hari libur nasional/desa.
 */
export function calculateSlaDate(
  startDateStr: string | Date,
  daysOffset: number = 5,
  holidays: string[] = []
): string {
  const currentDate = new Date(startDateStr)
  let addedDays = 0

  while (addedDays < daysOffset) {
    currentDate.setDate(currentDate.getDate() + 1)

    // Check if weekend (Sunday = 0, Saturday = 6)
    const day = currentDate.getDay()
    if (day === 0 || day === 6) {
      continue
    }

    // Check if public holiday (format: YYYY-MM-DD)
    const dateStr = currentDate.toISOString().split('T')[0]
    if (holidays.includes(dateStr)) {
      continue
    }

    addedDays++
  }

  return currentDate.toISOString().split('T')[0]
}
