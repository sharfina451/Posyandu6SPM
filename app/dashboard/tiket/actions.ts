'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateWorkflowTransition, TicketStatus, UserRole } from '@/lib/utils/workflow'

export async function getTickets() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('v_tiket_sla')
    .select(
      `
      *,
      warga:warga_id(id, nama, nik),
      rumah_tangga:rumah_tangga_id(id, alamat),
      kader:kader_id(id, nama)
    `
    )
    .order('tanggal_terbit', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function getTicketById(id: string) {
  const supabase = createClient()

  // 1. Fetch ticket details from the SLA view
  const { data: ticket, error: errTicket } = await supabase
    .from('v_tiket_sla')
    .select(
      `
      *,
      warga:warga_id(
        id, nama, nik, jenis_kelamin, tanggal_lahir, hubungan_keluarga, disabilitas,
        rumah_tangga:rumah_tangga_id(id, no_kk, alamat, dekat_industri)
      ),
      kader:kader_id(id, nama, no_hp),
      verifikator:verifikator_id(id, nama),
      pemdes:pemdes_id(id, nama)
    `
    )
    .eq('id', id)
    .single()

  if (errTicket || !ticket) {
    return { success: false, error: errTicket?.message || 'Tiket tidak ditemukan.' }
  }

  // 2. Fetch status history
  const { data: history } = await supabase
    .from('tiket_riwayat_status')
    .select(
      `
      *,
      oleh:oleh_id(id, nama, peran:peran_id(kode, nama))
    `
    )
    .eq('tiket_id', id)
    .order('pada', { ascending: true })

  // 3. Fetch documents
  const { data: documents } = await supabase
    .from('dokumen_persyaratan')
    .select(
      `
      *,
      diunggah_oleh_user:diunggah_oleh(id, nama)
    `
    )
    .eq('tiket_id', id)
    .order('diunggah_pada', { ascending: false })

  return {
    success: true,
    data: {
      ...ticket,
      riwayat: history || [],
      dokumen: documents || [],
    },
  }
}

export async function createTiket(formData: {
  warga_id: string
  bidang:
    | 'pendidikan'
    | 'kesehatan'
    | 'pekerjaan_umum'
    | 'perumahan_rakyat'
    | 'trantibumlinmas'
    | 'sosial'
  jenis_permohonan: string
  deskripsi: string
  prioritas: 'rendah' | 'sedang' | 'tinggi' | 'darurat'
  rahasia: boolean
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  // Fetch warga info to get their household ID
  const { data: warga, error: errWarga } = await supabase
    .from('warga')
    .select('id, rumah_tangga_id')
    .eq('id', formData.warga_id)
    .single()

  if (errWarga || !warga) {
    return { success: false, error: 'Warga tidak ditemukan.' }
  }

  try {
    // Insert ticket. Triggers auto-generate nomor_tiket and tenggat_sla
    const { data: newTicket, error: errTicket } = await supabase
      .from('tiket')
      .insert([
        {
          warga_id: formData.warga_id,
          rumah_tangga_id: warga.rumah_tangga_id,
          bidang: formData.bidang,
          jenis_permohonan: formData.jenis_permohonan,
          deskripsi: formData.deskripsi,
          status: 'didata',
          prioritas: formData.prioritas,
          rahasia: formData.rahasia,
          kader_id: user.id,
        },
      ])
      .select()
      .single()

    if (errTicket) throw errTicket

    // Insert initial status history
    await supabase.from('tiket_riwayat_status').insert([
      {
        tiket_id: newTicket.id,
        status_dari: null,
        status_ke: 'didata',
        catatan: 'Tiket diterbitkan oleh kader',
        oleh_id: user.id,
      },
    ])

    // Record Audit Log
    await supabase.from('audit_log').insert([
      {
        pengguna_id: user.id,
        aksi: 'create',
        tabel: 'tiket',
        record_id: newTicket.id,
        data_baru: {
          nomor_tiket: newTicket.nomor_tiket,
          warga_id: formData.warga_id,
          bidang: formData.bidang,
        },
      },
    ])

    revalidatePath('/dashboard/tiket')
    return { success: true, data: newTicket }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    return { success: false, error: message }
  }
}

export async function updateTicketStatus(
  ticketId: string,
  newStatus:
    'didata' | 'verifikasi_kunjungan' | 'diajukan_pemdes' | 'disposisi_opd' | 'selesai' | 'ditolak',
  catatan: string,
  opdTujuan?: string
) {
  const supabase = createClient()

  // 1. Authenticate user and get role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  const role = (user.app_metadata?.role as string) || 'kader'

  // 2. Fetch current ticket status
  const { data: ticket, error: errTicket } = await supabase
    .from('tiket')
    .select('*')
    .eq('id', ticketId)
    .single()

  if (errTicket || !ticket) {
    return { success: false, error: 'Tiket tidak ditemukan.' }
  }

  const oldStatus = ticket.status

  // 3. State Machine & Role validation
  const validation = validateWorkflowTransition(
    oldStatus as TicketStatus,
    newStatus,
    role as UserRole,
    opdTujuan
  )

  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  try {
    // 5. Update Ticket data
    const updateData: Record<string, string | null | undefined> = {
      status: newStatus,
      diperbarui_pada: new Date().toISOString(),
    }

    if (newStatus === 'verifikasi_kunjungan') {
      updateData.verifikator_id = user.id
    }

    if (newStatus === 'disposisi_opd') {
      updateData.pemdes_id = user.id
      updateData.opd_tujuan = opdTujuan
    }

    if (newStatus === 'selesai' || newStatus === 'ditolak') {
      updateData.tanggal_selesai = new Date().toISOString()
    }

    const { error: errUpdate } = await supabase.from('tiket').update(updateData).eq('id', ticketId)

    if (errUpdate) throw errUpdate

    // 6. Record status transition history
    await supabase.from('tiket_riwayat_status').insert([
      {
        tiket_id: ticketId,
        status_dari: oldStatus,
        status_ke: newStatus,
        catatan: catatan || `Status diubah dari ${oldStatus} menjadi ${newStatus}`,
        oleh_id: user.id,
      },
    ])

    // 7. Record Audit Log
    await supabase.from('audit_log').insert([
      {
        pengguna_id: user.id,
        aksi: 'update',
        tabel: 'tiket',
        record_id: ticketId,
        data_lama: { status: oldStatus },
        data_baru: { status: newStatus, catatan },
      },
    ])

    revalidatePath('/dashboard/tiket')
    revalidatePath(`/dashboard/tiket/${ticketId}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    return { success: false, error: message }
  }
}
