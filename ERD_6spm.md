# ERD — Basis Data 6SPM (Posyandu 6 SPM Terintegrasi)

Diagram Entity-Relationship untuk skema pada [`schema_6spm.sql`](schema_6spm.sql), diturunkan dari **PRD_Posyandu_6SPM_FINAL.md** (Bagian 8 & 12). Target: **PostgreSQL 15+ / PostGIS 3+**.

> Diagram Mermaid di bawah tampil otomatis di GitHub, VS Code (ekstensi Mermaid), dan Obsidian. Notasi: `PK` = primary key, `FK` = foreign key.

## 1. Diagram ER

```mermaid
erDiagram
    POSYANDU              ||--o{ WILAYAH                : "punya"
    POSYANDU              ||--o{ PENGURUS_POSYANDU      : "dikelola"
    POSYANDU              ||--o{ LAPORAN_BULANAN        : "melaporkan"
    POSYANDU              ||--o{ DOKUMEN_REGISTRASI     : "registrasi"
    WILAYAH               ||--o{ WILAYAH                : "RT dalam RW"
    PERAN                 ||--o{ PENGGUNA               : "menetapkan"
    WILAYAH               |o--o{ PENGGUNA               : "cakupan"
    PENGGUNA              ||--o{ PENGURUS_POSYANDU      : "akun"

    WILAYAH               ||--o{ RUMAH_TANGGA           : "berlokasi"
    RUMAH_TANGGA          ||--o{ WARGA                  : "beranggotakan"
    WARGA                 ||--o{ CONSENT_PDP            : "persetujuan"

    WARGA                 ||--o{ LAYANAN_SPM            : "menerima"
    KUNJUNGAN             ||--o{ LAYANAN_SPM            : "mencakup"
    PENGGUNA              ||--o{ KUNJUNGAN              : "kader"
    LAYANAN_SPM           ||--o| PEMERIKSAAN_KESEHATAN  : "detail ILP"

    WARGA                 ||--o{ TIKET                  : "mengajukan"
    RUMAH_TANGGA          ||--o{ TIKET                  : "terkait"
    LAYANAN_SPM           ||--o| TIKET                  : "memicu"
    TIKET                 ||--o{ TIKET_RIWAYAT_STATUS   : "riwayat"
    TIKET                 ||--o{ DOKUMEN_PERSYARATAN    : "lampiran"
    PENGGUNA              ||--o{ TIKET                  : "menangani"

    RUMAH_TANGGA          ||--o{ SKOR_KERENTANAN        : "dinilai"
    SKOR_KERENTANAN       ||--o{ SKOR_KERENTANAN_DETAIL : "faktor"
    VARIABEL_KERENTANAN   ||--o{ SKOR_KERENTANAN_DETAIL : "bobot"

    PENGGUNA              ||--o{ AUDIT_LOG              : "mencatat"

    POSYANDU {
        uuid id PK
        text nama
        varchar nomor_registrasi "11.01.10.2001.001"
        enum status_registrasi
    }
    WILAYAH {
        uuid id PK
        uuid posyandu_id FK
        enum level "rw|rt"
        varchar kode "01..08"
        uuid parent_id FK
        geometry geom
    }
    PERAN {
        smallint id PK
        enum kode "kader|bidan|pemdes|opd|pengurus|admin"
        text nama
    }
    PENGGUNA {
        uuid id PK
        text username
        text kata_sandi_hash
        smallint peran_id FK
        uuid wilayah_id FK
        boolean aktif
    }
    PENGURUS_POSYANDU {
        uuid id PK
        uuid posyandu_id FK
        uuid pengguna_id FK
        text jabatan
        enum bidang
    }
    RUMAH_TANGGA {
        uuid id PK
        char no_kk
        uuid wilayah_rt_id FK
        geometry titik
        boolean dekat_industri
        text status_ekonomi
    }
    WARGA {
        uuid id PK
        char nik "UNIK, 16 digit"
        text nama
        enum jenis_kelamin
        date tanggal_lahir
        uuid rumah_tangga_id FK
        boolean disabilitas
        boolean nik_terverifikasi
        timestamptz dihapus_pada "soft-delete PDP"
    }
    CONSENT_PDP {
        uuid id PK
        uuid warga_id FK
        text tujuan
        boolean disetujui
    }
    KUNJUNGAN {
        uuid id PK
        enum jenis "hari_buka|kunjungan_rumah"
        date tanggal
        uuid wilayah_id FK
        uuid kader_id FK
    }
    LAYANAN_SPM {
        uuid id PK
        uuid warga_id FK
        enum bidang "6 SPM"
        uuid kunjungan_id FK
        text jenis_layanan
        jsonb detail
        uuid kader_id FK
    }
    PEMERIKSAAN_KESEHATAN {
        uuid id PK
        uuid layanan_spm_id FK
        uuid warga_id FK
        numeric berat_kg
        numeric tinggi_cm
        numeric lingkar_kepala_cm
        text status_gizi
        boolean keluhan_ispa
        boolean paparan_polutan
    }
    TIKET {
        uuid id PK
        text nomor_tiket "SPM-PERUMAHAN-202607-0012"
        uuid warga_id FK
        uuid layanan_spm_id FK
        enum bidang
        text jenis_permohonan
        enum status
        enum prioritas
        boolean rahasia
        date tenggat_sla "5 hari kerja"
        timestamptz tanggal_selesai
    }
    TIKET_RIWAYAT_STATUS {
        uuid id PK
        uuid tiket_id FK
        enum status_dari
        enum status_ke
        uuid oleh_id FK
        timestamptz pada
    }
    DOKUMEN_PERSYARATAN {
        uuid id PK
        uuid tiket_id FK
        text jenis "KTP|KK|FotoRumah3Sisi|..."
        text url_berkas
    }
    VARIABEL_KERENTANAN {
        smallint id PK
        text kode
        numeric bobot "w_j"
        boolean aktif
    }
    SKOR_KERENTANAN {
        uuid id PK
        uuid rumah_tangga_id FK
        numeric persen "0..100"
        enum klasifikasi "aman|waspada|bahaya|kritis"
        boolean potensi_eksklusi
        text model_versi
    }
    SKOR_KERENTANAN_DETAIL {
        uuid id PK
        uuid skor_id FK
        smallint variabel_id FK
        numeric nilai_kondisi "x_ij"
        numeric kontribusi "w_j*x_ij"
    }
    LAPORAN_BULANAN {
        uuid id PK
        uuid posyandu_id FK
        date periode
        enum bidang
        text url_pdf
        text url_excel
    }
    DOKUMEN_REGISTRASI {
        uuid id PK
        uuid posyandu_id FK
        text jenis
        enum status
    }
    AUDIT_LOG {
        bigint id PK
        uuid pengguna_id FK
        enum aksi
        text tabel
        jsonb data_lama
        jsonb data_baru
    }
```

