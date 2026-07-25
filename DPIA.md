# Data Protection Impact Assessment (DPIA) - LKD Posyandu 6 SPM Lemahduwur

Dokumen ini disusun untuk mengevaluasi dampak, risiko, dan kepatuhan sistem LKD Posyandu 6 SPM Desa Lemahduwur terhadap **Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27/2022)** Indonesia.

---

## 1. Identifikasi Data Pribadi (PII) yang Diproses

Sistem memproses data kependudukan dan kesehatan warga Desa Lemahduwur, Kec. Adiwerna, Kab. Tegal untuk keperluan penyediaan 6 Standar Pelayanan Minimal (SPM):

1. **NIK (Nomor Induk Kependudukan)**: Single identity index, bersifat rahasia dan unik.
2. **Nama Lengkap & Informasi Kelahiran**: Identitas dasar untuk verifikasi layanan.
3. **Alamat Lengkap & Hubungan Keluarga (KK)**: Unit analisis spasial untuk pemetaan kerentanan wilayah.
4. **Nomor Handphone**: Kontak notifikasi dan rujukan.
5. **Data Kesehatan Sensitif**:
   - Status gizi balita (berat badan, tinggi badan, lingkar kepala, status stunting).
   - Riwayat kondisi penyakit/disabilitas.
   - Faktor kerentanan sosial-ekonomi keluarga (DTKS).

---

## 2. Landasan Hukum Pemrosesan (Consent & Legitimasi)

Sesuai Pasal 20 UU PDP, pemrosesan data pribadi oleh LKD Posyandu Lemahduwur didasarkan pada:

1. **Persetujuan Tertulis/Pernyataan Sadar (Consent)**:
   - Disimpan di tabel `consent_pdp`. Setiap warga menyatakan persetujuan secara eksplisit sebelum data diolah.
   - Riwayat pencatatan mencakup tujuan, tanggal persetujuan, metode deklarasi (tertulis/lisan), dan kader saksi.
2. **Kewajiban Hukum (Legal Obligation)**:
   - Pelaksanaan Standar Pelayanan Minimal (SPM) tingkat desa sesuai UU Kesehatan dan Kepmendagri 100.3-2834/2025.

---

## 3. Mekanisme Perlindungan Data Pribadi

Sistem LKD Posyandu 6 SPM Lemahduwur menerapkan pengamanan berlapis untuk mencegah kebocoran data:

| Aspek Pengamanan              | Implementasi Teknis dalam Sistem                                                                                                            |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **Kriptografi & Transit**     | Semua komunikasi data terenkripsi via HTTPS (TLS 1.3). Database Supabase terenkripsi penuh (Encryption-at-Rest).                            |
| **Row Level Security (RLS)**  | Kebijakan RLS membatasi kueri baris. Kader hanya bisa melihat warga di wilayah RW tugasnya. Bidan hanya mengakses data kesehatan medis.     |
| **Penyimpanan Berkas Privat** | Dokumen registrasi & berkas KTP/SK diunggah ke storage privat Supabase. Akses file diproteksi token URL kedaluwarsa 1 jam (Signed URL).     |
| **Anonimitas Rute URL**       | Pencarian data warga di rute URL (`/dashboard/warga/[id]`) menggunakan pengidentifikasi UUID v4, bukan NIK atau informasi pribadi langsung. |
| **Automated Audit Trail**     | Setiap aksi manipulasi data warga (`create`, `update`, `delete`) terekam secara otomatis di database via trigger DB ke tabel `audit_log`.   |

---

## 4. Kebijakan Retensi & Penghapusan Data (Soft-Delete)

Sesuai prinsip UU PDP mengenai hak untuk dihapus (Right to Erasure):

1. **Soft-Delete**:
   - Penghapusan data warga tidak menghapus record secara permanen seketika, melainkan memperbarui kolom `dihapus_pada` pada tabel `warga`.
   - Data warga yang telah dihapus disembunyikan otomatis dari seluruh antarmuka operasional (layanan SPM, pemeriksaan kesehatan, peta visual).
2. **Prosedur Hard-Delete (Pembersihan Permanen)**:
   - Pembersihan permanen (hard-delete) data warga dari database fisik dan cadangan dilakukan secara terpusat oleh Admin Sistem atas instruksi resmi Desa Lemahduwur.
   - Tindakan penghapusan permanen dicatat di tabel `audit_log` sebagai bentuk akuntabilitas.

---

## 5. Kesimpulan & Penilaian Risiko

- **Dampak Kebocoran**: Sedang hingga Tinggi (karena memuat NIK dan data pertumbuhan anak/kesehatan).
- **Mitigasi**: RLS ketat, audit log otomatis, tokenisasi URL storage, dan management consent sadar membuat risiko pemrosesan data pribadi turun ke tingkat **Rendah (Low)**.
- **Pernyataan Kepatuhan**: Sistem LKD Posyandu 6 SPM Desa Lemahduwur dinilai **telah memenuhi standar UU PDP No. 27/2022**.
