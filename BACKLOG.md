# BACKLOG & USER STORIES — Aplikasi 6SPM

Backlog kerja **task-per-task** untuk agen AI/developer. Turunan dari `PRD_Posyandu_6SPM_FINAL.md`, `database/schema_6spm.sql`, dan `database/ERD_6spm.md`.

**Target hosting:** `dev` → **Vercel** (frontend + API) + **Supabase** (Postgres/PostGIS, Auth, Storage, Realtime). `prod` akhir → **self-hosted dedicated** (jalur migrasi di Epic 13). Prinsip: **tech stack sederhana & portabel** (semua standar Postgres + Next.js, minim vendor lock-in).

---

## 0. Cara Memakai Backlog Ini (untuk Agen AI)

1. Kerjakan **berurutan per Epic**, dan di dalam Epic ikuti urutan task. Hormati **Dependensi**.
2. Setiap task adalah kotak centang. Tandai **`- [x]`** HANYA jika:
   - Kode selesai & lolos _lint_ + _type-check_ + _build_.
   - **Kriteria Penerimaan (AC)** cerita induknya terpenuhi.
   - Ada tes minimal (unit/integration) bila task berlogika, dan tes **hijau**.
3. Jangan menandai selesai bila hanya "kelihatannya jalan". Jika terblokir, tulis catatan di bawah task: `> BLOCKED: <alasan>`.
4. Satu task = satu _commit_ kecil bila memungkinkan. Pesan commit: `feat(E3): ...`, `fix(E7): ...`.
5. Rahasia/kunci **tidak** di-_commit_; pakai `.env.local` (dev) & Environment Variables Vercel/Supabase.

### Definition of Ready (DoR)

- AC jelas, dependensi selesai, desain data ada di schema, dan tidak menunggu keputusan terbuka.

### Definition of Done (DoD)

- AC terpenuhi · tes hijau · lint/type-check bersih · responsif mobile · sesuai RLS/PDP · terdeploy ke _preview_ Vercel tanpa error.

### Legenda estimasi: **S** ≤ 0.5 hari · **M** 0.5–1.5 hari · **L** 2–4 hari

---

## 1. Tech Stack (Sederhana)

| Lapisan    | Pilihan                                                          | Alasan                                                                     |
| :--------- | :--------------------------------------------------------------- | :------------------------------------------------------------------------- |
| Framework  | **Next.js 14 (App Router) + TypeScript**                         | Satu repo untuk UI + API (Route Handlers/Server Actions), native di Vercel |
| UI         | **Tailwind CSS + shadcn/ui**                                     | Komponen aksesibel siap pakai (memenuhi target WCAG, tombol besar)         |
| DB         | **Supabase Postgres 15 + PostGIS**                               | Sesuai `schema_6spm.sql`; SQL standar → portabel                           |
| Auth       | **Supabase Auth** (email+password, JWT)                          | Sesi & JWT bawaan (NFR-03)                                                 |
| Otorisasi  | **Postgres RLS** + custom claim `role`                           | Keamanan di level baris, portabel ke self-host                             |
| Storage    | **Supabase Storage** (bucket privat)                             | Unggah KTP/KK/Foto rumah 3 sisi                                            |
| Realtime   | **Supabase Realtime**                                            | Dashboard & alert eskalasi live                                            |
| Peta       | **react-leaflet + OpenStreetMap**                                | Tanpa API key, gratis; PostGIS untuk data                                  |
| Grafik     | **Recharts**                                                     | KMS & dashboard, ringan                                                    |
| Offline    | **PWA (Serwist) + Dexie (IndexedDB)**                            | Mode offline-first kader (FR-06)                                           |
| Laporan    | **exceljs** (Excel) + **@react-pdf/renderer** (PDF)              | Ekspor FR-17                                                               |
| Terjadwal  | **Supabase pg_cron** / **Vercel Cron**                           | Cek SLA & eskalasi harian (FR-10)                                          |
| Notifikasi | **Edge Function → gateway WA** (Fonnte/Twilio) [ASUMSI provider] | MVP boleh mulai dari email/in-app                                          |
| Tes        | **Vitest** (unit) + **Playwright** (e2e ringan)                  | Sederhana                                                                  |
| Kualitas   | **ESLint + Prettier + TypeScript strict**                        |                                                                            |