## 2. Kamus Entitas (ringkas)

| #   | Entitas                  | Peran dalam sistem                         | Requirement PRD  |
| :-- | :----------------------- | :----------------------------------------- | :--------------- |
| 1   | `peran`                  | Master 6 peran RBAC                        | Bagian 5         |
| 2   | `posyandu`               | LKD + nomor registrasi kelembagaan         | FR-16            |
| 3   | `wilayah`                | Hierarki RW→RT + batas area (PostGIS)      | FR-13            |
| 4   | `pengguna`               | Akun & scope wilayah                       | Bagian 5, NFR-03 |
| 5   | `pengurus_posyandu`      | Ketua/Sekretaris/Bendahara/6 Ketua Bidang  | Bagian 5         |
| 6   | `rumah_tangga`           | Unit agregasi skor kerentanan + titik peta | FR-13/14         |
| 7   | `warga`                  | Single Identity Index (NIK)                | FR-01            |
| 8   | `consent_pdp`            | Persetujuan pemrosesan data                | FR-21, UU PDP    |
| 9   | `kunjungan`              | Event Hari Buka / door-to-door             | Bagian 6         |
| 10  | `layanan_spm`            | Register 6 SPM (base + JSONB dinamis)      | FR-04            |
| 11  | `pemeriksaan_kesehatan`  | Antropometri, KMS, skrining K3/PTM         | FR-05            |
| 12  | `tiket`                  | Permohonan + status alur + SLA             | FR-07/08/09      |
| 13  | `tiket_riwayat_status`   | Jejak transisi utk SLA & eskalasi          | FR-10            |
| 14  | `dokumen_persyaratan`    | Unggah berkas per bidang                   | Bagian 6         |
| 15  | `variabel_kerentanan`    | Bobot model rule-based (transparan)        | FR-14            |
| 16  | `skor_kerentanan`        | Skor & klasifikasi per rumah tangga        | FR-14            |
| 17  | `skor_kerentanan_detail` | Faktor pembentuk ("alasan")                | FR-14            |
| 18  | `laporan_bulanan`        | Ekspor PDF/Excel format baku               | FR-17            |
| 19  | `dokumen_registrasi`     | Berkas SK & matriks registrasi             | FR-16            |
| 20  | `audit_log`              | Jejak audit create/update/delete/export    | FR-20            |
| 21  | `hari_libur`             | Kalender utk hitung "5 hari kerja" akurat  | FR-09            |

