'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getWargas() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('warga')
    .select('*, rumah_tangga:rumah_tangga_id(id, no_kk, alamat, wilayah_rt_id)')
    .order('dibuat_pada', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function searchWargaByNik(nik: string) {
  if (!nik || nik.length !== 16) {
    return { success: false, error: 'NIK harus terdiri dari 16 digit angka.' }
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('warga')
    .select('*, rumah_tangga:rumah_tangga_id(id, no_kk, alamat)')
    .eq('nik', nik)
    .maybeSingle()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function getRumahTanggaList() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rumah_tangga')
    .select('id, no_kk, alamat, wilayah_rt:wilayah_rt_id(id, kode, parent:parent_id(kode))')
    .order('no_kk', { ascending: true })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function createWargaWithConsent(formData: {
  // Warga Data
  nik: string
  nama: string
  tempat_lahir?: string
  tanggal_lahir: string
  jenis_kelamin: 'L' | 'P'
  golongan_darah?: string
  telepon?: string
  alamat_domisili?: string
  disabilitas: boolean
  jenis_disabilitas?: string
  pembawa_kartu: 'KTP' | 'KIA' | 'belum_punya'

  // Rumah Tangga Option
  mode_rumah_tangga: 'exist' | 'new'
  rumah_tangga_id?: string

  // New Rumah Tangga Data
  no_kk?: string
  alamat?: string
  wilayah_rt_id?: string
  air_bersih?: boolean
  jamban_sehat?: boolean
  dekat_industri?: boolean

  // PDP Consent Data
  consent_diberikan: boolean
  consent_metode: string
  consent_saksi: string
}) {
  const supabase = createClient()

  // 1. Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  // 2. Validate NIK format & duplicate
  if (!/^\d{16}$/.test(formData.nik)) {
    return { success: false, error: 'NIK tidak valid! Harus berupa 16 digit angka.' }
  }

  const { data: existingWarga } = await supabase
    .from('warga')
    .select('nama')
    .eq('nik', formData.nik)
    .maybeSingle()

  if (existingWarga) {
    return {
      success: false,
      error: `NIK ini sudah terdaftar atas nama "${existingWarga.nama}". Pendataan ganda dicegah.`,
    }
  }

  try {
    let finalRtId = formData.rumah_tangga_id || null

    // 3. Handle Rumah Tangga
    if (formData.mode_rumah_tangga === 'new') {
      if (!formData.no_kk || !/^\d{16}$/.test(formData.no_kk)) {
        return { success: false, error: 'Nomor KK harus berupa 16 digit angka.' }
      }
      if (!formData.alamat || !formData.wilayah_rt_id) {
        return { success: false, error: 'Alamat KK dan Wilayah RT wajib diisi.' }
      }

      // Check duplicate KK
      const { data: existingRt } = await supabase
        .from('rumah_tangga')
        .select('alamat')
        .eq('no_kk', formData.no_kk)
        .maybeSingle()

      if (existingRt) {
        return {
          success: false,
          error: `Nomor KK ${formData.no_kk} sudah terdaftar di alamat: ${existingRt.alamat}. Silakan pilih KK yang sudah ada.`,
        }
      }

      const { data: newRt, error: errNewRt } = await supabase
        .from('rumah_tangga')
        .insert([
          {
            no_kk: formData.no_kk,
            alamat: formData.alamat,
            wilayah_rt_id: formData.wilayah_rt_id,
            air_bersih: formData.air_bersih ?? true,
            jamban_sehat: formData.jamban_sehat ?? true,
            dekat_industri: formData.dekat_industri ?? false,
          },
        ])
        .select()
        .single()

      if (errNewRt) throw errNewRt
      finalRtId = newRt.id
    }

    // 4. Create Warga (nik_terverifikasi = false secara default)
    const { data: newWarga, error: errNewWarga } = await supabase
      .from('warga')
      .insert([
        {
          nik: formData.nik,
          nama: formData.nama,
          tempat_lahir: formData.tempat_lahir || null,
          tanggal_lahir: formData.tanggal_lahir,
          jenis_kelamin: formData.jenis_kelamin,
          golongan_darah: formData.golongan_darah || null,
          telepon: formData.telepon || null,
          alamat_domisili: formData.alamat_domisili || null,
          disabilitas: formData.disabilitas,
          jenis_disabilitas: formData.disabilitas ? formData.jenis_disabilitas || null : null,
          pembawa_kartu: formData.pembawa_kartu,
          nik_terverifikasi: false,
          rumah_tangga_id: finalRtId,
        },
      ])
      .select()
      .single()

    if (errNewWarga) throw errNewWarga

    // 5. Save PDP Consent
    const { error: errConsent } = await supabase.from('consent_pdp').insert([
      {
        warga_id: newWarga.id,
        diberikan: formData.consent_diberikan,
        metode: formData.consent_metode,
        saksi: formData.consent_saksi,
      },
    ])

    if (errConsent) throw errConsent

    // 6. Record Audit Log
    await supabase.from('audit_log').insert([
      {
        pengguna_id: user.id,
        tindakan: 'CREATE',
        tabel_nama: 'warga',
        record_id: newWarga.id,
        detail: {
          nik: formData.nik,
          nama: formData.nama,
          pdp_consent: formData.consent_diberikan,
        },
      },
    ])

    revalidatePath('/dashboard/warga')
    return { success: true, data: newWarga }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    return { success: false, error: message }
  }
}
