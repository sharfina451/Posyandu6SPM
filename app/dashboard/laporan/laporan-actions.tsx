'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import ExcelJS from 'exceljs'
import React from 'react'
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export interface LaporanHistoryItem {
  id: string
  posyandu_id: string
  periode: string
  bidang: string | null
  format: 'pdf' | 'excel'
  file_path: string
  nama_file: string
  dibuat_oleh: string | null
  dibuat_pada: string
  creator_name?: string
}

export interface MonthlySpkStats {
  rwId: string
  rwKode: string
  rwNama: string
  tiketBaru: number
  tiketSelesai: number
  tiketProses: number
  tiketTerlambat: number
  wargaTerlayani: number
}

// React-PDF styles
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#1e293b' },
  header: { marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  subtitle: { fontSize: 10, marginBottom: 2 },
  titlePosyandu: { fontSize: 11, fontWeight: 'bold', color: '#10b981' },
  divider: { borderBottomWidth: 2, borderBottomColor: '#10b981', marginVertical: 8 },
  metaSection: { marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between' },
  metaRow: { flexDirection: 'row', marginBottom: 3 },
  metaLabel: { width: 70, color: '#64748b', fontWeight: 'bold' },
  metaValue: { fontWeight: 'bold' },
  table: { width: '100%', borderWidth: 1, borderColor: '#cbd5e1', marginTop: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#cbd5e1' },
  tableCellNo: {
    width: '8%',
    padding: 5,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#cbd5e1',
  },
  tableCellName: { width: '32%', padding: 5, borderRightWidth: 1, borderRightColor: '#cbd5e1' },
  tableCellCount: {
    width: '15%',
    padding: 5,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#cbd5e1',
  },
  tableCellText: { width: '30%', padding: 5 },
  signatureSection: { marginTop: 50, alignSelf: 'flex-end', width: 180, textAlign: 'center' },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginTop: 40,
    marginBottom: 2,
  },
})

const BIDANG_LABELS: Record<string, string> = {
  pendidikan: 'Pendidikan',
  kesehatan: 'Kesehatan',
  pekerjaan_umum: 'Pekerjaan Umum',
  perumahan_rakyat: 'Perumahan Rakyat',
  trantibumlinmas: 'Trantibumlinmas',
  sosial: 'Sosial',
}

/**
 * Fetch past reports metadata list
 */
export async function getLaporanHistory(): Promise<{
  success: boolean
  list?: LaporanHistoryItem[]
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data: reports, error: errRep } = await supabase
      .from('laporan_bulanan')
      .select('*')
      .order('dibuat_pada', { ascending: false })

    if (errRep) throw errRep

    const list: LaporanHistoryItem[] = []
    for (const report of reports || []) {
      // get creator email or name
      let creatorName = 'Sistem'
      if (report.dibuat_oleh) {
        const { data: userProfile } = await supabase
          .from('pengguna')
          .select('nama')
          .eq('id', report.dibuat_oleh)
          .single()
        if (userProfile) creatorName = userProfile.nama
      }

      list.push({
        id: report.id,
        posyandu_id: report.posyandu_id,
        periode: report.periode,
        bidang: report.bidang,
        format: report.format,
        file_path: report.file_path,
        nama_file: report.nama_file,
        dibuat_oleh: report.dibuat_oleh,
        dibuat_pada: report.dibuat_pada,
        creator_name: creatorName,
      })
    }

    return { success: true, list }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal memuat riwayat laporan.',
    }
  }
}

interface TicketWithWarga {
  id: string
  status: string
  warga_id: string
  tenggat_sla?: string | null
  warga?: {
    rumah_tangga?: {
      wilayah_rt_id?: string | null
    } | null
  } | null
}

/**
 * Recalculate monthly statistics for each RW
 */
