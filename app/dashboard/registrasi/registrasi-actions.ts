'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { REGISTRASI_REGEX } from '@/lib/utils/registrasi'

export interface DokumenRegistrasiItem {
  id: string
  posyandu_id: string
  jenis_dokumen: 'sk_tp_posyandu' | 'sk_pengurus' | 'matriks_rekap'
  file_path: string
  nama_file: string
  dibuat_pada: string
}

export interface PosyanduRegistrasiDetails {
  id: string
  nama: string
  status_registrasi: 'draf' | 'diajukan' | 'terdaftar' | 'dikembalikan'
  nomor_registrasi: string | null
  catatan_registrasi: string | null
  desa: string
  kecamatan: string
  kabupaten: string
  no_sk_pengurus: string | null
  tanggal_terdaftar: string | null
  dokumen: DokumenRegistrasiItem[]
}

/**
 * Fetch registration details for a specific Posyandu (or the current user's Posyandu)
 */
export async function getRegistrationDetails(posyanduId?: string): Promise<{
  success: boolean
  data?: PosyanduRegistrasiDetails
  error?: string
}> {
  const supabase = createClient()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  const role = (user.app_metadata?.role as string) || 'kader'
  let targetPosyanduId = posyanduId

  // If not admin/pemdes or targetPosyanduId is not provided, fetch user's posyandu_id
  if (!targetPosyanduId || (role !== 'admin' && role !== 'pemdes')) {
    targetPosyanduId = user.app_metadata?.posyandu_id
  }

  if (!targetPosyanduId) {
    return { success: false, error: 'Akun Anda tidak terkait dengan Posyandu mana pun.' }
  }

  try {
    // 2. Fetch Posyandu details
    const { data: posyandu, error: errPos } = await supabase
      .from('posyandu')
      .select('*')
      .eq('id', targetPosyanduId)
      .single()

    if (errPos || !posyandu) {
      throw new Error(errPos?.message || 'Data Posyandu tidak ditemukan.')
    }

    // 3. Fetch uploaded documents
    const { data: docs, error: errDocs } = await supabase
      .from('dokumen_registrasi')
      .select('*')
      .eq('posyandu_id', targetPosyanduId)

    if (errDocs) throw errDocs

    return {
      success: true,
      data: {
        id: posyandu.id,
        nama: posyandu.nama,
        status_registrasi: posyandu.status_registrasi,
        nomor_registrasi: posyandu.nomor_registrasi,
        catatan_registrasi: posyandu.catatan_registrasi,
        desa: posyandu.desa,
        kecamatan: posyandu.kecamatan,
        kabupaten: posyandu.kabupaten,
        no_sk_pengurus: posyandu.no_sk_pengurus,
        tanggal_terdaftar: posyandu.tanggal_terdaftar,
        dokumen: docs || [],
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal memuat detail registrasi.',
    }
  }
}

/**
 * Fetch all Posyandu registration requests awaiting review
 */
export async function getSubmittedPosyandus(): Promise<{
  success: boolean
  list?: PosyanduRegistrasiDetails[]
  error?: string
}> {
  const supabase = createClient()

  // 1. Authenticate user and verify role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  const role = (user.app_metadata?.role as string) || 'kader'
  if (role !== 'admin' && role !== 'pemdes') {
    return { success: false, error: 'Anda tidak memiliki hak akses untuk fungsi ini.' }
  }

  try {
    const { data: posyandus, error: errPos } = await supabase
      .from('posyandu')
      .select('*')
      .eq('status_registrasi', 'diajukan')
      .order('nama', { ascending: true })

    if (errPos) throw errPos

    // Fetch documents metadata for all posyandus
    const list: PosyanduRegistrasiDetails[] = []
    for (const posyandu of posyandus || []) {
      const { data: docs } = await supabase
        .from('dokumen_registrasi')
        .select('*')
        .eq('posyandu_id', posyandu.id)

      list.push({
        id: posyandu.id,
        nama: posyandu.nama,
        status_registrasi: posyandu.status_registrasi,
        nomor_registrasi: posyandu.nomor_registrasi,
        catatan_registrasi: posyandu.catatan_registrasi,
        desa: posyandu.desa,
        kecamatan: posyandu.kecamatan,
        kabupaten: posyandu.kabupaten,
        no_sk_pengurus: posyandu.no_sk_pengurus,
        tanggal_terdaftar: posyandu.tanggal_terdaftar,
        dokumen: docs || [],
      })
    }

    return { success: true, list }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal memuat daftar pengajuan.',
    }
  }
}

/**
 * Save uploaded document metadata
 */
