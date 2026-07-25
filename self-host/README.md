# Panduan Deployment & Runbook Operasional LKD Posyandu 6 SPM

Dokumen ini menjelaskan prosedur instalasi, migrasi, rilis produksi, dan pemeliharaan operasional sistem informasi LKD Posyandu 6 SPM Lokus Desa Lemahduwur.

---

## 1. Opsi A: Deployment Cloud (Vercel & Supabase Cloud)

### Langkah Rilis Vercel (Frontend Next.js)

1. Hubungkan repositori Git ke **Vercel Dashboard**.
2. Daftarkan variabel lingkungan (Environment Variables) berikut pada pengaturan proyek Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL` (URL endpoint REST API Supabase)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Kunci anonim JWT untuk klien browser)
   - `SUPABASE_SERVICE_ROLE_KEY` (Kunci service role rahasia untuk Server Actions & pengujian)
3. Jalankan rilis produksi (`main` branch) otomatis. Vercel akan menyajikan aplikasi dengan HTTPS/SSL terpasang otomatis.

### Kriteria Cadangan & Pemulihan (RPO/RTO Supabase Cloud)

- **Backup**:
  - Supabase melakukan pencadangan otomatis (Daily Automated Backup) sekali setiap 24 jam.
  - **RPO (Recovery Point Objective)**: Maksimal 24 jam (kehilangan data maksimal dalam 1 hari terakhir).
  - **RTO (Recovery Time Objective)**: Maksimal 4 jam untuk pemulihan instance database penuh.
- **Enkripsi**: Seluruh data sensitif warga dienkripsi saat transit (SSL/TLS) dan dienkripsi di media penyimpanan (AES-256).

---

## 2. Opsi B: Dedicated Server Mandiri (Self-Hosted Docker)

Untuk kemandirian desa tanpa ketergantungan cloud, sistem LKD Posyandu 6 SPM dirancang portabel dan dapat dijalankan di server fisik/lokal Kantor Desa Lemahduwur menggunakan Docker Compose.

### Persyaratan Sistem

- Sistem Operasi: Linux (Ubuntu/Debian) atau Windows Server dengan Docker Desktop terpasang.
- Docker Engine >= 20.10 dan Docker Compose >= 2.10.
- Port yang harus terbuka:
  - `8000`: Kong API Gateway (menghubungkan Next.js ke database/auth).
  - `5432`: Akses langsung PostgreSQL (opsional, untuk admin/migrasi).

### Langkah Instalasi

1. Masuk ke direktori `self-host/`.
2. Salin file `.env.example` menjadi `.env` dan sesuaikan parameter rahasia:
   ```bash
   cp .env.example .env
   ```
3. Nyalakan seluruh layanan container backend:
   ```bash
   docker compose up -d
   ```
4. Pastikan semua kontainer berjalan sehat:
   ```bash
   docker compose ps
   ```
5. Ubah variabel lingkungan Next.js `.env.local` untuk mengarah ke API lokal:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-kong-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-local-kong-service-key
   ```

---

## 3. Runbook Operasional & Pemeliharaan

### A. Prosedur Backup Database Manual (Dedicated Server)

Jalankan pencadangan manual secara berkala menggunakan utilitas `pg_dump`:

```bash
docker exec -t self-host-db-1 pg_dumpall -c -U postgres > backup_posyandu_$(date +%F).sql
```

Simpan file `.sql` hasil backup ke media eksternal (Flashdisk/NAS Kantor Desa) yang aman dari akses jaringan luar.

### B. Prosedur Restore Database (Pemulihan Data)

Untuk memulihkan database dari file SQL cadangan:

1. Pastikan container database berjalan bersih.
2. Eksekusi pemulihan data:
   ```bash
   cat backup_posyandu_2026-07-25.sql | docker exec -i self-host-db-1 psql -U postgres
   ```

### C. Prosedur Rotasi Kunci Rahasia

Bila terdeteksi indikasi kebocoran kredensial:

1. Matikan stack: `docker compose down`.
2. Buka file `self-host/.env`.
3. Perbarui nilai `JWT_SECRET`, `POSTGRES_PASSWORD`, dan regenerate API Keys.
4. Nyalakan kembali stack: `docker compose up -d`.
5. Perbarui variabel lingkungan pada sisi aplikasi Next.js (Vercel atau `.env.local`).

---

## 4. Pelaksanaan Uji Beban (Load Testing)

Untuk memvalidasi ketahanan performa sistem menangani kader posyandu secara bersamaan:

1. Jalankan server lokal atau target testing:
   ```bash
   npm run start
   ```
2. Eksekusi skrip simulasi beban `autocannon` untuk 50 concurrent users:
   ```bash
   npx tsx scratch/load-test.ts
   ```
3. Pastikan rata-rata waktu respons (latency) di bawah 2 detik (2000ms) dan tingkat kegagalan (errors) adalah 0%.