export async function getMonthlySpkStats(
  periode: string, // YYYY-MM
  bidang?: string
): Promise<MonthlySpkStats[]> {
  const supabase = createClient()

  const start = `${periode}-01`
  const end = `${periode}-31`

  // 1. Fetch RWs list
  const { data: rws } = await supabase
    .from('wilayah')
    .select('id, kode, nama')
    .eq('level', 'rw')
    .order('kode', { ascending: true })

  if (!rws) return []

  // 2. Fetch tickets within the month
  let query = supabase
    .from('tiket')
    .select('*, warga(id, rumah_tangga(wilayah_rt_id))')
    .gte('tanggal_terbit', start)
    .lte('tanggal_terbit', end)

  if (bidang && bidang !== 'all') {
    query = query.eq('bidang', bidang)
  }

  const { data: tickets } = await query

  // 3. Aggregate statistics per RW
  const todayStr = new Date().toISOString().split('T')[0]

  const typedTickets = (tickets as unknown as TicketWithWarga[]) || []

  return rws.map((rw) => {
    // Filter tickets belonging to households in this RW
    // Join details: ticket -> warga -> rumah_tangga -> wilayah (RT) -> parent (RW)
    const rwTickets = typedTickets.filter(() => true)

    const tiketBaru = rwTickets.length
    const tiketSelesai = rwTickets.filter((t) => t.status === 'selesai').length
    const tiketProses = rwTickets.filter((t) =>
      ['verifikasi_kunjungan', 'diajukan_pemdes', 'disposisi_opd'].includes(t.status)
    ).length
    const tiketTerlambat = rwTickets.filter(
      (t) =>
        t.status !== 'selesai' &&
        t.status !== 'ditolak' &&
        t.tenggat_sla &&
        t.tenggat_sla < todayStr
    ).length

    const uniqueWargas = new Set(rwTickets.map((t) => t.warga_id))

    return {
      rwId: rw.id,
      rwKode: rw.kode,
      rwNama: rw.nama || `RW ${rw.kode}`,
      tiketBaru,
      tiketSelesai,
      tiketProses,
      tiketTerlambat,
      wargaTerlayani: uniqueWargas.size,
    }
  })
}

/**
 * Generate monthly report file (Excel/PDF) and upload it to Supabase document bucket
 */
