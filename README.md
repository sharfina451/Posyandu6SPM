# 6SPM — Sistem Informasi Tata Kelola LKD Posyandu 6 SPM Terintegrasi

Aplikasi tata kelola LKD Posyandu 6 SPM Terintegrasi (Fase 1 pilot project Kabupaten Tegal). Proyek ini dibangun menggunakan Next.js 14 App Router (TypeScript) dan Supabase (Auth, RLS, Storage, Realtime, Postgres/PostGIS).

## Tech Stack
- **Frontend/API**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui
- **Database/Backend**: Supabase Postgres + PostGIS
- **Testing**: Vitest (Unit) + Playwright (E2E)
- **Formatting & Linting**: ESLint + Prettier + Husky (pre-commit)

---

## Langkah Menjalankan Proyek Secara Lokal

### 1. Prasyarat
- Node.js >= v18.17.0 (LTS direkomendasikan, versi local Anda: v24.18.0)
- npm >= v9.0.0

### 2. Instalasi Dependensi
```bash
npm install --legacy-peer-deps
```

### 3. Konfigurasi Environment Variables
Salin berkas `.env.example` menjadi `.env.local` dan lengkapi nilai kredensial Supabase Anda:
```bash
cp .env.example .env.local
```

Isi berkas `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 4. Menjalankan Development Server
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) untuk melihat hasilnya di browser.

---

## Menjalankan Pengujian (Testing)

### Unit Testing (Vitest)
Menjalankan unit test di direktori `tests/unit/`:
```bash
npm run test:unit
```

### End-to-End Testing (Playwright)
Menjalankan E2E test di direktori `tests/e2e/`:
```bash
npm run test:e2e
```

### Type Checking & Linting
Memastikan tidak ada error tipe data TypeScript dan kode sudah terformat rapi:
```bash
npm run type-check
npm run lint
```
---

## Supabase CLI & Migrasi Database
Untuk memproses migrasi lokal menggunakan Supabase CLI:
1. Pastikan Docker berjalan di komputer Anda.
2. Lakukan inisialisasi konfigurasi:
   ```bash
   npx supabase init
   ```
3. Hubungkan ke proyek Supabase dev Anda:
   ```bash
   npx supabase link --project-ref <project-id>
   ```
4. Buat migrasi baru atau terapkan migrasi lokal:
   ```bash
   npx supabase migration new init_schema
   npx supabase db push
   ```
