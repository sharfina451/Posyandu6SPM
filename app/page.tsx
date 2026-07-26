import React from 'react'
import Link from 'next/link'
import {
  FileText,
  Activity,
  GraduationCap,
  Hammer,
  Home as HomeIcon,
  ShieldCheck,
  HeartHandshake,
  ArrowRight,
} from 'lucide-react'

export default function Home() {
  const spmFields = [
    {
      title: 'Kesehatan',
      desc: 'Tumbuh kembang balita, imunisasi rutin, dan skrining penyakit lansia.',
      icon: Activity,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    {
      title: 'Pendidikan',
      desc: 'Pemantauan akses PAUD, penguatan literasi digital, dan taman baca desa.',
      icon: GraduationCap,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Pekerjaan Umum',
      desc: 'Pengecekan akses air minum layak dan pengelolaan sanitasi lingkungan.',
      icon: Hammer,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    },
    {
      title: 'Perumahan Rakyat',
      desc: 'Identifikasi kelayakan huni rumah tangga dan usulan bedah RTLH.',
      icon: HomeIcon,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Trantibumlinmas',
      desc: 'Mitigasi kebencanaan, cegah dini gangguan ketertiban, dan layanan perlindungan.',
      icon: ShieldCheck,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Sosial',
      desc: 'Pendataan fakir miskin, penyaluran bansos, dan perlindungan disabilitas.',
      icon: HeartHandshake,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    },
  ]

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden">
      {/* Background Glows */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="absolute h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-[120px] top-[-10%]" />
        <div className="absolute h-[400px] w-[400px] rounded-full bg-teal-500/5 blur-[100px] bottom-[-10%]" />
      </div>

      {/* Navbar */}
      <header className="relative w-full border-b border-slate-900 bg-slate-950/40 backdrop-blur-md px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-md">
            <span className="font-bold text-base">SP</span>
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white block">SiPandu</span>
            <span className="text-[10px] text-slate-400 block -mt-0.5">Lemahduwur</span>
          </div>
        </div>

        <Link href="/dashboard">
          <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95">
            Masuk Ke Dashboard <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </Link>
      </header>

      {/* Main Hero & Content */}
      <main className="relative flex-1 max-w-5xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center justify-center text-center z-10 space-y-12">
        {/* Hero Info */}
        <div className="space-y-4 max-w-2xl">
          <span className="rounded-full bg-slate-900 border border-slate-800 px-3.5 py-1 text-[11px] font-semibold text-slate-400 tracking-wide uppercase inline-block">
            📍 Lokus Pilot Project Desa Lemahduwur
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
            Pelayanan Posyandu{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent block mt-2">
              6 SPM Terintegrasi
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed pt-2">
            Sinergi pendataan, pemantauan tumbuh kembang, dan pelacakan rujukan 5 hari kerja
            pelayanan Standar Pelayanan Minimal LKD Posyandu Desa Lemahduwur.
          </p>
        </div>

        {/* Action Button */}
        <div>
          <Link href="/dashboard">
            <button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm px-8 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/10 transition transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 duration-200 flex items-center gap-2">
              <FileText className="h-4.5 w-4.5" /> Akses Aplikasi SiPandu
            </button>
          </Link>
        </div>

        {/* Grid of 6 SPM fields */}
        <div className="w-full space-y-4">
          <h2 className="text-xs font-black uppercase text-slate-500 tracking-widest text-center">
            Penyelenggaraan 6 Urusan SPM LKD Posyandu
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 text-left">
            {spmFields.map((field, idx) => {
              const Icon = field.icon
              return (
                <div
                  key={idx}
                  className="bg-slate-900/40 border border-slate-900 hover:border-slate-800 p-5 rounded-2xl flex gap-4 transition duration-300 backdrop-blur-xl shadow-inner group"
                >
                  <div
                    className={`p-3 rounded-xl border shrink-0 h-11 w-11 flex items-center justify-center ${field.color}`}
                  >
                    <Icon className="h-5.5 w-5.5 group-hover:scale-110 transition duration-300" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-white text-sm">{field.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{field.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-slate-900 bg-slate-950/40 py-6 text-center text-xs text-slate-600 z-10">
        <p>© 2026 Pemerintah Desa Lemahduwur & PKM Universitas Harkat Negeri.</p>
        <p className="mt-1">
          Kepatuhan pelindungan data terenkripsi sesuai regulasi UU PDP No. 27 Tahun 2022.
        </p>
      </footer>
    </div>
  )
}