> **Keputusan asumsi (boleh diubah):** provider WhatsApp belum final → Epic 7 memakai abstraksi `NotificationProvider` agar mudah diganti. Peta pakai OSM (tanpa biaya).

---

## 2. Peta Epic & Urutan

| Epic    | Nama                              | Fase PRD | Prasyarat |
| :------ | :-------------------------------- | :------- | :-------- |
| **E0**  | Fondasi Proyek & Infra            | 1        | —         |
| **E1**  | Autentikasi & RBAC/RLS            | 1        | E0        |
| **E2**  | Master Data & Wilayah             | 1        | E1        |
| **E3**  | Warga & Rumah Tangga (NIK)        | 1        | E2        |
| **E4**  | Register Digital 6 SPM            | 1        | E3        |
| **E5**  | Modul Kesehatan / ILP             | 1        | E4        |
| **E6**  | Offline-First & Sinkronisasi      | 1        | E4        |
| **E7**  | Workflow Tiket & SLA              | 1        | E4, E8    |
| **E8**  | Dokumen & Storage                 | 1        | E3        |
| **E9**  | Dashboard, GIS & Skor Kerentanan  | 2        | E4, E7    |
| **E10** | Registrasi Kelembagaan Posyandu   | 2        | E2        |
| **E11** | Pelaporan PDF/Excel               | 1–2      | E4, E7    |
| **E12** | Admin, Audit & Kepatuhan PDP      | 1        | E1        |
| **E13** | Deployment & Migrasi ke Dedicated | 3        | semua     |

**Milestone MVP (Fase 1) = E0–E8, E11, E12.** Fase 2 = E9, E10. Fase 3 = E13 + evaluasi ML.

---

## EPIC E0 — Fondasi Proyek & Infrastruktur

**Tujuan:** repo, tooling, koneksi Supabase, deploy pertama ke Vercel.

### US-E0.1 — Sebagai developer, saya butuh kerangka proyek agar bisa mulai membangun. _(M)_

**AC:** `npm run dev` jalan; halaman placeholder tampil; lint & type-check lolos; ter-deploy ke preview Vercel.

- [x] T-E0.1 Inisialisasi Next.js 14 (App Router, TS, ESLint) + Tailwind.
- [x] T-E0.2 Pasang shadcn/ui + tema dasar (kontras tinggi, font terbaca).
- [x] T-E0.3 Konfigurasi ESLint + Prettier + `tsconfig` strict + Husky pre-commit.
- [x] T-E0.4 Struktur folder: `app/`, `components/`, `lib/`, `supabase/`, `tests/`.
- [x] T-E0.5 Setup Vitest + Playwright (contoh 1 tes lulus).
- [x] T-E0.6 `README.md` cara menjalankan + `.env.example`.

### US-E0.2 — Sebagai developer, saya butuh Supabase terhubung & skema termigrasi. _(M)_

**AC:** `supabase db push` menerapkan `schema_6spm.sql`; PostGIS aktif; client Supabase terbaca dari env.

- [x] T-E0.7 Buat proyek Supabase (dev) + simpan URL & anon/service key di env.
- [x] T-E0.8 Setup Supabase CLI + folder `supabase/migrations/`; masukkan `schema_6spm.sql` sebagai migrasi awal.
- [x] T-E0.9 Aktifkan ekstensi `postgis` & `pgcrypto` di migrasi.
- [x] T-E0.10 Buat `lib/supabase/client.ts` (browser) & `server.ts` (server/service-role).
- [x] T-E0.11 Uji koneksi: query `select 1` + cek `postgis_version()`.

### US-E0.3 — Sebagai tim, saya butuh CI agar kualitas terjaga. _(S)_

**AC:** PR memicu lint+type-check+test; gagal → PR merah.

