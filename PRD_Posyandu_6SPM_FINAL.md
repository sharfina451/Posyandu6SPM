# DOKUMEN SPESIFIKASI KEBUTUHAN PRODUK (PRD)

## Sistem Informasi Tata Kelola Posyandu 6 SPM Terintegrasi (aplikasi "6SPM")

|                        |                                                                             |
| :--------------------- | :-------------------------------------------------------------------------- |
| **Nama Produk**        | 6SPM — Sistem Informasi Tata Kelola LKD Posyandu 6 SPM                      |
| **Versi Dokumen**      | 2.0.0 (konsolidasi & koreksi dari draf 1.0.0)                               |
| **Tanggal**            | 22 Juli 2026                                                                |
| **Status**             | Draf — Siap Review                                                          |
| **Lokus Implementasi** | Desa Lemahduwur, Kec. Adiwerna, Kab. Tegal (1 dari 18 desa _pilot project_) |
| **Product Owner**      | Tim Pengusul PKM Universitas Harkat Negeri & Pemerintah Desa Lemahduwur     |

> **Catatan penyusunan.** Dokumen ini mengonsolidasikan dua draf sebelumnya (`gabung.md` dan `prd_posyandu_6spm_rev.md`) dan **mengoreksinya agar konsisten dengan materi resmi**: paparan "Pelayanan Posyandu 6 SPM di Kab. Tegal (30.04.26)", "Materi Posyandu Dispermades Tegal (27 Nov 2025)", dan "Materi Posyandu Sekum Posyandu (19 Mei 2025)". Bagian yang tidak dapat diverifikasi dari materi resmi ditandai **[ASUMSI — perlu validasi]**.

---

## 1. Ringkasan Eksekutif

Melalui **Permendagri No. 13 Tahun 2024 tentang Pos Pelayanan Terpadu**, Posyandu bertransformasi dari Unit Kesehatan Berbasis Masyarakat (UKBM) menjadi **Lembaga Kemasyarakatan Desa (LKD)** yang menjalankan tugas Pemerintah Desa dalam **6 Standar Pelayanan Minimal (6 SPM)**: Pendidikan, Kesehatan, Pekerjaan Umum, Perumahan Rakyat, Ketentraman/Ketertiban Umum & Perlindungan Masyarakat (Trantibumlinmas), dan Sosial.

Perluasan mandat ini menambah beban administrasi kader secara drastis: setiap keluhan/permohonan warga di 6 bidang harus didata, diverifikasi bersama Pemerintah Desa melalui kunjungan lapangan, diajukan ke Pemdes, lalu diteruskan ke OPD/Kecamatan — **dengan batas waktu pelayanan 5 hari kerja** per permohonan. Pencatatan manual berbasis buku register menyulitkan pelacakan tenggat, rekapitulasi bulanan, dan validasi ketepatan sasaran bantuan sosial.

**6SPM** adalah platform Web & Mobile (PWA) yang: (1) mendigitalkan register 6 SPM berbasis NIK; (2) mengotomatiskan alur permohonan/rujukan sebagai tiket kerja ber-SLA (_workflow engine_); dan (3) menyajikan dasbor pemantauan serta pemetaan prioritas kunjungan rumah bagi kelompok rentan.

---

## 2. Dasar Hukum & Acuan

Diselaraskan dengan materi resmi (Dispermades Kab. Tegal & TP Posyandu Pusat):

1. **UU No. 6 Tahun 2014 tentang Desa**, sebagaimana diubah terakhir dengan **UU No. 3 Tahun 2024** (Perubahan Ketiga; ditetapkan 25 April 2024).
2. **PP No. 43 Tahun 2014** tentang Peraturan Pelaksanaan UU Desa, sebagaimana diubah dengan **PP No. 47 Tahun 2015** dan terakhir **PP No. 11 Tahun 2019**.
3. **Permendagri No. 18 Tahun 2018** tentang Lembaga Kemasyarakatan Desa (LKD) dan Lembaga Adat Desa (LAD).
4. **Permendagri No. 13 Tahun 2024** tentang Pos Pelayanan Terpadu (dasar utama 6 SPM; mencabut Permendagri No. 54/2007 tentang Pokjanal Posyandu).
5. **Kepmendagri No. 100.3-2834 Tahun 2025** tentang Tata Cara Pemberian Nomor Registrasi Posyandu.
6. Panduan operasional **Pelayanan Posyandu 6 SPM Kabupaten Tegal**.
7. **UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)** — sebagai acuan kepatuhan pengolahan data warga.

