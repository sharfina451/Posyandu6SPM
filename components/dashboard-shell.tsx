'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { logout } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { ConnectionIndicator } from '@/components/connection-indicator'
import {
  LayoutDashboard,
  Users,
  Activity,
  FileText,
  Ticket,
  Building2,
  MapPin,
  UsersRound,
  UserCog,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
  Calendar,
} from 'lucide-react'

interface UserProfile {
  email: string
  nama: string
  role: string
  wilayah_id: string | null
}

interface DashboardShellProps {
  children: React.ReactNode
  userProfile: UserProfile
}

export function DashboardShell({ children, userProfile }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const res = await logout()
    if (res.success) {
      router.push('/login')
      router.refresh()
    }
  }

  const mainNavItems = [
    { name: 'Beranda', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Sesi Kunjungan', href: '/dashboard/kunjungan', icon: Calendar },
    { name: 'Data Warga', href: '/dashboard/warga', icon: Users },
    { name: 'Layanan 6 SPM', href: '/dashboard/layanan', icon: FileText },
    { name: 'Kesehatan / ILP', href: '/dashboard/kesehatan', icon: Activity },
    { name: 'Sistem Rujukan / Tiket', href: '/dashboard/tiket', icon: Ticket },
  ]

  const adminNavItems = [
    { name: 'Kelola Posyandu', href: '/dashboard/admin/posyandu', icon: Building2 },
    { name: 'Kelola Wilayah', href: '/dashboard/admin/wilayah', icon: MapPin },
    { name: 'Kelola Pengurus', href: '/dashboard/admin/pengurus', icon: UsersRound },
    { name: 'Kelola Pengguna', href: '/dashboard/admin/pengguna', icon: UserCog },
  ]

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-900/60 border-b border-slate-800 backdrop-blur-md md:hidden w-full sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-emerald-400 border border-primary/30">
            <span className="font-bold text-sm">6S</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-white">Posyandu 6SPM</span>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionIndicator />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Toggle Menu"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 border-r border-slate-800/80 transition-transform duration-300 md:translate-x-0 md:static md:h-screen ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center px-6 border-b border-slate-800/50 justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-emerald-400 border border-primary/30 shadow-md">
              <span className="font-bold text-base">6S</span>
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block">
                Posyandu 6SPM
              </span>
              <span className="text-[10px] text-slate-400">Desa Lemahduwur</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div className="space-y-1.5">
            <span className="px-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Menu Utama
            </span>
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                    active
                      ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-500/5'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`h-5 w-5 transition-colors ${
                        active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform duration-200 opacity-0 group-hover:opacity-100 ${
                      active ? 'translate-x-0 text-emerald-400' : 'text-slate-600'
                    }`}
                  />
                </Link>
              )
            })}
          </div>

          {/* Admin panel group */}
          {userProfile.role === 'admin' && (
            <div className="space-y-1.5 pt-2 border-t border-slate-800/50">
              <div className="flex items-center space-x-1.5 px-2">
                <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  Administrasi Sistem
                </span>
              </div>
              {adminNavItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                      active
                        ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-500/5'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={`h-5 w-5 transition-colors ${
                          active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform duration-200 opacity-0 group-hover:opacity-100 ${
                        active ? 'translate-x-0 text-emerald-400' : 'text-slate-600'
                      }`}
                    />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* User profile section */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-950/40">
          <div className="flex items-center justify-between rounded-2xl bg-slate-900/80 p-3 border border-slate-800/60 shadow-lg">
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-sm font-bold text-white truncate">{userProfile.nama}</p>
              <span className="inline-flex items-center mt-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                {userProfile.role}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl h-9 w-9"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen relative z-10 p-6 md:p-8">
        {/* Top bar for desktop to display connection status */}
        <div className="hidden md:flex justify-end items-center mb-6 max-w-7xl mx-auto w-full">
          <ConnectionIndicator />
        </div>
        {/* Dynamic content rendering */}
        <div className="w-full max-w-7xl mx-auto space-y-6">{children}</div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}
    </div>
  )
}
