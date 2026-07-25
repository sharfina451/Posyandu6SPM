-- =====================================================================
--  6SPM — Skema Basis Data
--  Sistem Informasi Tata Kelola LKD Posyandu 6 SPM Terintegrasi
--  Target: PostgreSQL 15+  dengan ekstensi PostGIS 3+
--  Acuan  : PRD_Posyandu_6SPM_FINAL.md (Bagian 8 & 12)
--  Konvensi: nama tabel/kolom Bahasa Indonesia (mengikuti PRD),
--            PK UUID (menghindari enumerasi id di URL — NFR-05),
--            timestamptz, soft-delete pada data warga (UU PDP).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS postgis;    -- kolom geometry (heatmap RW 01-08)

-- ---------------------------------------------------------------------
-- 1. TIPE ENUM
-- ---------------------------------------------------------------------
CREATE TYPE peran_kode        AS ENUM ('kader','bidan','pemdes','opd','pengurus','admin');
CREATE TYPE bidang_spm        AS ENUM ('pendidikan','kesehatan','pekerjaan_umum',
                                       'perumahan_rakyat','trantibumlinmas','sosial');
CREATE TYPE jenis_kelamin     AS ENUM ('L','P');
CREATE TYPE level_wilayah     AS ENUM ('rw','rt');
CREATE TYPE jenis_kunjungan   AS ENUM ('hari_buka','kunjungan_rumah');
-- Alur baku panduan Kab. Tegal: didata -> verifikasi & kunjungan ->
-- diajukan ke Pemdes -> disposisi/tindak lanjut OPD -> selesai (atau ditolak).
CREATE TYPE status_tiket      AS ENUM ('didata','verifikasi_kunjungan','diajukan_pemdes',
                                       'disposisi_opd','selesai','ditolak');
CREATE TYPE prioritas_tiket   AS ENUM ('rendah','sedang','tinggi','darurat');
CREATE TYPE klasifikasi_risiko AS ENUM ('aman','waspada','bahaya','kritis');
CREATE TYPE status_registrasi AS ENUM ('draf','diajukan','terdaftar','dikembalikan');
CREATE TYPE aksi_audit        AS ENUM ('create','update','delete','export','login','sync');

-- ---------------------------------------------------------------------
-- 2. FUNGSI BANTU (trigger updated_at)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_diperbarui_pada() RETURNS trigger AS $$
BEGIN
  NEW.diperbarui_pada := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
--  REFERENSI & KELEMBAGAAN
-- =====================================================================

-- 3. Peran (RBAC) --------------------------------------------------------
CREATE TABLE peran (
  id         smallint    PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  kode       peran_kode  UNIQUE NOT NULL,
  nama       text        NOT NULL,
  deskripsi  text
);

-- 4. Posyandu (LKD) + registrasi kelembagaan (Kepmendagri 100.3-2834/2025)
CREATE TABLE posyandu (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nama               text        NOT NULL,
  nomor_registrasi   varchar(20) UNIQUE,               -- contoh: 11.01.10.2001.001
  status_registrasi  status_registrasi NOT NULL DEFAULT 'draf',
  desa               text        NOT NULL DEFAULT 'Lemahduwur',
  kecamatan          text        NOT NULL DEFAULT 'Adiwerna',
  kabupaten          text        NOT NULL DEFAULT 'Tegal',
  no_sk_pengurus     text,
  tanggal_terdaftar  date,
  dibuat_pada        timestamptz NOT NULL DEFAULT now(),
  diperbarui_pada    timestamptz NOT NULL DEFAULT now()
);

-- 5. Wilayah (RW/RT, self-reference) + batas area utk pemetaan ----------
CREATE TABLE wilayah (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  posyandu_id  uuid          REFERENCES posyandu(id),
  level        level_wilayah NOT NULL,
  kode         varchar(10)   NOT NULL,                 -- '01'..'08' untuk RW
  nama         text,
  parent_id    uuid          REFERENCES wilayah(id),   -- RT menunjuk ke RW induk
  geom         geometry(MultiPolygon, 4326),           -- batas wilayah (heatmap)
  UNIQUE (posyandu_id, level, kode, parent_id)
);