---

## 3. Latar Belakang & Konteks Lokus

Desa Lemahduwur (Kec. Adiwerna) adalah **desa nomor 8** dari 18 desa _pilot project_ Posyandu 6 SPM di Kabupaten Tegal (satu desa per kecamatan). Karakter permukiman padat dengan dominasi "Rumah Produktif" industri rumahan (konveksi & pengecoran/peleburan logam) yang beroperasi _shift_, memunculkan risiko kesehatan kerja (keluhan ISPA, paparan debu/polutan logam) yang beririsan dengan mandat SPM Kesehatan (K3), Perumahan Rakyat, dan Sosial.

**Data lokus berikut [ASUMSI — perlu validasi dari Profil Desa/Prodeskel]**, karena tidak terdapat dalam materi resmi yang tersedia:

- Luas wilayah ± 0,79 km²; populasi ± 10.965 jiwa; kepadatan ± 13.880 jiwa/km².
- 40 kader tersebar di 8 Pos tingkat RW (RW 01–RW 08).

> Angka-angka ini dipakai untuk _sizing_ (kapasitas & UX), bukan sebagai fakta final. Wajib dikonfirmasi sebelum _sign-off_.

### 3.1 Masalah yang Diselesaikan

- **P1 — Beban administrasi manual.** Rekapitulasi bulanan 6 bidang di 8 Pos RW memakan waktu besar dan rawan salah salin.
- **P2 — Tenggat 5 hari kerja tidak terpantau.** Tidak ada mekanisme pelacakan status & pengingat tenggat pada proses berbasis kertas.
- **P3 — Ketepatan sasaran bantuan.** Risiko warga rentan tidak terdata (_exclusion_) maupun bantuan tidak tepat sasaran (_inclusion error_).
- **P4 — Data tersilo antar bidang & antar aktor** (kader, bidan/Pustu, Pemdes, OPD) sehingga koordinasi lambat.

---

## 4. Tujuan Produk & Batasan

### 4.1 Tujuan (Goals)

- **G1.** Mendigitalkan 100% register 6 SPM Posyandu di lokus dan memangkas waktu rekapitulasi bulanan kader **≥ 80%**.
- **G2.** Menjamin **≥ 95%** permohonan/tiket layanan non-medis diselesaikan/berpindah status dalam **≤ 5 hari kerja** melalui pelacakan SLA otomatis.
- **G3.** Meningkatkan ketepatan sasaran bantuan sosial/RTLH dengan dukungan daftar prioritas berbasis data (mengurangi _exclusion error_).
- **G4.** Menyediakan satu sumber data _real-time_ lintas aktor (kader ⇄ bidan/Pustu ⇄ Pemdes ⇄ OPD/Kecamatan).

### 4.2 Bukan Tujuan (Non-Goals) — untuk rilis awal

- **NG1.** Bukan pengganti sistem rekam medis (EMR) Puskesmas atau aplikasi kesehatan nasional (mis. e-Kohort/ASIK); 6SPM mencatat data layanan Posyandu, bukan diagnosis klinis.
- **NG2.** Tidak melakukan penyaluran dana/bantuan secara langsung; sistem hanya mengelola usulan, verifikasi, dan rujukan.
- **NG3.** Tidak menerbitkan nomor registrasi Posyandu secara mandiri (kewenangan Ditjen Bina Pemdes Kemendagri); sistem hanya membantu penyiapan berkas registrasi.
- **NG4.** Integrasi _real-time_ langsung ke basis data Dukcapil **[ASUMSI — di luar cakupan awal]**; verifikasi NIK dilakukan secara manual/berkala hingga akses resmi tersedia.

---

## 5. Aktor Sistem & Hak Akses (RBAC)

Akses dibatasi berbasis peran (_Role-Based Access Control_) sesuai prinsip minimal-akses UU PDP.

