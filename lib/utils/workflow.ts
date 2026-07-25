export type TicketStatus =
  'didata' | 'verifikasi_kunjungan' | 'diajukan_pemdes' | 'disposisi_opd' | 'selesai' | 'ditolak'

export type UserRole = 'kader' | 'bidan' | 'pemdes' | 'opd' | 'pengurus' | 'admin'

/**
 * Validates a workflow status transition based on the ticket's current status and the user's role.
 *
 * @param oldStatus Current status of the ticket
 * @param newStatus Proposed new status
 * @param role Current user role
 * @param opdTujuan (Optional) OPD destination for disposisi_opd status
 */
export function validateWorkflowTransition(
  oldStatus: TicketStatus,
  newStatus: TicketStatus,
  role: UserRole,
  opdTujuan?: string
): { success: true } | { success: false; error: string } {
  // 1. Terminal state check
  if (oldStatus === 'selesai' || oldStatus === 'ditolak') {
    return {
      success: false,
      error: 'Tiket sudah selesai atau ditolak, status tidak dapat diubah lagi.',
    }
  }

  // 2. Allowed transition paths
  const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
    didata: ['verifikasi_kunjungan', 'ditolak'],
    verifikasi_kunjungan: ['diajukan_pemdes', 'ditolak'],
    diajukan_pemdes: ['disposisi_opd', 'selesai', 'ditolak'],
    disposisi_opd: ['selesai', 'ditolak'],
    selesai: [],
    ditolak: [],
  }

  if (!allowedTransitions[oldStatus]?.includes(newStatus)) {
    return {
      success: false,
      error: `Transisi status dari "${oldStatus}" ke "${newStatus}" tidak valid.`,
    }
  }

  // 3. Role authorization checks
  if (newStatus === 'verifikasi_kunjungan' || newStatus === 'diajukan_pemdes') {
    if (!['kader', 'bidan', 'pemdes', 'admin'].includes(role)) {
      return {
        success: false,
        error: 'Hanya Kader, Bidan, atau Pemdes yang dapat melakukan verifikasi.',
      }
    }
  } else if (newStatus === 'disposisi_opd') {
    if (!['pemdes', 'admin'].includes(role)) {
      return {
        success: false,
        error: 'Hanya Pemerintah Desa (Kades/Sekdes) yang dapat memberikan disposisi ke OPD.',
      }
    }
    if (!opdTujuan || opdTujuan.trim() === '') {
      return {
        success: false,
        error: 'OPD Tujuan wajib diisi untuk melakukan disposisi.',
      }
    }
  } else if (newStatus === 'selesai' || newStatus === 'ditolak') {
    if (oldStatus === 'disposisi_opd') {
      if (!['opd', 'pemdes', 'admin'].includes(role)) {
        return {
          success: false,
          error: 'Hanya OPD atau Pemdes yang dapat menyelesaikan tiket hasil disposisi.',
        }
      }
    } else {
      if (!['pemdes', 'admin'].includes(role)) {
        return {
          success: false,
          error: 'Hanya Pemdes yang dapat menyelesaikan atau menolak tiket di level ini.',
        }
      }
    }
  }

  return { success: true }
}