-- 6. Pengguna sistem ----------------------------------------------------
CREATE TABLE pengguna (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nama             text        NOT NULL,
  username         text        UNIQUE NOT NULL,
  no_hp            varchar(20),
  kata_sandi_hash  text        NOT NULL,               -- hash (bcrypt/argon2), tidak plaintext
  peran_id         smallint    NOT NULL REFERENCES peran(id),
  wilayah_id       uuid        REFERENCES wilayah(id), -- cakupan RW (scope kader)
  posyandu_id      uuid        REFERENCES posyandu(id),
  aktif            boolean     NOT NULL DEFAULT true,
  login_terakhir   timestamptz,
  dibuat_pada      timestamptz NOT NULL DEFAULT now(),
  diperbarui_pada  timestamptz NOT NULL DEFAULT now()
);

-- 7. Kepengurusan Posyandu (Permendagri 13/2024: Ketua/Sekretaris/Bendahara/6 Ketua Bidang)
CREATE TABLE pengurus_posyandu (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posyandu_id    uuid NOT NULL REFERENCES posyandu(id),
  pengguna_id    uuid REFERENCES pengguna(id),
  nama           text NOT NULL,
  jabatan        text NOT NULL,          -- 'Ketua','Sekretaris','Bendahara','Ketua Bidang',...
  bidang         bidang_spm,             -- diisi bila 'Ketua Bidang'
  no_sk          text,
  mulai_menjabat date
);

-- =====================================================================
--  WARGA & RUMAH TANGGA
-- =====================================================================

-- 8. Rumah tangga (unit agregasi utk skor kerentanan FR-14) -------------
CREATE TABLE rumah_tangga (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  no_kk            char(16)    UNIQUE,
  alamat           text,
  wilayah_rt_id    uuid        REFERENCES wilayah(id),
  titik            geometry(Point, 4326),              -- lokasi rumah utk pemetaan
  dekat_industri   boolean     DEFAULT false,          -- kawasan Rumah Produktif logam/konveksi
  kondisi_rumah    text,                               -- ringkas (RTLH/layak)
  status_ekonomi   text,                               -- mis. desil DTKS
  dibuat_pada      timestamptz NOT NULL DEFAULT now(),
  diperbarui_pada  timestamptz NOT NULL DEFAULT now()
);

-- 9. Warga (Single Identity Index berbasis NIK — FR-01) -----------------
CREATE TABLE warga (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nik               char(16)    UNIQUE NOT NULL CHECK (nik ~ '^[0-9]{16}$'),
  nama              text        NOT NULL,
  jenis_kelamin     jenis_kelamin,
  tanggal_lahir     date,
  rumah_tangga_id   uuid        REFERENCES rumah_tangga(id),
  hubungan_keluarga text,                              -- kepala keluarga/istri/anak/...
  no_hp             varchar(20),
  disabilitas       boolean     DEFAULT false,
  keterangan        text,
  nik_terverifikasi boolean     DEFAULT false,         -- verifikasi manual hingga akses Dukcapil
  dibuat_pada       timestamptz NOT NULL DEFAULT now(),
  diperbarui_pada   timestamptz NOT NULL DEFAULT now(),
  dihapus_pada      timestamptz                        -- soft-delete (UU PDP)
);

-- 10. Persetujuan pemrosesan data (UU PDP — FR-21) ----------------------
CREATE TABLE consent_pdp (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  warga_id      uuid        NOT NULL REFERENCES warga(id),
  tujuan        text        NOT NULL,                  -- dasar/tujuan pemrosesan
  disetujui     boolean     NOT NULL,
  metode        text,                                  -- lisan/tanda tangan/dll
  tanggal       timestamptz NOT NULL DEFAULT now(),
  dicatat_oleh  uuid        REFERENCES pengguna(id)
);

-- =====================================================================
--  LAYANAN 6 SPM
-- =====================================================================

-- 11. Kunjungan / event layanan (Hari Buka atau door-to-door) -----------
CREATE TABLE kunjungan (
  id           uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  jenis        jenis_kunjungan NOT NULL,
  tanggal      date            NOT NULL,
  wilayah_id   uuid            REFERENCES wilayah(id),
  kader_id     uuid            REFERENCES pengguna(id),
  catatan      text,
  dibuat_pada  timestamptz     NOT NULL DEFAULT now()
);