| Peran                                                           | Platform      | Tanggung Jawab Utama                                                                                                                 |
| :-------------------------------------------------------------- | :------------ | :----------------------------------------------------------------------------------------------------------------------------------- |
| **Kader Posyandu** (± 40 orang, RW 01–08)                       | Mobile / PWA  | Input register 6 SPM, buat tiket permohonan/rujukan, kunjungan rumah (_door-to-door_), lihat daftar prioritas, sinkronisasi offline. |
| **Bidan Desa / Nakes (Pustu)**                                  | Web Dashboard | Verifikasi teknis bidang Kesehatan/ILP, pemantauan gizi & stunting, tindak lanjut rujukan medis.                                     |
| **Pemerintah Desa** (Kepala Desa & Sekdes)                      | Web Dashboard | Verifikasi & disposisi permohonan 6 SPM, pengesahan surat, pemantauan SLA, persetujuan usulan Bansos/RTLH.                           |
| **OPD / Kecamatan** (Auditor/Viewer)                            | Web Dashboard | Menerima rekap rujukan dari desa, memperbarui status tindak lanjut (RTLH, Bansos, air bersih, dll.).                                 |
| **Pengurus Posyandu** (Ketua/Sekretaris/Bendahara/Ketua Bidang) | Web/Mobile    | Kompilasi laporan pelayanan, penyiapan berkas registrasi kelembagaan.                                                                |
| **Admin Sistem**                                                | Web Admin     | Manajemen akun & peran, konfigurasi wilayah (RW/RT), audit log, pemeliharaan, pengelolaan model penilaian risiko.                    |

> **Struktur kepengurusan** yang dipetakan sistem mengikuti Permendagri 13/2024: Ketua, Sekretaris, Bendahara, dan 6 Ketua Bidang (satu per SPM) beserta Anggota — ditetapkan dengan Keputusan Kepala Desa.

---

## 6. Alur Layanan Resmi (Sumber Kebenaran Proses)

Seluruh modul BPM mengikuti alur baku dari panduan Kab. Tegal. Pola umum lintas bidang (kecuali Kesehatan yang berbasis Hari Buka & 5 meja):

```
1. Warga datang ke meja SPM terkait (atau kader mendata saat kunjungan)
2. Kader mendata pemohon + berkas persyaratan
3. Kader + Pemerintah Desa: verifikasi data & kunjungan lapangan/rumah
4. Bila memenuhi syarat → Kader mengajukan permohonan ke Pemerintah Desa
5. Pemerintah Desa menindaklanjuti ke OPD/Kecamatan terkait
6. OPD menindaklanjuti permohonan dari Pemerintah Desa
   ── BATAS WAKTU PELAYANAN: 5 HARI KERJA ──
```

Empat tahap ringkas (mengacu praktik Posyandu "TULIP"): **Pendaftaran → Sampaikan (masuk register) → Verifikasi → Tindak Lanjut**.

**Persyaratan berkas per bidang** (dari panduan resmi — untuk dijadikan _field_ unggah dokumen):

- **Pendidikan:** FC KTP, FC KK, Surat Pernyataan Tidak Mampu dari RT.
- **Perumahan Rakyat (RTLH):** FC KTP, FC KK, Surat Keterangan Penghasilan dari Desa, FC surat tanah/sejenis, **foto kondisi rumah 3 sisi**, surat pernyataan belum pernah menerima bantuan rehab rumah.
- **Pekerjaan Umum:** Surat permohonan Kepala Dusun/RT, titik/lokasi pembangunan sarana-prasarana (skala RT/Dusun).
- **Trantibumlinmas:** Nama, alamat, kontak, identitas diri; (pengaduan tanpa identitas & kontak dapat diabaikan; kerahasiaan & keselamatan pelapor dijamin). Kasus contoh: kebakaran, narkoba, KDRT, asusila, bencana, _trafficking_, dll. Jika tak selesai di lingkup desa → diteruskan ke OPD/Kepolisian **atas persetujuan Kepala Desa**.
- **Sosial:** FC identitas sasaran, gambaran keluhan, surat pernyataan dari Pemdes. Sasaran: disabilitas, anak terlantar, lansia, tuna sosial, jaminan sosial korban bencana. Tindak lanjut ke Kecamatan → OPD.
- **Kesehatan:** melalui **5 meja/langkah** pada Hari Buka + kunjungan rumah di luar Hari Buka.

**5 meja layanan Kesehatan (ILP):** (1) Pendaftaran → (2) Penimbangan/Pengukuran/Deteksi Dini Risiko → (3) Pencatatan → (4) Pelayanan Kesehatan → (5) Penyuluhan.