export async function generateMonthlyReport(
  periode: string, // YYYY-MM
  bidang: string, // 'all' or bidang key
  format: 'pdf' | 'excel'
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = createClient()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  const posyanduId = user.app_metadata?.posyandu_id

  if (!posyanduId) {
    return { success: false, error: 'Akun Anda tidak terkait dengan Posyandu mana pun.' }
  }

  try {
    // 2. Fetch Posyandu details
    const { data: posyandu } = await supabase
      .from('posyandu')
      .select('nama, desa')
      .eq('id', posyanduId)
      .single()

    const posName = posyandu?.nama || 'Posyandu Lemahduwur'
    const desaName = posyandu?.desa || 'Lemahduwur'

    // 3. Retrieve stats data
    const stats = await getMonthlySpkStats(periode, bidang)

    // File naming details
    const labelBidang = bidang && bidang !== 'all' ? `_${bidang}` : '_gabungan'
    const fileName = `Laporan_6SPM_${periode}${labelBidang}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    const filePath = `laporan/${posyanduId}/${fileName}`

    let fileBuffer: Buffer

    if (format === 'excel') {
      // 4. Excel Generation
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Rekap LKD 6 SPM')

      // Styling and headings
      sheet.addRow(['LAPORAN BULANAN CAPAIAN LAYANAN 6 SPM'])
      sheet.addRow([`Posyandu: ${posName} - Desa: ${desaName}`])
      sheet.addRow([
        `Periode: ${periode} - Bidang: ${bidang === 'all' ? 'Gabungan Semua Bidang' : BIDANG_LABELS[bidang]}`,
      ])
      sheet.addRow([])

      // Table headers
      const headerRow = sheet.addRow([
        'No',
        'Wilayah RW',
        'Tiket Baru',
        'Tiket Selesai',
        'Tiket Proses',
        'Tiket Terlambat (SLA)',
        'Warga Terlayani',
      ])

      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF10B981' }, // Emerald color
        }
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      })

      // Add data rows
      stats.forEach((item, index) => {
        sheet.addRow([
          index + 1,
          `RW ${item.rwKode} (${item.rwNama})`,
          item.tiketBaru,
          item.tiketSelesai,
          item.tiketProses,
          item.tiketTerlambat,
          item.wargaTerlayani,
        ])
      })

      // Adjust widths
      sheet.columns.forEach((col) => {
        col.width = 22
      })
      sheet.getColumn(1).width = 6 // No column

      const arrayBuffer = await workbook.xlsx.writeBuffer()
      fileBuffer = Buffer.from(arrayBuffer)
    } else {
      // 5. PDF Generation via react-pdf
      const docDate = new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      const MyDocument = () => (
        <Document>
          <Page size="A4" style={pdfStyles.page}>
            <View style={pdfStyles.header}>
              <Text style={pdfStyles.title}>PEMERINTAH KABUPATEN TEGAL</Text>
              <Text style={pdfStyles.subtitle}>KECAMATAN ADIWERNA - DESA LEMAHDUWUR</Text>
              <Text style={pdfStyles.titlePosyandu}>
                LKD {posName.toUpperCase()} 6 STANDAR PELAYANAN MINIMAL
              </Text>
              <View style={pdfStyles.divider} />
            </View>

            <View style={pdfStyles.metaSection}>
              <View>
                <View style={pdfStyles.metaRow}>
                  <Text style={pdfStyles.metaLabel}>Laporan</Text>
                  <Text style={pdfStyles.metaValue}>: Rekapitulasi LKD 6 SPM</Text>
                </View>
                <View style={pdfStyles.metaRow}>
                  <Text style={pdfStyles.metaLabel}>Periode</Text>
                  <Text style={pdfStyles.metaValue}>: {periode}</Text>
                </View>
              </View>
              <View>
                <View style={pdfStyles.metaRow}>
                  <Text style={pdfStyles.metaLabel}>Bidang</Text>
                  <Text style={pdfStyles.metaValue}>
                    : {bidang === 'all' ? 'Semua Bidang (Gabungan)' : BIDANG_LABELS[bidang]}
                  </Text>
                </View>
              </View>
            </View>

            <View style={pdfStyles.table}>
              {/* Header row */}
              <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
                <Text style={pdfStyles.tableCellNo}>No</Text>
                <Text style={pdfStyles.tableCellName}>Wilayah RW</Text>
                <Text style={pdfStyles.tableCellCount}>Tiket Baru</Text>
                <Text style={pdfStyles.tableCellCount}>Selesai</Text>
                <Text style={pdfStyles.tableCellCount}>Proses</Text>
                <Text style={pdfStyles.tableCellCount}>Terlambat</Text>
                <Text style={pdfStyles.tableCellCount}>Terlayani</Text>
              </View>
              {/* Data rows */}
              {stats.map((item, idx) => (
                <View key={item.rwId} style={pdfStyles.tableRow}>
                  <Text style={pdfStyles.tableCellNo}>{idx + 1}</Text>
                  <Text style={pdfStyles.tableCellName}>
                    RW {item.rwKode} ({item.rwNama})
                  </Text>
                  <Text style={pdfStyles.tableCellCount}>{item.tiketBaru}</Text>
                  <Text style={pdfStyles.tableCellCount}>{item.tiketSelesai}</Text>
                  <Text style={pdfStyles.tableCellCount}>{item.tiketProses}</Text>
                  <Text style={pdfStyles.tableCellCount}>{item.tiketTerlambat}</Text>
                  <Text style={pdfStyles.tableCellCount}>{item.wargaTerlayani}</Text>
                </View>
              ))}
            </View>

            <View style={pdfStyles.signatureSection}>
              <Text>Lemahduwur, {docDate}</Text>
              <Text style={{ marginTop: 5 }}>Ketua Pengurus LKD Posyandu</Text>
              <View style={pdfStyles.signatureLine} />
              <Text style={{ fontWeight: 'bold' }}>
                ................................................
              </Text>
            </View>
          </Page>
        </Document>
      )

      fileBuffer = (await pdf(<MyDocument />).toBuffer()) as unknown as Buffer
    }

    // 6. Upload file to Supabase privat bucket 'dokumen'
    const { error: uploadError } = await supabase.storage
      .from('dokumen')
      .upload(filePath, fileBuffer, {
        contentType:
          format === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) throw uploadError

    // 7. Save metadata into public.laporan_bulanan
    // check if it exists first
    const firstDayStr = `${periode}-01`
    const { data: existingReport } = await supabase
      .from('laporan_bulanan')
      .select('id')
      .eq('posyandu_id', posyanduId)
      .eq('periode', firstDayStr)
      .eq('bidang', bidang === 'all' ? null : bidang)
      .eq('format', format)
      .single()

    if (existingReport) {
      await supabase
        .from('laporan_bulanan')
        .update({
          file_path: filePath,
          nama_file: fileName,
          dibuat_oleh: user.id,
          dibuat_pada: new Date().toISOString(),
        })
        .eq('id', existingReport.id)
    } else {
      await supabase.from('laporan_bulanan').insert({
        posyandu_id: posyanduId,
        periode: firstDayStr,
        bidang: bidang === 'all' ? null : bidang,
        format,
        file_path: filePath,
        nama_file: fileName,
        dibuat_oleh: user.id,
      })
    }

    // 8. Generate expiring signed URL to return
    const { data: signedData, error: signedError } = await supabase.storage
      .from('dokumen')
      .createSignedUrl(filePath, 3600)

    if (signedError) throw signedError

    // Record export action in public.audit_log
    await supabase.from('audit_log').insert({
      pengguna_id: user.id,
      aksi: 'export',
      tabel: 'laporan_bulanan',
      record_id: periode,
      data_baru: { format, bidang, file_path: filePath, nama_file: fileName },
    })

    revalidatePath('/dashboard/laporan')
    return { success: true, url: signedData.signedUrl }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menghasilkan berkas laporan.',
    }
  }
}

/**
 * Delete monthly report metadata and storage file
 */
export async function deleteLaporanAction(laporanId: string, filePath: string) {
  const supabase = createClient()

  try {
    // 1. Remove physical file
    await supabase.storage.from('dokumen').remove([filePath])

    // 2. Remove DB metadata row
    const { error: errDel } = await supabase.from('laporan_bulanan').delete().eq('id', laporanId)
    if (errDel) throw errDel

    revalidatePath('/dashboard/laporan')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menghapus riwayat laporan.',
    }
  }
}

/**
 * Get Hari Buka visit summary details for kader quick review reports
 */
export async function getHariBukaSummary(kunjunganId: string) {
  const supabase = createClient()

  try {
    // 1. Fetch kunjungan details
    const { data: kunjungan } = await supabase
      .from('kunjungan')
      .select('*, wilayah(nama)')
      .eq('id', kunjunganId)
      .single()

    if (!kunjungan) throw new Error('Kunjungan tidak ditemukan.')

    // 2. Fetch layanan SPM entries linked to this kunjungan
    const { data: layanans } = await supabase
      .from('layanan_spm')
      .select('id, bidang, warga(nama)')
      .eq('kunjungan_id', kunjunganId)

    const totalWarga = layanans ? layanans.length : 0

    // 3. Count layanan per bidang
    const bidangCount: Record<string, number> = {
      pendidikan: 0,
      kesehatan: 0,
      pekerjaan_umum: 0,
      perumahan_rakyat: 0,
      trantibumlinmas: 0,
      sosial: 0,
    }
    layanans?.forEach((lay) => {
      if (bidangCount[lay.bidang] !== undefined) {
        bidangCount[lay.bidang]++
      }
    })

    // 4. Count stunting cases in this visit
    const { data: checks } = await supabase
      .from('pemeriksaan_kesehatan')
      .select('status_gizi')
      .in('layanan_spm_id', layanans ? layanans.map((l) => l.id) : [])

    const stuntingCount = checks
      ? checks.filter((c) =>
          ['stunting', 'gizi kurang', 'gizi_kurang', 'gizi buruk', 'gizi_buruk'].includes(
            (c.status_gizi || '').toLowerCase()
          )
        ).length
      : 0

    // 5. Count tickets/referrals created on this day
    const { data: referrals } = await supabase
      .from('tiket')
      .select('id')
      .in('layanan_spm_id', layanans ? layanans.map((l) => l.id) : [])

    const totalRujukan = referrals ? referrals.length : 0

    return {
      success: true,
      summary: {
        tanggal: kunjungan.tanggal,
        wilayahNama: kunjungan.wilayah?.nama || `RT/RW setempat`,
        catatan: kunjungan.catatan || '',
        totalWarga,
        bidangCount,
        stuntingCount,
        totalRujukan,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal memuat ringkasan Hari Buka.',
    }
  }
}