- [x] T-E0.12 GitHub Actions: install, lint, type-check, test, build.
- [x] T-E0.13 Hubungkan repo ke Vercel (auto preview per PR).

---

## EPIC E1 — Autentikasi & RBAC/RLS

**Tujuan:** login aman, 6 peran, keamanan level baris. _(Bagian 5, NFR-03, FR-19)_

### US-E1.1 — Sebagai pengguna, saya bisa login/logout dengan aman. _(M)_

**AC:** login email+password; sesi JWT; sesi kedaluwarsa maks 4 jam; logout membersihkan sesi; rute terproteksi menolak tamu.

- [x] T-E1.1 Integrasi Supabase Auth (sign-in, sign-out, session refresh).
- [x] T-E1.2 Middleware proteksi rute (`middleware.ts`) + redirect ke `/login`.
- [x] T-E1.3 Set masa sesi maks 4 jam (konfigurasi Auth/refresh).
- [x] T-E1.4 Halaman login mobile-first (tombol ≥44px, kontras tinggi).

### US-E1.2 — Sebagai admin, peran pengguna menentukan hak akses. _(L)_

**AC:** tabel `pengguna` tertaut `auth.users`; klaim `role` masuk JWT; RLS membatasi data sesuai peran & scope wilayah.

- [x] T-E1.5 Kolom/relasi `pengguna.id = auth.users.id`; trigger buat baris `pengguna` saat signup (atau via admin).
- [x] T-E1.6 Custom Access Token Hook: sisipkan `role` & `wilayah_id` ke JWT.
- [x] T-E1.7 Helper `getCurrentUserRole()` server & client.
- [x] T-E1.8 Aktifkan RLS di semua tabel data; tulis policy dasar per peran (kader: hanya wilayah-nya; pemdes/opd: desa; admin: semua). Simpan sebagai migrasi `rls_policies.sql`.
- [x] T-E1.9 Tes RLS: kader RW01 tidak bisa baca data RW02.
- [x] T-E1.10 Komponen `<RoleGate>` untuk sembunyikan menu sesuai peran.

---

## EPIC E2 — Master Data & Wilayah

**Tujuan:** entitas Posyandu, RW/RT, kepengurusan, seed lokus. _(Bagian 5, FR-13 dasar)_

### US-E2.1 — Sebagai admin, saya mengelola data Posyandu & wilayah RW/RT. _(M)_

**AC:** CRUD posyandu; CRUD wilayah dengan hirarki RW→RT; hanya admin.

- [x] T-E2.1 CRUD `posyandu` (form + list).
- [x] T-E2.2 CRUD `wilayah` RW & RT (parent-child), validasi kode unik.
- [x] T-E2.3 Seed: 1 posyandu (Lemahduwur) + RW 01–08.
- [x] T-E2.4 CRUD `pengurus_posyandu` (Ketua/Sekretaris/Bendahara/6 Ketua Bidang).

### US-E2.2 — Sebagai admin, saya mengelola akun kader & petugas. _(M)_

**AC:** admin membuat/menonaktifkan pengguna, menetapkan peran + scope RW.

- [x] T-E2.5 Halaman manajemen pengguna (list, buat, edit peran, nonaktifkan).
- [x] T-E2.6 Undang kader (buat auth user + baris `pengguna` + wilayah).
- [x] T-E2.7 Tes: perubahan scope wilayah langsung memengaruhi akses (RLS).

---

## EPIC E3 — Warga & Rumah Tangga (Single Identity Index)

**Tujuan:** identitas berbasis NIK anti-duplikat + rumah tangga. _(FR-01/02/03)_

### US-E3.1 — Sebagai kader, saya mencari warga via NIK/scan agar tak input ulang. _(M)_

**AC:** cari via NIK (16 digit) atau scan barcode KTP/KIA; bila ada → tampil profil; bila tidak → tawarkan buat baru; NIK duplikat ditolak.

- [x] T-E3.1 API + UI pencarian warga berdasarkan NIK.
- [x] T-E3.2 Scan barcode KTP/KIA via kamera (mis. `@zxing/browser`) → isi field NIK.
- [x] T-E3.3 Validasi NIK (regex 16 digit) + cegah duplikat (unik di DB & pesan ramah).