export async function saveRegistrationDocumentMetadata(
  posyanduId: string,
  jenis: 'sk_tp_posyandu' | 'sk_pengurus' | 'matriks_rekap',
  filePath: string,
  fileName: string
) {
  const supabase = createClient()

  try {
    const { data: existing } = await supabase
      .from('dokumen_registrasi')
      .select('id, file_path')
      .eq('posyandu_id', posyanduId)
      .eq('jenis_dokumen', jenis)
      .single()

    // If there is an existing file, let's remove it physically from storage first
    if (existing?.file_path && existing.file_path !== filePath) {
      await supabase.storage.from('dokumen').remove([existing.file_path])
    }

    const { error } = await supabase.from('dokumen_registrasi').upsert(
      {
        posyandu_id: posyanduId,
        jenis_dokumen: jenis,
        file_path: filePath,
        nama_file: fileName,
        diperbarui_pada: new Date().toISOString(),
      },
      { onConflict: 'posyandu_id,jenis_dokumen' }
    )

    if (error) throw error

    revalidatePath('/dashboard/registrasi')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menyimpan berkas registrasi.',
    }
  }
}

/**
 * Delete registration document metadata and storage file
 */
export async function deleteRegistrationDocument(docId: string, filePath: string) {
  const supabase = createClient()

  try {
    // 1. Remove physical file
    const { error: errRemove } = await supabase.storage.from('dokumen').remove([filePath])
    if (errRemove) throw errRemove

    // 2. Remove DB metadata row
    const { error: errDel } = await supabase.from('dokumen_registrasi').delete().eq('id', docId)
    if (errDel) throw errDel

    revalidatePath('/dashboard/registrasi')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menghapus berkas.',
    }
  }
}

/**
 * Submit documents checklist for review (Transitions state from draft/dikembalikan -> diajukan)
 */
export async function submitRegistrationAction(posyanduId: string) {
  const supabase = createClient()

  try {
    // Verify that all 3 files are uploaded
    const { data: docs } = await supabase
      .from('dokumen_registrasi')
      .select('jenis_dokumen')
      .eq('posyandu_id', posyanduId)

    if (!docs || docs.length < 3) {
      return {
        success: false,
        error: 'Dokumen belum lengkap. Sediakan berkas SK TP, SK Pengurus, dan Matriks Rekap.',
      }
    }

    const { error } = await supabase
      .from('posyandu')
      .update({
        status_registrasi: 'diajukan',
        diperbarui_pada: new Date().toISOString(),
      })
      .eq('id', posyanduId)

    if (error) throw error

    revalidatePath('/dashboard/registrasi')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal mengajukan registrasi.',
    }
  }
}

/**
 * Review, approve/reject registration application (For Pemdes/Admin role)
 */
export async function reviewRegistrationAction(
  posyanduId: string,
  status: 'terdaftar' | 'dikembalikan',
  nomorRegistrasi?: string,
  catatan?: string
) {
  const supabase = createClient()

  // 1. Authenticate user and verify role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  const role = (user.app_metadata?.role as string) || 'kader'
  if (role !== 'admin' && role !== 'pemdes') {
    return { success: false, error: 'Anda tidak memiliki hak akses meninjau berkas.' }
  }

  // 2. Perform validation checks
  if (status === 'terdaftar') {
    if (!nomorRegistrasi) {
      return { success: false, error: 'Nomor registrasi resmi wajib diisi.' }
    }
    if (!REGISTRASI_REGEX.test(nomorRegistrasi)) {
      return {
        success: false,
        error:
          'Format nomor registrasi tidak valid. Gunakan format PP.KK.KC.DDDD.NNN (contoh: 11.01.10.2001.001)',
      }
    }
  }

  try {
    const updatePayload: Record<string, unknown> = {
      status_registrasi: status,
      diperbarui_pada: new Date().toISOString(),
    }

    if (status === 'terdaftar') {
      updatePayload.nomor_registrasi = nomorRegistrasi
      updatePayload.catatan_registrasi = null
      updatePayload.tanggal_terdaftar = new Date().toISOString().split('T')[0]
    } else {
      updatePayload.catatan_registrasi = catatan || 'Berkas dikembalikan untuk diperbaiki.'
    }

    const { error } = await supabase.from('posyandu').update(updatePayload).eq('id', posyanduId)

    if (error) throw error

    revalidatePath('/dashboard/registrasi')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal memperbarui status registrasi.',
    }
  }
}

/**
 * Generate a secure signed URL to retrieve private registration documents
 */
export async function getRegistrationSignedUrl(filePath: string) {
  const supabase = createClient()
  try {
    const { data, error } = await supabase.storage.from('dokumen').createSignedUrl(filePath, 3600) // 1 hour expiry

    if (error) throw error
    return { success: true, url: data.signedUrl }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Gagal membuat signed URL'
    return { success: false, error: msg }
  }
}
