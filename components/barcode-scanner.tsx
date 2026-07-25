'use client'

import React, { useEffect, useRef, useState } from 'react'
import { X, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BarcodeScannerProps {
  onScan: (nik: string) => void
  onClose: () => void
}

interface ScannerInstance {
  start: (
    facingMode: { facingMode: string } | string,
    config: { fps: number; qrbox: { width: number; height: number } },
    qrCodeSuccessCallback: (decodedText: string) => void,
    qrCodeErrorCallback: (errorMessage: string) => void
  ) => Promise<void>
  stop: () => Promise<void>
  isScanning: boolean
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<ScannerInstance | null>(null)

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    let html5QrcodeModule: ScannerInstance | null = null

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        html5QrcodeModule = new Html5Qrcode('reader') as unknown as ScannerInstance
        scannerRef.current = html5QrcodeModule

        const qrCodeSuccessCallback = (decodedText: string) => {
          // Format NIK: typically 16 digits. Some barcodes might contain extra info.
          // We look for any contiguous 16-digit sequence in the scanned text.
          const match = decodedText.match(/\d{16}/)
          if (match) {
            onScan(match[0])
            stopScanner()
          } else {
            setError(`Barcode terdeteksi: "${decodedText}". NIK 16 digit tidak ditemukan.`)
          }
        }

        const config = { fps: 10, qrbox: { width: 250, height: 100 } }

        // Start scanning with environment back camera as default
        await html5QrcodeModule.start(
          { facingMode: 'environment' },
          config,
          qrCodeSuccessCallback,
          () => {} // silent ignore scan frame failures
        )
      } catch {
        setError('Gagal mengakses kamera. Pastikan izin kamera telah diberikan.')
      }
    }

    startScanner()

    return () => {
      stopScanner()
    }
  }, [onScan])

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop()
      } catch {
        // silent catch
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Scanner Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div className="flex items-center space-x-2 text-white">
            <Camera className="h-5 w-5 text-emerald-400" />
            <span className="font-bold">Scan Barcode KTP / KIA</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              stopScanner().then(onClose)
            }}
            className="text-slate-400 hover:text-white rounded-xl"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Camera Display Box */}
        <div className="relative bg-slate-950 p-6 flex flex-col items-center justify-center min-h-[300px]">
          {error ? (
            <div className="text-center p-6 space-y-4 max-w-xs">
              <p className="text-rose-400 text-sm leading-relaxed">{error}</p>
              <Button
                onClick={() => {
                  setError(null)
                  // Reload scanner
                  window.location.reload()
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs py-2"
              >
                Coba Hubungkan Kembali
              </Button>
            </div>
          ) : (
            <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 flex justify-center items-center">
              <div id="reader" className="w-full min-h-[250px] bg-slate-950" />
            </div>
          )}

          {/* Guide Overlay */}
          {!error && (
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Posisikan barcode KTP/KIA di dalam area pemindaian. Pastikan cahaya cukup.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-end bg-slate-900/60 p-4 border-t border-slate-800">
          <Button
            variant="ghost"
            onClick={() => {
              stopScanner().then(onClose)
            }}
            className="text-slate-400 hover:text-white rounded-xl text-sm"
          >
            Tutup Pemindai
          </Button>
        </div>
      </div>
    </div>
  )
}