### US-E3.2 — Sebagai kader, saya mendaftarkan warga & rumah tangga baru. _(M)_

**AC:** form biodata + pilih/buat rumah tangga (No KK); alamat RT/RW terstruktur; tersimpan dengan audit.

- [x] T-E3.4 Form `warga` (NIK, nama, JK, tgl lahir, hubungan keluarga, disabilitas).
- [x] T-E3.5 Form/inline `rumah_tangga` (No KK, alamat, RT, `dekat_industri`).
- [x] T-E3.6 Tandai `nik_terverifikasi=false` (verifikasi manual; NG4).
- [x] T-E3.7 Catat `consent_pdp` saat pendataan pertama (persetujuan warga).
- [x] T-E3.8 Detail warga: ringkasan + riwayat layanan (kosong dulu).

### US-E3.3 — Sistem menyarankan form SPM sesuai profil. _(S)_ _(FR-02)_

**AC:** berdasarkan usia/kondisi, sistem menyarankan bidang relevan (bayi→imunisasi; lansia→PTM & Sosial); kader tetap bisa pilih manual.

- [x] T-E3.9 Util `saranBidang(warga)` (aturan usia sederhana).
- [x] T-E3.10 Tampilkan chip saran di halaman warga (bukan paksaan).

---

## EPIC E4 — Register Digital 6 SPM

**Tujuan:** formulir dinamis 6 bidang + penyimpanan. _(FR-04, Bagian 7)_

### US-E4.1 — Sebagai kader, saya mencatat layanan di 6 bidang SPM. _(L)_

**AC:** pilih bidang → form sesuai bidang; data tersimpan ke `layanan_spm` (+`detail` JSONB); tertaut warga & (opsional) kunjungan.

- [x] T-E4.1 Skema form per bidang (deklaratif, mis. objek konfigurasi field) mengacu cakupan PRD Bagian 7.
- [x] T-E4.2 Renderer form dinamis dari konfigurasi (input/select/checkbox/upload).
- [x] T-E4.3 Simpan `layanan_spm` (bidang, jenis_layanan, `detail` JSONB, kader_id).
- [x] T-E4.4 Field & persyaratan berkas per bidang sesuai PRD Bagian 6 (Pendidikan, PU, Perumahan, Trantibumlinmas, Sosial).
- [x] T-E4.5 Validasi form (zod) + pesan error jelas (Bahasa Indonesia).

### US-E4.2 — Sebagai kader, saya mengelola sesi kunjungan (Hari Buka/door-to-door). _(M)_

**AC:** buat kunjungan (jenis, tanggal, RW); layanan bisa dikaitkan ke kunjungan; rekap per kunjungan.

- [x] T-E4.6 CRUD `kunjungan` + kaitkan `layanan_spm`.
- [x] T-E4.7 Ringkasan kunjungan (jumlah warga terlayani per bidang).

### US-E4.3 — Sebagai kader, saya melihat & mengedit riwayat layanan warga. _(S)_

**AC:** daftar layanan per warga, bisa edit/hapus (soft) dengan audit.

- [x] T-E4.8 Daftar & detail layanan pada halaman warga.
- [x] T-E4.9 Edit/soft-delete layanan (tercatat di audit).

---

## EPIC E5 — Modul Kesehatan / ILP

**Tujuan:** antropometri, KMS, skrining K3/PTM, alur 5 meja. _(FR-05)_

### US-E5.1 — Sebagai kader, saya mencatat antropometri & melihat KMS. _(L)_

**AC:** input BB/TB/LK/LiLA; grafik pertumbuhan (KMS) tampil; indikasi stunting/gizi kurang ditandai.

- [x] T-E5.1 Form `pemeriksaan_kesehatan` (antropometri + tensi + gula).
- [x] T-E5.2 Hitung status gizi (z-score WHO / tabel sederhana) → `status_gizi`.
- [x] T-E5.3 Grafik KMS (Recharts) per anak dari riwayat.
- [x] T-E5.4 Penanda visual risiko (stunting/gizi kurang).

