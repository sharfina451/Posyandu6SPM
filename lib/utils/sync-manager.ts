import { addToQueue, getQueue, removeFromQueue } from './indexed-db'
import { createWargaWithConsent } from '@/app/dashboard/warga/actions'
import { createLayananSpm } from '@/app/dashboard/layanan/actions'
import { createPemeriksaan } from '@/app/dashboard/kesehatan/actions'

export type SyncState = 'online' | 'offline' | 'syncing'

export interface SyncStatusChangeCallback {
  (state: SyncState, progress?: { current: number; total: number }): void
}

let syncCallbacks: SyncStatusChangeCallback[] = []
let isSyncing = false

export function subscribeSyncStatus(callback: SyncStatusChangeCallback) {
  syncCallbacks.push(callback)
  // Emit initial state
  const initial: SyncState =
    typeof navigator !== 'undefined' ? (navigator.onLine ? 'online' : 'offline') : 'online'
  callback(initial)

  return () => {
    syncCallbacks = syncCallbacks.filter((c) => c !== callback)
  }
}

function notifyCallbacks(state: SyncState, progress?: { current: number; total: number }) {
  syncCallbacks.forEach((c) => c(state, progress))
}

// 1. Submit Action (Online: execute immediately, Offline: queue in IndexedDB)
export async function submitAction(
  actionType: 'create_warga' | 'create_layanan' | 'create_pemeriksaan',
  payload: unknown
): Promise<{ success: boolean; data?: unknown; error?: string; offline?: boolean }> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  if (!isOnline) {
    try {
      await addToQueue({ actionType, payload })
      notifyCallbacks('offline')
      return { success: true, offline: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return {
        success: false,
        error: `Gagal menyimpan antrean offline: ${msg}`,
      }
    }
  }

  // Execute directly if online
  try {
    let result
    if (actionType === 'create_warga') {
      result = await createWargaWithConsent(payload as Parameters<typeof createWargaWithConsent>[0])
    } else if (actionType === 'create_layanan') {
      result = await createLayananSpm(payload as Parameters<typeof createLayananSpm>[0])
    } else if (actionType === 'create_pemeriksaan') {
      result = await createPemeriksaan(payload as Parameters<typeof createPemeriksaan>[0])
    }

    if (result && result.success) {
      return { success: true, data: result.data }
    } else {
      return {
        success: false,
        error: result?.error || 'Aksi gagal dieksekusi di server.',
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Kesalahan koneksi server.'
    return { success: false, error: msg }
  }
}

// 2. Sync Queue (FIFO processing with basic conflict logging)
export async function syncQueue(): Promise<{
  success: boolean
  totalSynced: number
}> {
  if (isSyncing) return { success: false, totalSynced: 0 }
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  if (!isOnline) {
    notifyCallbacks('offline')
    return { success: false, totalSynced: 0 }
  }

  isSyncing = true
  notifyCallbacks('syncing')

  try {
    const queue = await getQueue()
    if (queue.length === 0) {
      notifyCallbacks('online')
      isSyncing = false
      return { success: true, totalSynced: 0 }
    }

    let syncedCount = 0
    const total = queue.length

    for (let i = 0; i < total; i++) {
      const item = queue[i]
      notifyCallbacks('syncing', { current: i + 1, total })

      try {
        let result
        if (item.actionType === 'create_warga') {
          result = await createWargaWithConsent(
            item.payload as Parameters<typeof createWargaWithConsent>[0]
          )
        } else if (item.actionType === 'create_layanan') {
          result = await createLayananSpm(item.payload as Parameters<typeof createLayananSpm>[0])
        } else if (item.actionType === 'create_pemeriksaan') {
          result = await createPemeriksaan(item.payload as Parameters<typeof createPemeriksaan>[0])
        }

        if (result && result.success) {
          await removeFromQueue(item.id)
          syncedCount++
        } else {
          // Conflict / Validation Error on server: log and drop to prevent queue blockage (Last-Write-Wins/Last-Aksi-Over)
          console.warn(`[Sync Conflict] Aksi ID ${item.id} gagal di server:`, result?.error)
          // Store conflict details in localStorage for Kader's review
          const conflicts = JSON.parse(localStorage.getItem('posyandu_sync_conflicts') || '[]')
          conflicts.push({
            id: item.id,
            actionType: item.actionType,
            payload: item.payload,
            error: result?.error,
            timestamp: Date.now(),
          })
          localStorage.setItem('posyandu_sync_conflicts', JSON.stringify(conflicts))

          // Drop item from queue to continue others
          await removeFromQueue(item.id)
        }
      } catch (err) {
        // Jaringan down di tengah jalan: Hentikan sinkronisasi, coba lagi nanti
        console.error(`[Sync Network Error] Terputus saat memproses item ${item.id}:`, err)
        notifyCallbacks('offline')
        isSyncing = false
        return { success: false, totalSynced: syncedCount }
      }
    }

    notifyCallbacks('online')
    isSyncing = false
    return { success: true, totalSynced: syncedCount }
  } catch (err) {
    console.error('[Sync Queue Fatal Error]:', err)
    notifyCallbacks('online')
    isSyncing = false
    return { success: false, totalSynced: 0 }
  }
}

// 3. Register global network connection listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncQueue()
  })

  window.addEventListener('offline', () => {
    notifyCallbacks('offline')
  })
}