---

## 7. Cakupan 6 SPM (dari Permendagri 13/2024)

Formulir dinamis sistem harus mencakup sub-urusan berikut per bidang:

| Bidang               | Cakupan sesuai regulasi                                                                                                                                                   |
| :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Pendidikan**       | PAUD; identifikasi & pengelolaan perpustakaan desa; penguatan literasi digital; identifikasi alat peraga edukasi.                                                         |
| **Kesehatan**        | Penggerakan kunjungan sasaran (ibu, bayi, balita, pra-sekolah, usia sekolah, remaja, dewasa, lansia); penyuluhan kesehatan & gizi; deteksi dini risiko masalah kesehatan. |
| **Pekerjaan Umum**   | Air bersih; pengelolaan limbah domestik & bank sampah desa; embung air baku; jaringan air pedesaan; sumur air tanah; identifikasi kebutuhan jalan desa.                   |
| **Perumahan Rakyat** | Identifikasi & rehabilitasi RTLH; KIE lingkungan bersih-sehat; pekarangan/kebun gizi pangan lokal; biopori & hidroponik.                                                  |
| **Trantibumlinmas**  | Rehabilitasi trauma pasca-bencana; KIE kesiapsiagaan bencana; deteksi & cegah dini gangguan ketertiban; patroli pengamanan; pemberdayaan Linmas.                          |
| **Sosial**           | KIE kesetaraan gender, disabilitas, inklusi sosial; identifikasi & pendataan fakir miskin untuk Bansos; fasilitasi/penyaluran bantuan sosial.                             |

---

## 8. Kebutuhan Fungsional (Functional Requirements)

### 8.1 Modul Identitas & Pencarian Berbasis NIK

- **FR-01.** _Single Identity Index_ berbasis NIK — mencegah duplikasi warga antar Pos RW. Pencarian cepat via NIK atau pindai barcode KTP/KIA.
- **FR-02.** _Smart routing profil_ — sistem mendeteksi kelompok usia/kondisi dari data warga lalu menyarankan formulir SPM relevan (mis. bayi → imunisasi/antropometri; lansia → skrining PTM & Sosial). Kader tetap dapat memilih bidang lain secara manual.
- **FR-03.** Registrasi biodata baru bila NIK belum terdaftar (form biodata + alamat RT/RW terstruktur).

### 8.2 Modul Register Digital 6 SPM

- **FR-04.** **Formulir dinamis 6 bidang** sesuai cakupan Bagian 7, termasuk unggah dokumen persyaratan per Bagian 6.
- **FR-05.** **Modul Kesehatan/ILP:** pencatatan antropometri (BB, TB/PB, lingkar kepala) → KMS digital & deteksi dini stunting; skrining PTM lansia (tekanan darah, gula darah); skrining kesehatan kerja/K3 (keluhan pernapasan/ISPA, riwayat paparan polutan) untuk warga kawasan Rumah Produktif; alur 5 meja + kunjungan rumah.
- **FR-06.** **Mode _Offline-First_.** Kader dapat menginput & menyimpan data lokal tanpa sinyal, dengan sinkronisasi otomatis saat daring; penanganan konflik data terdefinisi.

### 8.3 Modul Alur Kerja & SLA (Workflow / "BPM" Engine)

- **FR-07.** **Tiket digital otomatis** untuk tiap permohonan/rujukan dengan nomor unik (contoh format: `SPM-<BIDANG>-YYYYMM-####`).
- **FR-08.** **Alur status baku** sesuai Bagian 6: `Didata Kader → Verifikasi & Kunjungan → Diajukan ke Pemdes → Disposisi/Tindak Lanjut OPD → Selesai` (dengan cabang _Tidak Memenuhi Syarat_).
- **FR-09.** **Penghitung SLA 5 hari kerja** otomatis sejak tiket terbit (mengecualikan hari libur/akhir pekan sesuai kalender kerja desa).
- **FR-10.** **Eskalasi & pengingat.** Bila tiket tidak berubah status **> 3 hari kerja**, sistem memicu peringatan (_red flag_) ke dasbor & notifikasi (WhatsApp/push) Kepala Desa/penanggung jawab bidang.
- **FR-11.** **Pengaduan tertutup Trantibumlinmas** dengan kerahasiaan pelapor; jalur persetujuan Kepala Desa sebelum diteruskan ke OPD/Kepolisian.