### US-E5.2 — Sebagai kader/bidan, saya melakukan skrining K3 & lansia. _(M)_

**AC:** form keluhan ISPA & paparan polutan (kawasan Rumah Produktif); skrining PTM lansia (tensi/gula).

- [x] T-E5.5 Field `keluhan_ispa`, `paparan_polutan` untuk warga `dekat_industri`.
- [x] T-E5.6 Skrining lansia/PTM + penandaan tindak lanjut.

### US-E5.3 — Sebagai bidan, saya memverifikasi & menindaklanjuti data kesehatan. _(M)_

**AC:** dashboard bidan menampilkan kasus perlu tindak lanjut; bisa buat rujukan (→ Tiket bidang Kesehatan).

- [x] T-E5.7 Dashboard bidan (daftar kasus gizi/PTM/K3).
- [x] T-E5.8 Aksi "Buat Rujukan" → membuat `tiket` (integrasi E7).

---

## EPIC E6 — Offline-First & Sinkronisasi

**Tujuan:** input tanpa sinyal + sync otomatis. _(FR-06, NFR-06)_

### US-E6.1 — Sebagai kader, aplikasi bisa dipakai tanpa internet. _(L)_

**AC:** app terpasang sebagai PWA; form warga/layanan/kesehatan tersimpan lokal saat offline; indikator status online/offline.

- [x] T-E6.1 Konfigurasi PWA (Serwist) + manifest + ikon + installable.
- [x] T-E6.2 Skema Dexie (IndexedDB) mirror tabel inti (warga, layanan_spm, pemeriksaan, tiket-draft).
- [x] T-E6.3 Lapisan repo data: baca/tulis lokal dulu, tandai `pending_sync`.
- [x] T-E6.4 Indikator koneksi + jumlah data tertunda.

### US-E6.2 — Data tersinkron otomatis saat online tanpa kehilangan/duplikasi. _(L)_

**AC:** antrean sync jalan saat online; konflik tertangani (last-write-wins + log); tidak ada duplikat (idempoten via UUID lokal).

- [x] T-E6.5 Generate UUID di klien (dipakai sebagai PK) → idempoten.
- [x] T-E6.6 Worker sync (background sync / on-reconnect) push antrean ke Supabase.
- [x] T-E6.7 Strategi konflik + catat di log; retry dengan backoff.
- [x] T-E6.8 Tes: buat data offline → online → muncul benar & sekali saja.

---

## EPIC E7 — Workflow Tiket & SLA

**Tujuan:** tiket permohonan/rujukan, alur 5 tahap, SLA 5 hari kerja, eskalasi. _(FR-07/08/09/10/11)_

### US-E7.1 — Sebagai kader, permohonan warga otomatis jadi tiket bernomor. _(M)_

**AC:** buat tiket dari layanan/permohonan; `nomor_tiket` unik (mis. `SPM-<BIDANG>-YYYYMM-####`); status awal `didata`.

- [ ] T-E7.1 Generator `nomor_tiket` (aman-konkuren, per bidang+bulan).
- [ ] T-E7.2 API buat tiket + tautkan `layanan_spm`/warga/rumah tangga.
- [ ] T-E7.3 Form buat tiket (jenis_permohonan, deskripsi, prioritas).

### US-E7.2 — Sebagai aktor, saya memproses tiket sesuai alur baku. _(L)_

**AC:** transisi status `didata → verifikasi_kunjungan → diajukan_pemdes → disposisi_opd → selesai` (atau `ditolak`); setiap transisi tercatat di `tiket_riwayat_status`; hanya peran berwenang yang boleh transisi tertentu.

- [ ] T-E7.4 State machine transisi (validasi peran per langkah).
- [ ] T-E7.5 Simpan setiap transisi ke `tiket_riwayat_status`.
- [ ] T-E7.6 UI papan tiket (kolom per status) + detail + tombol aksi sesuai peran.
- [ ] T-E7.7 Cabang "Tidak Memenuhi Syarat" → `ditolak` + alasan.

