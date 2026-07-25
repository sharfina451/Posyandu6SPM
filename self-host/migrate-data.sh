#!/bin/bash

# =====================================================================
#  Skrip Migrasi Data LKD Posyandu 6 SPM (Cloud -> Dedicated Local)
# =====================================================================

# Hentikan eksekusi jika terjadi error
set -e

echo "=== Memulai Proses Migrasi Data ==="

# 1. Konfigurasi Parameter (Sesuaikan saat eksekusi)
REMOTE_DB_URL=${1:-"postgresql://postgres:your-cloud-db-password@db.supabase.co:5432/postgres"}
LOCAL_CONTAINER_NAME="posyandu-db"
LOCAL_DB_USER="postgres"

echo "-> Menghubungkan ke database remote: ${REMOTE_DB_URL}"
echo "-> Target container lokal: ${LOCAL_CONTAINER_NAME}"

# 2. Backup database cloud (skema dan isi tabel)
TEMP_DUMP_FILE="cloud_backup_$(date +%F_%H%M%S).sql"
echo "-> Membuat salinan data cloud ke file temporer: ${TEMP_DUMP_FILE}..."
pg_dump --no-owner --no-privileges "${REMOTE_DB_URL}" > "${TEMP_DUMP_FILE}"

# 3. Restore database lokal
echo "-> Melakukan pembersihan skema lokal dan restore data baru..."
# Membaca dump file dan memasukkan ke PostgreSQL dalam container docker
docker exec -i "${LOCAL_CONTAINER_NAME}" psql -U "${LOCAL_DB_USER}" -d postgres < "${TEMP_DUMP_FILE}"

# 4. Hapus file dump temporer
rm -f "${TEMP_DUMP_FILE}"

echo "=== Migrasi Database Selesai ==="
echo ""
echo "=== Petunjuk Migrasi Berkas Dokumen ke MinIO ==="
echo "Untuk memindahkan berkas dokumen persyaratan dari Supabase Storage ke MinIO lokal:"
echo "1. Gunakan AWS CLI / MinIO Client (mc) untuk mengunduh semua berkas dari bucket 'dokumen' Supabase."
echo "2. Lakukan sinkronisasi langsung ke endpoint MinIO lokal:"
echo "   mc alias set local_minio http://localhost:9000 admin_posyandu admin-storage-password-posyandu6spm"
echo "   mc mb local_minio/dokumen"
echo "   mc mirror /path/to/downloaded/supabase/files local_minio/dokumen"
echo "================================================"