## 3. Keputusan Desain Penting

1. **Register vs Workflow dipisah.** `layanan_spm` mencatat _semua_ layanan (termasuk Kesehatan/ILP yang tidak selalu bertiket); `tiket` hanya dibuat untuk permohonan/rujukan yang butuh alur & SLA. Satu `layanan_spm` dapat memicu paling banyak satu `tiket`.
2. **Field dinamis via JSONB.** Bidang non-kesehatan (Pendidikan, PU, Perumahan, Trantibumlinmas, Sosial) sangat bervariasi → disimpan di `layanan_spm.detail` (JSONB) agar formulir dinamis tanpa migrasi tabel. Data kesehatan yang terstruktur & sering diquery (antropometri) dipisah ke tabel sendiri untuk grafik KMS & agregasi.
3. **SLA "5 hari kerja".** `tenggat_sla` disimpan sebagai `date` yang dihitung aplikasi memakai `hari_libur` (PostgreSQL murni sulit menghitung hari kerja). `v_tiket_sla` menandai `lewat_sla` & `perlu_eskalasi` (>3 hari tanpa perubahan status).
4. **Transparansi penilaian risiko.** Model rilis awal _rule-based_; `skor_kerentanan_detail` menyimpan `x_ij` dan kontribusi `w_j·x_ij` per variabel → skor bisa diaudit (bukan kotak hitam), sesuai FR-14. `potensi_eksklusi` = _rekomendasi tinjau_, bukan keputusan otomatis (FR-15).
5. **Kepatuhan UU PDP.** PK UUID (tak mudah dienumerasi di URL — NFR-05), soft-delete pada `warga` (`dihapus_pada`), `consent_pdp`, dan `audit_log` menyeluruh; `kata_sandi_hash` (bukan plaintext).
6. **Pemetaan spasial.** PostGIS: `rumah_tangga.titik` (Point) untuk heatmap, `wilayah.geom` (MultiPolygon) untuk batas RW/RT; indeks GIST.

## 4. Catatan / Perlu Validasi

- **Bobot `variabel_kerentanan`** pada seed bersifat ilustratif — wajib ditetapkan bersama Pemdes/Puskesmas.
- **Verifikasi NIK** (`nik_terverifikasi`) manual hingga jalur resmi Dukcapil tersedia (PRD Non-Goal NG4).
- **Multi-tenant.** Skema mengakomodasi banyak `posyandu` (siap replikasi ke 18 desa pilot), namun rilis awal fokus 1 lokus (Lemahduwur).
- Format `nomor_tiket` & pemetaan `opd_tujuan` per bidang perlu difinalkan pada Fase 0 Discovery.
