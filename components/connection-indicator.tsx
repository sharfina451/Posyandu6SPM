'use client'

import React, { useEffect, useState } from 'react'
import { subscribeSyncStatus, syncQueue, SyncState } from '@/lib/utils/sync-manager'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'

export function ConnectionIndicator() {
  const [state, setState] = useState<SyncState>('online')
  const [progress, setProgress] = useState<{ current: number; total: number } | undefined>(
    undefined
  )

  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((s, p) => {
      setState(s)
      if (p) {
        setProgress(p)
      } else {
        setProgress(undefined)
      }
    })

    // Check actual connection status initially
    if (typeof navigator !== 'undefined') {
      setState(navigator.onLine ? 'online' : 'offline')
    }

    return () => {
      unsubscribe()
    }
  }, [])

  const handleManualSync = async () => {
    if (state === 'online') {
      await syncQueue()
    }
  }

  return (
    <button
      onClick={handleManualSync}
      type="button"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border backdrop-blur-md active:scale-95 ${
        state === 'offline'
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
          : state === 'syncing'
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
      }`}
      title={
        state === 'offline'
          ? 'Koneksi terputus. Input Anda disimpan di database lokal.'
          : state === 'syncing'
            ? 'Sedang menyinkronkan data antrean offline ke server Supabase...'
            : 'Sistem Terhubung. Klik untuk paksa sinkronisasi.'
      }
    >
      {state === 'offline' ? (
        <>
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>Offline (Lokal)</span>
        </>
      ) : state === 'syncing' ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          <span>Sinkronisasi... {progress ? `${progress.current}/${progress.total}` : ''}</span>
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4 shrink-0" />
          <span>Terhubung</span>
        </>
      )}
    </button>
  )
}