-- 12. Register layanan 6 SPM (base; field dinamis non-kesehatan di JSONB)
CREATE TABLE layanan_spm (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  warga_id        uuid        NOT NULL REFERENCES warga(id),
  bidang          bidang_spm  NOT NULL,
  kunjungan_id    uuid        REFERENCES kunjungan(id),
  tanggal         date        NOT NULL DEFAULT current_date,
  jenis_layanan   text,                                -- 'imunisasi','penimbangan','pendataan',...
  catatan         text,
  detail          jsonb,                               -- field dinamis per bidang
  kader_id        uuid        REFERENCES pengguna(id),
  dibuat_pada     timestamptz NOT NULL DEFAULT now(),
  diperbarui_pada timestamptz NOT NULL DEFAULT now()
);

-- 13. Pemeriksaan kesehatan / ILP (antropometri, KMS, skrining K3) ------
CREATE TABLE pemeriksaan_kesehatan (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  layanan_spm_id    uuid        REFERENCES layanan_spm(id) ON DELETE CASCADE,
  warga_id          uuid        NOT NULL REFERENCES warga(id),
  tanggal           date        NOT NULL DEFAULT current_date,
  berat_kg          numeric(5,2),
  tinggi_cm         numeric(5,2),
  lingkar_kepala_cm numeric(5,2),
  lila_cm           numeric(5,2),
  tekanan_sistolik  smallint,
  tekanan_diastolik smallint,
  gula_darah        smallint,
  status_gizi       text,                              -- hasil KMS: normal/kurang/stunting/...
  keluhan_ispa      boolean     DEFAULT false,         -- skrining K3 kawasan produktif
  paparan_polutan   boolean     DEFAULT false,         -- debu logam/konveksi
  catatan           text,
  dibuat_pada       timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
--  ALUR KERJA (WORKFLOW / "BPM") + SLA 5 HARI KERJA
-- =====================================================================

-- 14. Tiket permohonan/rujukan (satu tiket = satu permohonan) -----------
CREATE TABLE tiket (
  id                uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_tiket       text           UNIQUE NOT NULL,    -- SPM-PERUMAHAN-202607-0012
  warga_id          uuid           REFERENCES warga(id),
  rumah_tangga_id   uuid           REFERENCES rumah_tangga(id),
  layanan_spm_id    uuid           REFERENCES layanan_spm(id),
  bidang            bidang_spm     NOT NULL,
  jenis_permohonan  text           NOT NULL,           -- 'RTLH','Bansos','pengaduan',...
  deskripsi         text,
  status            status_tiket   NOT NULL DEFAULT 'didata',
  prioritas         prioritas_tiket NOT NULL DEFAULT 'sedang',
  rahasia           boolean        NOT NULL DEFAULT false,  -- pengaduan Trantibumlinmas tertutup
  tanggal_terbit    timestamptz    NOT NULL DEFAULT now(),
  tenggat_sla       date,                              -- 5 hari kerja sejak terbit (dihitung aplikasi)
  tanggal_selesai   timestamptz,
  kader_id          uuid           REFERENCES pengguna(id),
  verifikator_id    uuid           REFERENCES pengguna(id),  -- bidan/pemdes
  pemdes_id         uuid           REFERENCES pengguna(id),
  opd_tujuan        text,
  dibuat_pada       timestamptz    NOT NULL DEFAULT now(),
  diperbarui_pada   timestamptz    NOT NULL DEFAULT now()
);

-- 15. Riwayat perpindahan status tiket (jejak SLA & eskalasi FR-10) ------
CREATE TABLE tiket_riwayat_status (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  tiket_id    uuid         NOT NULL REFERENCES tiket(id) ON DELETE CASCADE,
  status_dari status_tiket,
  status_ke   status_tiket NOT NULL,
  catatan     text,
  oleh_id     uuid         REFERENCES pengguna(id),
  pada        timestamptz  NOT NULL DEFAULT now()
);

-- 16. Dokumen persyaratan (unggah berkas per bidang — lihat PRD Bagian 6)
CREATE TABLE dokumen_persyaratan (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tiket_id       uuid        REFERENCES tiket(id) ON DELETE CASCADE,
  warga_id       uuid        REFERENCES warga(id),
  jenis          text        NOT NULL,                 -- 'KTP','KK','SuratTidakMampu','FotoRumah3Sisi',...
  url_berkas     text        NOT NULL,
  keterangan     text,
  diunggah_oleh  uuid        REFERENCES pengguna(id),
  diunggah_pada  timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
--  PENILAIAN KERENTANAN (rule-based transparan — FR-14/FR-15)
-- =====================================================================

-- 17. Konfigurasi variabel & bobot (w_j) --------------------------------
CREATE TABLE variabel_kerentanan (
  id     smallint     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  kode   text         UNIQUE NOT NULL,                 -- 'lansia_tunggal','dekat_peleburan',...
  nama   text         NOT NULL,
  bobot  numeric(5,3) NOT NULL,
  aktif  boolean      NOT NULL DEFAULT true,
  versi  text
);

-- 18. Skor kerentanan per rumah tangga ----------------------------------
CREATE TABLE skor_kerentanan (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  rumah_tangga_id   uuid        NOT NULL REFERENCES rumah_tangga(id) ON DELETE CASCADE,
  total_skor        numeric(6,3) NOT NULL,
  persen            numeric(5,2) NOT NULL CHECK (persen BETWEEN 0 AND 100),
  klasifikasi       klasifikasi_risiko NOT NULL,       -- aman/waspada/bahaya/kritis
  model_versi       text        NOT NULL DEFAULT 'rule-based-v1',
  potensi_eksklusi  boolean     NOT NULL DEFAULT false, -- rentan tinggi & belum terima bansos
  dihitung_pada     timestamptz NOT NULL DEFAULT now()
);

-- 19. Rincian faktor pembentuk skor (transparansi "alasan" — FR-14) -----
CREATE TABLE skor_kerentanan_detail (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  skor_id       uuid         NOT NULL REFERENCES skor_kerentanan(id) ON DELETE CASCADE,
  variabel_id   smallint     NOT NULL REFERENCES variabel_kerentanan(id),
  nilai_kondisi numeric(6,3) NOT NULL,                 -- x_ij
  kontribusi    numeric(6,3) NOT NULL                  -- w_j * x_ij
);

-- =====================================================================
--  PELAPORAN, REGISTRASI, AUDIT, KALENDER
-- =====================================================================

-- 20. Laporan bulanan (ekspor PDF/Excel — FR-17) ------------------------
CREATE TABLE laporan_bulanan (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  posyandu_id  uuid        NOT NULL REFERENCES posyandu(id),
  periode      date        NOT NULL,                   -- tanggal 1 tiap bulan
  bidang       bidang_spm,                             -- NULL = gabungan 6 SPM
  ringkasan    jsonb,
  url_pdf      text,
  url_excel    text,
  dibuat_oleh  uuid        REFERENCES pengguna(id),
  dibuat_pada  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (posyandu_id, periode, bidang)
);

-- 21. Berkas registrasi kelembagaan (SK TP, SK Pengurus, Matriks) -------
CREATE TABLE dokumen_registrasi (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  posyandu_id   uuid        NOT NULL REFERENCES posyandu(id),
  jenis         text        NOT NULL,                  -- 'SK_TP_Posyandu','SK_Pengurus','Matriks_Rekap'
  url_berkas    text,
  status        status_registrasi NOT NULL DEFAULT 'draf',
  keterangan    text,
  diunggah_pada timestamptz NOT NULL DEFAULT now()
);

-- 22. Audit trail (NFR-04 / FR-20) --------------------------------------
CREATE TABLE audit_log (
  id           bigint      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  pengguna_id  uuid        REFERENCES pengguna(id),
  aksi         aksi_audit  NOT NULL,
  tabel        text,
  record_id    text,
  data_lama    jsonb,
  data_baru    jsonb,
  ip           inet,
  pada         timestamptz NOT NULL DEFAULT now()
);

-- 23. Kalender hari libur (utk hitung SLA 5 HARI KERJA yang akurat) ------
CREATE TABLE hari_libur (
  tanggal    date PRIMARY KEY,
  keterangan text
);

-- ---------------------------------------------------------------------
--  INDEKS
-- ---------------------------------------------------------------------
CREATE INDEX idx_warga_rt          ON warga(rumah_tangga_id);
CREATE INDEX idx_warga_nama        ON warga(nama);
CREATE INDEX idx_layanan_warga     ON layanan_spm(warga_id);
CREATE INDEX idx_layanan_bidang    ON layanan_spm(bidang);
CREATE INDEX idx_layanan_kunjungan ON layanan_spm(kunjungan_id);
CREATE INDEX idx_periksa_warga     ON pemeriksaan_kesehatan(warga_id);
CREATE INDEX idx_tiket_status      ON tiket(status);
CREATE INDEX idx_tiket_bidang      ON tiket(bidang);
CREATE INDEX idx_tiket_tenggat     ON tiket(tenggat_sla) WHERE status NOT IN ('selesai','ditolak');
CREATE INDEX idx_tiket_warga       ON tiket(warga_id);
CREATE INDEX idx_riwayat_tiket     ON tiket_riwayat_status(tiket_id);
CREATE INDEX idx_skor_rt           ON skor_kerentanan(rumah_tangga_id);
CREATE INDEX idx_skor_kelas        ON skor_kerentanan(klasifikasi);
CREATE INDEX idx_skor_eksklusi     ON skor_kerentanan(potensi_eksklusi) WHERE potensi_eksklusi;
CREATE INDEX idx_audit_pengguna    ON audit_log(pengguna_id);
CREATE INDEX idx_audit_pada        ON audit_log(pada);
CREATE INDEX idx_rt_titik          ON rumah_tangga USING GIST(titik);
CREATE INDEX idx_wilayah_geom      ON wilayah USING GIST(geom);

-- ---------------------------------------------------------------------
--  TRIGGER updated_at
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_posyandu     BEFORE UPDATE ON posyandu     FOR EACH ROW EXECUTE FUNCTION set_diperbarui_pada();
CREATE TRIGGER trg_pengguna     BEFORE UPDATE ON pengguna     FOR EACH ROW EXECUTE FUNCTION set_diperbarui_pada();
CREATE TRIGGER trg_rumah_tangga BEFORE UPDATE ON rumah_tangga FOR EACH ROW EXECUTE FUNCTION set_diperbarui_pada();
CREATE TRIGGER trg_warga        BEFORE UPDATE ON warga        FOR EACH ROW EXECUTE FUNCTION set_diperbarui_pada();
CREATE TRIGGER trg_layanan      BEFORE UPDATE ON layanan_spm  FOR EACH ROW EXECUTE FUNCTION set_diperbarui_pada();
CREATE TRIGGER trg_tiket        BEFORE UPDATE ON tiket        FOR EACH ROW EXECUTE FUNCTION set_diperbarui_pada();

-- ---------------------------------------------------------------------
--  VIEW BANTU
-- ---------------------------------------------------------------------
-- Pemantauan SLA & kebutuhan eskalasi (FR-09/FR-10).
CREATE VIEW v_tiket_sla AS
SELECT
  t.*,
  (t.status NOT IN ('selesai','ditolak') AND t.tenggat_sla < current_date) AS lewat_sla,
  (t.status NOT IN ('selesai','ditolak')
     AND COALESCE(
           (SELECT max(r.pada) FROM tiket_riwayat_status r WHERE r.tiket_id = t.id),
           t.tanggal_terbit
         ) < now() - interval '3 days'
  ) AS perlu_eskalasi
FROM tiket t;

-- Daftar potensi exclusion error: skor terbaru per rumah tangga (FR-15).
CREATE VIEW v_potensi_exclusion AS
SELECT DISTINCT ON (rt.id)
  rt.id AS rumah_tangga_id, rt.no_kk, rt.alamat,
  s.persen, s.klasifikasi, s.dihitung_pada
FROM rumah_tangga rt
JOIN skor_kerentanan s ON s.rumah_tangga_id = rt.id
WHERE s.potensi_eksklusi
ORDER BY rt.id, s.dihitung_pada DESC;

-- ---------------------------------------------------------------------
--  SEED MINIMAL
-- ---------------------------------------------------------------------
INSERT INTO peran (kode, nama) VALUES
  ('kader','Kader Posyandu'),
  ('bidan','Bidan Desa / Nakes (Pustu)'),
  ('pemdes','Pemerintah Desa (Kades/Sekdes)'),
  ('opd','OPD / Kecamatan (Auditor)'),
  ('pengurus','Pengurus Posyandu'),
  ('admin','Admin Sistem');

INSERT INTO variabel_kerentanan (kode, nama, bobot, versi) VALUES
  ('lansia_tunggal','Lansia tinggal sendiri', 0.25, 'v1'),
  ('dekat_peleburan','Rumah dekat area peleburan/industri logam', 0.20, 'v1'),
  ('ventilasi_buruk','Ventilasi/hunian buruk (padat)', 0.15, 'v1'),
  ('balita_stunting','Balita rawan stunting', 0.20, 'v1'),
  ('ekonomi_rendah','Kondisi ekonomi rendah / belum terima bansos', 0.20, 'v1');
-- Catatan: bobot bersifat ilustratif; wajib ditetapkan bersama Pemdes/Puskesmas
-- (lihat PRD Bagian 15 — Pertanyaan Terbuka).