### 8.4 Modul Dashboard, Pemetaan & Prioritas Kunjungan

- **FR-12.** **Dasbor eksekutif** capaian 6 SPM per RW/bidang, status SLA, dan corong permohonan.
- **FR-13.** **Pemetaan spasial sederhana (GIS)** RW 01–08 dengan indikator warna tingkat kerentanan (_heatmap_).
- **FR-14.** **Skor & daftar prioritas kunjungan rumah.** Penilaian kerentanan rumah tangga berbasis variabel berbobot (usia/lansia tunggal, kondisi ekonomi, kedekatan area industri logam, kepadatan/ventilasi hunian, balita rawan stunting). **Rilis awal: model berbasis aturan (_rule-based scoring_) yang transparan & dapat diaudit; ML prediktif (mis. Decision Tree/KNN/SVM) dievaluasi pada fase lanjut setelah data memadai.** Setiap skor menampilkan alasan (faktor pembentuk) — bukan kotak hitam.
- **FR-15.** **Deteksi potensi _exclusion_.** Menandai warga berskor rentan tinggi yang belum tercatat sebagai penerima Bansos, sebagai _daftar tinjau_ untuk verifikasi kader — **rekomendasi, bukan keputusan otomatis**.

### 8.5 Modul Registrasi Kelembagaan Posyandu

- **FR-16.** Bantuan penyiapan berkas nomor registrasi Posyandu (Kepmendagri 100.3-2834/2025): SK TP Posyandu Desa, SK Kepengurusan Posyandu, dan matriks rekapitulasi Posyandu. Sistem menyimpan nomor registrasi resmi (format `PP.KK.KC.DDDD.NNN`, contoh `11.01.10.2001.001`) setelah diterbitkan Ditjen Bina Pemdes.

### 8.6 Modul Pelaporan

- **FR-17.** Generator laporan bulanan sesuai format baku Kemendagri/Dispermades Kab. Tegal, ekspor **PDF & Excel**.
- **FR-18.** Rekap otomatis Hari Buka Posyandu & hasil kunjungan rumah untuk disampaikan ke Pemdes/Pustu.

### 8.7 Modul Administrasi & Keamanan

- **FR-19.** Manajemen pengguna, peran, dan wilayah (RW/RT/Pos).
- **FR-20.** _Audit trail_ penuh (siapa, kapan, aksi apa) untuk create/update/delete/ekspor data warga.
- **FR-21.** Manajemen persetujuan (_consent_) subjek data & pencatatan dasar pemrosesan sesuai UU PDP.

---

## 9. Kebutuhan Non-Fungsional (NFR)

### 9.1 Keamanan & Kepatuhan (UU PDP)

- **NFR-01.** Enkripsi data sensitif (NIK, nama, data kesehatan) — AES-256 _at rest_.
- **NFR-02.** Transport aman — TLS/HTTPS untuk seluruh lalu lintas.
- **NFR-03.** Autentikasi berbasis token (JWT) dengan masa sesi maksimal 4 jam; dukungan peran & pembatasan perangkat kader.
- **NFR-04.** _Audit trail_ & retensi log; kebijakan retensi/penghapusan data sesuai UU PDP.
- **NFR-05.** Minimalisasi data — hanya _field_ yang diperlukan tiap bidang; larangan menaruh data pribadi di URL/query.

### 9.2 Kinerja & Keandalan

- **NFR-06.** Waktu muat antarmuka **< 2 detik** pada jaringan 4G/WiFi standar (target agresif < 1,5 detik untuk daftar prioritas).
- **NFR-07.** Kapasitas **≥ 50 pengguna aktif bersamaan** dan **≥ 15.000 rekam warga** tanpa degradasi. _(Sizing memakai data lokus [ASUMSI]; sesuaikan bila populasi final berbeda.)_
- **NFR-08.** Ketersediaan (_uptime_) **≥ 99,5%**; strategi _backup_ harian & pemulihan (RPO/RTO terdefinisi).

### 9.3 Kebergunaan & Aksesibilitas

- **NFR-09.** _Mobile-first_, responsif; tombol minimal 44×44 px, kontras tinggi (target **WCAG 2.1 AA**, upayakan AAA untuk teks) — mempertimbangkan kader usia lanjut.
- **NFR-10.** Bahasa operasional lokal yang membumi, minim jargon; label bidang mengikuti istilah panduan resmi.