### US-E7.3 — Sebagai Kepala Desa, saya memantau SLA & menerima eskalasi. _(L)_

**AC:** `tenggat_sla` = 5 hari kerja (memakai `hari_libur`); tiket >3 hari tanpa perubahan ditandai eskalasi; notifikasi terkirim.

- [ ] T-E7.8 Util hitung hari kerja (Sen–Jum minus `hari_libur`) → `tenggat_sla`.
- [ ] T-E7.9 Isi tabel `hari_libur` (libur nasional + kalender desa) [perlu data].
- [ ] T-E7.10 Cron harian (Vercel Cron/pg_cron) evaluasi `v_tiket_sla`.
- [ ] T-E7.11 Abstraksi `NotificationProvider` (in-app + email; slot WA).
- [ ] T-E7.12 Kirim alert eskalasi (red-flag) ke dashboard + WA/email Kades.
- [ ] T-E7.13 Realtime badge tiket lewat SLA di dashboard.

### US-E7.4 — Sebagai warga/kader, pengaduan Trantibumlinmas bersifat tertutup. _(M)_

**AC:** tiket `rahasia=true` hanya terlihat peran berwenang; jalur persetujuan Kepala Desa sebelum diteruskan ke OPD/Kepolisian.

- [ ] T-E7.14 Flag `rahasia` + RLS khusus (sembunyikan dari peran lain).
- [ ] T-E7.15 Langkah persetujuan Kades pada alur Trantibumlinmas.

---

## EPIC E8 — Dokumen & Storage

**Tujuan:** unggah berkas persyaratan aman. _(Bagian 6, FR-16 lampiran)_

### US-E8.1 — Sebagai kader, saya mengunggah berkas persyaratan tiket. _(M)_

**AC:** upload ke bucket privat; jenis berkas sesuai bidang (KTP, KK, Surat Tidak Mampu, Foto Rumah 3 sisi, dll); hanya peran berwenang bisa akses; URL bertanda tangan (signed).

- [ ] T-E8.1 Buat bucket privat `dokumen` + policy Storage (RLS).
- [ ] T-E8.2 Komponen upload (kompres gambar di klien untuk hemat kuota).
- [ ] T-E8.3 Simpan metadata ke `dokumen_persyaratan` (jenis, url, tiket).
- [ ] T-E8.4 Foto Rumah 3 sisi (perumahan) dengan panduan 3 slot.
- [ ] T-E8.5 Akses berkas via signed URL (kedaluwarsa), bukan URL publik.

---

## EPIC E9 — Dashboard, GIS & Skor Kerentanan

**Tujuan:** dashboard eksekutif, peta, skor rule-based transparan, daftar prioritas & potensi exclusion. _(FR-12/13/14/15)_

### US-E9.1 — Sebagai Pemdes/OPD, saya melihat dashboard capaian 6 SPM. _(L)_

**AC:** kartu KPI (per bidang, per RW), status SLA, corong permohonan; data live.

- [ ] T-E9.1 Query agregasi (view/materialized) capaian per bidang & RW.
- [ ] T-E9.2 Dashboard eksekutif (kartu + grafik Recharts).
- [ ] T-E9.3 Filter periode & wilayah.

### US-E9.2 — Sebagai kader, saya melihat peta kerentanan RW 01–08. _(L)_

**AC:** peta Leaflet menandai rumah tangga berwarna sesuai klasifikasi; klik → detail & faktor.

- [ ] T-E9.4 Layer peta (react-leaflet + OSM) render titik `rumah_tangga`.
- [ ] T-E9.5 Warna indikator (aman/waspada/bahaya/kritis) + legenda.
- [ ] T-E9.6 Popup detail rumah tangga + faktor skor.

### US-E9.3 — Sistem menghitung skor kerentanan yang transparan & dapat diaudit. _(L)_ _(FR-14)_

