'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Saves metadata of an uploaded document to public.dokumen_persyaratan
 */
export async function saveDocumentMetadataAction(formData: {
  ticketId: string
  wargaId: string
  jenis: string
  urlBerkas: string
  keterangan?: string
}) {
  const supabase = createClient()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  try {
    // 2. Insert metadata
    const { data: newDoc, error: errDoc } = await supabase
      .from('dokumen_persyaratan')
      .insert([
        {
          tiket_id: formData.ticketId,
          warga_id: formData.wargaId,
          jenis: formData.jenis,
          url_berkas: formData.urlBerkas,
          keterangan: formData.keterangan || null,
          diunggah_oleh: user.id,
        },
      ])
      .select()
      .single()

    if (errDoc) throw errDoc

    // 3. Record Audit Log
    await supabase.from('audit_log').insert([
      {
        pengguna_id: user.id,
        aksi: 'create',
        tabel: 'dokumen_persyaratan',
        record_id: newDoc.id,
        data_baru: {
          tiket_id: formData.ticketId,
          jenis: formData.jenis,
          url_berkas: formData.urlBerkas,
        },
      },
    ])

    revalidatePath(`/dashboard/tiket/${formData.ticketId}`)
    return { success: true, data: newDoc }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    return { success: false, error: message }
  }
}

/**
 * Generates an expiring signed URL for a private storage document path
 */
export async function getSignedUrlAction(urlBerkas: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis.' }
  }

  try {
    const { data, error } = await supabase.storage.from('dokumen').createSignedUrl(urlBerkas, 3600) // 1 hour expiration

    if (error) throw error

    return { success: true, signedUrl: data.signedUrl }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menghasilkan URL akses berkas.'
    return { success: false, error: message }
  }
}

/**
 * Deletes a document record and removes the file object from Supabase Storage
 */
export async function deleteDocumentAction(documentId: string) {
  const supabase = createClient()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login kembali.' }
  }

  try {
    // 2. Fetch document record to get URL path
    const { data: doc, error: errFetch } = await supabase
      .from('dokumen_persyaratan')
      .select('*')
      .eq('id', documentId)
      .single()

    if (errFetch || !doc) {
      throw new Error('Data dokumen tidak ditemukan.')
    }

    // 3. Remove object from Supabase Storage bucket
    const { error: errStorage } = await supabase.storage.from('dokumen').remove([doc.url_berkas])

    if (errStorage) {
      console.warn('[Storage delete warning]:', errStorage.message)
      // Continue to delete metadata even if storage file is already missing
    }

    // 4. Delete row from public.dokumen_persyaratan
    const { error: errDelete } = await supabase
      .from('dokumen_persyaratan')
      .delete()
      .eq('id', documentId)

    if (errDelete) throw errDelete

    // 5. Record Audit Log
    await supabase.from('audit_log').insert([
      {
        pengguna_id: user.id,
        aksi: 'delete',
        tabel: 'dokumen_persyaratan',
        record_id: documentId,
        data_lama: doc,
      },
    ])

    revalidatePath(`/dashboard/tiket/${doc.tiket_id}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    return { success: false, error: message }
  }
}
