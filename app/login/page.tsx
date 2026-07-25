'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Mail, Lock, Loader2, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(result.error || 'Login gagal. Periksa kembali email dan kata sandi Anda.')
        setLoading(false)
      }
    } catch {
      setError('Terjadi kesalahan koneksi. Silakan coba lagi beberapa saat lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950">
        <div className="absolute h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute h-[300px] w-[300px] rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Logo & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30 shadow-lg shadow-primary/10">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Aplikasi{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              6SPM
            </span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sistem Informasi LKD Posyandu 6 SPM Terintegrasi
          </p>
          <span className="mt-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300 border border-slate-700/50">
            Lokus Desa Lemahduwur
          </span>
        </div>

        {/* Card Form */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400"
                role="alert"
              >
                <div className="font-semibold text-rose-300 mb-0.5">Gagal Masuk</div>
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-300">
                Alamat Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/80 py-3 pl-10 pr-3 text-base text-white placeholder-slate-500 shadow-inner outline-none transition-all duration-200 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder="nama@email.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-300">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/80 py-3 pl-10 pr-3 text-base text-white placeholder-slate-500 shadow-inner outline-none transition-all duration-200 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] transition-all flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk ke Akun'
              )}
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500">
          <p>© 2026 Pemerintah Desa Lemahduwur & PKM UHN.</p>
          <p className="mt-1">
            Dilindungi enkripsi data kependudukan & kesehatan sesuai UU PDP No. 27/2022.
          </p>
        </div>
      </div>
    </div>
  )
}