**AC:** skor = Σ(bobot·kondisi) dari `variabel_kerentanan`; simpan `skor_kerentanan` + `skor_kerentanan_detail` (alasan); klasifikasi sesuai ambang PRD; **bukan** kotak hitam; ada penjelasan faktor.

- [ ] T-E9.7 Fungsi skoring rule-based (server) memakai bobot DB.
- [ ] T-E9.8 Simpan total, persen, klasifikasi, + rincian per variabel.
- [ ] T-E9.9 Recompute terjadwal + saat data berubah.
- [ ] T-E9.10 UI admin atur bobot `variabel_kerentanan` (versi).

### US-E9.4 — Sebagai kader, saya dapat daftar prioritas kunjungan & potensi exclusion. _(M)_ _(FR-15)_

**AC:** daftar rumah tangga urut skor tertinggi; tandai `potensi_eksklusi` (rentan tinggi belum terima bansos) sebagai **rekomendasi tinjau**, bukan keputusan otomatis.

- [ ] T-E9.11 Daftar prioritas kunjungan (urut skor) untuk kader.
- [ ] T-E9.12 View `v_potensi_exclusion` → halaman "Perlu Ditinjau" + aksi verifikasi.

---

## EPIC E10 — Registrasi Kelembagaan Posyandu

**Tujuan:** bantu penyiapan berkas nomor registrasi. _(FR-16, Kepmendagri 100.3-2834/2025)_

### US-E10.1 — Sebagai pengurus, saya menyiapkan berkas registrasi Posyandu. _(M)_

**AC:** unggah SK TP Posyandu, SK Pengurus, matriks rekap; status registrasi terlacak; simpan nomor registrasi resmi (format `PP.KK.KC.DDDD.NNN`).

- [ ] T-E10.1 CRUD `dokumen_registrasi` + status (`draf→diajukan→terdaftar/dikembalikan`).
- [ ] T-E10.2 Form simpan `nomor_registrasi` + validasi format.
- [ ] T-E10.3 Checklist kelengkapan berkas registrasi.

---

## EPIC E11 — Pelaporan PDF/Excel

**Tujuan:** laporan bulanan format baku + rekap. _(FR-17/18)_

### US-E11.1 — Sebagai Pemdes, saya mengekspor laporan bulanan 6 SPM. _(L)_

**AC:** pilih periode & (opsional) bidang → unduh **Excel** & **PDF** sesuai format baku Kemendagri/Dispermades; tercatat di `laporan_bulanan`.

- [ ] T-E11.1 Query rekap bulanan per bidang/RW.
- [ ] T-E11.2 Ekspor Excel (exceljs) sesuai template [perlu template resmi].
- [ ] T-E11.3 Ekspor PDF (@react-pdf/renderer) + kop/format baku.
- [ ] T-E11.4 Simpan metadata & tautan file ke `laporan_bulanan`.

### US-E11.2 — Sebagai kader, rekap Hari Buka/kunjungan tersaji otomatis. _(S)_ _(FR-18)_

**AC:** rekap per kunjungan siap dikirim ke Pemdes/Pustu.

- [ ] T-E11.5 Ringkasan otomatis per kunjungan + tombol ekspor.

---

## EPIC E12 — Admin, Audit & Kepatuhan PDP

**Tujuan:** audit trail, keamanan, consent. _(FR-19/20/21, NFR-01..05)_

### US-E12.1 — Setiap perubahan data warga terekam (audit trail). _(M)_ _(FR-20)_

**AC:** create/update/delete/export tercatat di `audit_log` (siapa, kapan, sebelum/sesudah); admin bisa menelusuri.

- [ ] T-E12.1 Trigger/DB function audit untuk tabel sensitif → `audit_log`.
- [ ] T-E12.2 Catat aksi `export` (laporan) & `login`.
- [ ] T-E12.3 Halaman telusur audit (filter pengguna/tanggal/tabel).

### US-E12.2 — Sistem mematuhi UU PDP. _(M)_ _(FR-21, NFR)_

**AC:** consent tercatat & bisa ditinjau; data sensitif terenkripsi/terlindungi; soft-delete + kebijakan retensi; tak ada data pribadi di URL.