---

## 10. Arsitektur & Infrastruktur

- **Frontend:** React/Next.js (dasbor web) + PWA (aplikasi kader; kandidat React Native untuk versi native lanjutan).
- **Backend API:** Node.js (Express) atau Python (FastAPI).
- **Workflow/BPM:** _state machine_ tiket kustom (rekomendasi rilis awal) atau Camunda bila kompleksitas alur meningkat.
- **Basis data:** PostgreSQL (+ ekstensi PostGIS untuk data spasial); Redis untuk _cache_/sesi.
- **Modul penilaian risiko:** layanan Python (rule-based; Scikit-Learn untuk fase ML lanjutan).
- **Offline sync:** penyimpanan lokal (IndexedDB) + antrean sinkronisasi & resolusi konflik.
- **Notifikasi:** _push_/WhatsApp Business API atau gateway pesan. **[ASUMSI — perlu keputusan penyedia]**
- **Server (hibah desa → APBDes):** VPS kelas menengah. Rekomendasi awal **4 vCPU / 8 GB RAM / 80 GB SSD**, ditingkatkan ke **8 vCPU / 16 GB RAM / 100 GB NVMe** bila beban tumbuh. _(Dua draf sebelumnya berbeda; final ditetapkan setelah uji beban.)_

---

## 11. Alur Pengguna Utama (Kunjungan Rumah)

```
[Mulai Kunjungan]
      │
      ▼
[Kader buka PWA] → [Lihat Daftar Prioritas Kunjungan (skor kerentanan)]
      │
      ▼
[Datangi rumah warga] → [Input / pindai NIK]
      │
  ┌───┴─────────────────────────────┐
  ▼                                 ▼
[NIK terdaftar]                 [NIK belum terdaftar → isi biodata]
  │                                 │
  ▼                                 ▼
[Sistem sarankan form SPM] ◄────────┘
  │
  ▼
[Kader input data 6 SPM & simpan (offline-capable, AES-256)]
  │
  ├─ Bila ada permohonan/keluhan → [Terbit Tiket + SLA 5 hari kerja]
  │
  ├──────────────────────────────┬───────────────────────────────┐
  ▼                              ▼                                ▼
[Data Kesehatan → Bidan/Pustu]  [Usulan Bansos/RTLH → Pemdes]   [Rekap → Laporan]
  ▼                              ▼
[Verifikasi & tindak lanjut]    [Verifikasi & disposisi ke OPD/Kecamatan]
```

---

## 12. Model Data (Tingkat Tinggi)

Entitas inti: `Warga` (NIK, biodata, RT/RW, keluarga), `RumahTangga` (untuk skor kerentanan), `LayananSPM` (per bidang, per kunjungan), `Tiket` (alur & SLA), `DokumenPersyaratan`, `Pengguna/Peran`, `Posyandu/PosRW`, `AuditLog`, `LaporanBulanan`. Relasi kunci: satu `Warga` → banyak `LayananSPM`; satu `Tiket` → satu `LayananSPM`/permohonan; `RumahTangga` mengagregasi anggota untuk penilaian FR-14.

---

## 13. Metrik Keberhasilan (KPI)

| Indikator                    | Target                                                               | Metode Ukur                                            |
| :--------------------------- | :------------------------------------------------------------------- | :----------------------------------------------------- |
| Digitalisasi register 6 SPM  | 100% register beralih ke digital                                     | Audit penggunaan buku vs aplikasi                      |
| Efisiensi waktu rekapitulasi | Turun **≥ 80%**                                                      | _Time-motion study_ kader (manual vs digital)          |
| Kepatuhan SLA                | **≥ 95%** tiket selesai/berpindah status ≤ 5 hari kerja              | Log durasi tiket                                       |
| Adopsi kader                 | **≥ 90%** kader aktif rutin di 8 RW                                  | Metrik login & transaksi/bulan                         |
| Ketepatan sasaran            | **Penurunan signifikan** _exclusion error_ pada penerima Bansos/RTLH | Validasi silang daftar prioritas vs data penerima riil |
| Kapasitas SDM                | 20–40 kader lulus pelatihan (post-test ≥ 75)                         | Nilai pelatihan                                        |