- [ ] T-E12.4 Manajemen consent (lihat/riwayat per warga).
- [ ] T-E12.5 Pastikan RLS + signed URL + tak ada PII di query string (audit rute).
- [ ] T-E12.6 Kebijakan retensi/penghapusan (soft-delete + prosedur hard-delete teraudit).
- [ ] T-E12.7 Dokumen DPIA singkat + daftar data yang diproses.

---

## EPIC E13 — Deployment & Migrasi ke Dedicated

**Tujuan:** prod di Vercel+Supabase, lalu jalur pindah ke self-hosted. _(Fase 3, Bagian 16)_

### US-E13.1 — Sebagai tim, aplikasi rilis stabil di Vercel + Supabase. _(M)_

**AC:** environment `prod` terpisah; env vars aman; backup harian aktif; domain terpasang.

- [ ] T-E13.1 Proyek Supabase `prod` + migrasi + backup harian (RPO/RTO tercatat).
- [ ] T-E13.2 Vercel `prod` + env vars + domain + HTTPS.
- [ ] T-E13.3 Uji beban ringan (≥50 concurrent) & cek waktu muat <2s (NFR-06/07).
- [ ] T-E13.4 Runbook operasional (restore backup, rotasi kunci).

### US-E13.2 — Sebagai desa, sistem bisa pindah ke server dedicated sendiri. _(L)_

**AC:** panduan & skrip migrasi ke self-host tanpa ubah kode aplikasi bermakna; semua tetap Postgres/PostGIS standar.

- [ ] T-E13.5 `docker-compose` self-host: Postgres+PostGIS, (opsi) Supabase stack (GoTrue/Storage/Realtime) atau alternatif (Postgres + auth app + MinIO).
- [ ] T-E13.6 Skrip migrasi data (`pg_dump`/`pg_restore`) + pindah objek Storage → MinIO/S3-compat.
- [ ] T-E13.7 Abstraksi konfigurasi (URL DB/Storage/Auth via env) agar swap host tanpa ubah logika.
- [ ] T-E13.8 Uji end-to-end di lingkungan dedicated + BAST teknis (Bagian 16).

> **Catatan portabilitas:** untuk menjaga migrasi mudah, hindari fitur khusus yang tak ada di self-host; utamakan SQL standar + RLS (didukung Supabase self-host). Simpan semua perubahan DB sebagai file migrasi.

---

## 3. Ringkasan Kesiapan MVP (checklist tingkat tinggi)

- [ ] **M1 Fondasi** — E0 selesai (repo, Supabase, CI, deploy preview).
- [ ] **M2 Akses aman** — E1, E2 (login, RBAC/RLS, master data).
- [ ] **M3 Pendataan** — E3, E4, E5 (warga NIK, register 6 SPM, kesehatan/ILP).
- [ ] **M4 Lapangan** — E6, E8 (offline-first, unggah dokumen).
- [ ] **M5 Alur & SLA** — E7 (tiket, SLA 5 hari kerja, eskalasi).
- [ ] **M6 Laporan & Kepatuhan** — E11, E12 (ekspor, audit, PDP).
- [ ] **M7 Intelijen (Fase 2)** — E9, E10 (dashboard, GIS, skor, registrasi).
- [ ] **M8 Rilis & Portabilitas (Fase 3)** — E13.

---

## 4. Pertanyaan Terbuka (perlu jawaban sebelum task terkait)

1. **Data lokus final** (populasi, jumlah kader, RW/RT) — untuk E2 seed. _[ASUMSI saat ini]_
2. **Template laporan resmi** Kemendagri/Dispermades — untuk E11 (Excel/PDF).
3. **Provider WhatsApp** (Fonnte/Twilio/none) — untuk E7 notifikasi.
4. **Bobot variabel kerentanan** ditetapkan bersama siapa — untuk E9.
5. **Definisi hari kerja & kalender libur desa** — untuk E7 SLA.
6. **Jalur verifikasi NIK (Dukcapil)** tersedia atau tidak — untuk E3.