> **Koreksi terhadap draf lama:** target "0% _exclusion error_" diganti menjadi "penurunan signifikan". Nol kesalahan tidak realistis sebagai jaminan sistem dan tidak dapat dibuktikan; sistem memberi _dukungan keputusan_, keputusan akhir tetap pada verifikasi manusia (Pemdes/OPD).

---

## 14. Peta Jalan (Roadmap Bertahap)

- **Fase 0 — Discovery (2–4 mgg):** validasi data lokus, kalender kerja desa, format laporan baku, wawancara kader/Pemdes, finalisasi _field_ per bidang.
- **Fase 1 — MVP (inti):** identitas NIK, register 6 SPM, tiket + SLA 5 hari kerja + eskalasi, dasbor dasar, laporan PDF/Excel, offline-first, audit log & RBAC.
- **Fase 2 — Intelijen:** pemetaan GIS, skor kerentanan _rule-based_ + daftar prioritas, deteksi potensi _exclusion_, notifikasi WhatsApp.
- **Fase 3 — Lanjutan:** evaluasi model ML prediktif (bila data cukup), integrasi Dukcapil/aplikasi kesehatan nasional, penyempurnaan registrasi kelembagaan.

---

## 15. Asumsi, Risiko & Pertanyaan Terbuka

**Asumsi utama (perlu validasi):** data demografi lokus; jumlah & sebaran kader; ketersediaan smartphone kader; konektivitas seluler di gang padat; format laporan resmi terbaru; penyedia notifikasi.

**Risiko & mitigasi:**

- _Kepatuhan UU PDP_ atas data kesehatan/kependudukan → DPIA, _consent_, enkripsi, minimalisasi data.
- _Adopsi kader usia lanjut_ → UX sederhana, pelatihan, kader IT Champion per RW.
- _Kualitas data skor kerentanan_ → mulai _rule-based_ transparan; hindari klaim akurasi berlebih; selalu ada verifikasi manusia.
- _Keberlanjutan biaya server_ → transisi ke APBDes.
- _Ketergantungan proses lintas OPD_ → SLA & eskalasi hanya mengontrol bagian dalam kewenangan desa; status OPD bersifat _update_, bukan kendali.

**Pertanyaan terbuka:** Apakah tersedia jalur resmi verifikasi NIK (Dukcapil)? Apakah wajib interoperabilitas dengan e-Kohort/ASIK/SIPD? Definisi "hari kerja" & kalender libur desa untuk penghitung SLA? Bobot variabel FR-14 ditetapkan bersama siapa (Pemdes/Puskesmas)?

---

## 16. Rencana Keberlanjutan & Serah Terima

1. **BAST:** penyerahan Hak Cipta, _source code_, dokumentasi, dan buku panduan operasional dari tim pengembang kepada Pemerintah Desa Lemahduwur.
2. **Integrasi APBDes:** pengalokasian biaya _hosting_/pemeliharaan melalui APBDes mulai TA 2027; Posyandu masuk RPJMDesa (prasyarat registrasi & dukungan anggaran).
3. **Kader IT Champion:** 8 kader penanggung jawab TI (1 per RW) sebagai _first-line support_.
4. **Pemeliharaan:** SLA dukungan teknis, jadwal _backup_/pembaruan, dan mekanisme _retraining_/penyesuaian bobot penilaian risiko.

---

### Lampiran A — Perubahan Utama dari Draf 1.0.0

1. Dasar hukum dilengkapi & ditanggali (UU 3/2024, PP 47/2015 & 11/2019, Kepmendagri 100.3-2834/2025, UU PDP).
2. Alur proses diselaraskan dengan diagram resmi per bidang + SLA 5 hari kerja + persyaratan berkas nyata.
3. Cakupan 6 SPM disalin dari rincian Permendagri 13/2024 (bukan interpretasi bebas).
4. Ditambah Modul Registrasi Kelembagaan (nomor registrasi Posyandu) dan 5 meja Kesehatan/ILP.
5. Klaim AI diturunkan ke tingkat yang jujur & dapat diaudit (rule-based dulu; ML fase lanjut; selalu ada verifikasi manusia).
6. KPI "0% exclusion error" dikoreksi; spesifikasi server & data lokus yang berbeda antar-draf ditandai untuk validasi.
