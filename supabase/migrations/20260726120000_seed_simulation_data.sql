-- Migration: Seed 15 simulation warga, kunjungan, layanan_spm, pemeriksaan, and tickets
-- Target: PostgreSQL 15+

DO $$
DECLARE
  target_rt_id uuid;
  target_rw_id uuid;
  kader_user_id uuid;
  pemdes_user_id uuid;
  posyandu_lokus_id uuid := 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';

  -- Households
  kk3_id uuid := gen_random_uuid();
  kk4_id uuid := gen_random_uuid();
  kk5_id uuid := gen_random_uuid();
  kk6_id uuid := gen_random_uuid();
  kk7_id uuid := gen_random_uuid();

  -- Citizens
  w1_id uuid := gen_random_uuid();
  w2_id uuid := gen_random_uuid();
  w3_id uuid := gen_random_uuid();
  w4_id uuid := gen_random_uuid();
  w5_id uuid := gen_random_uuid();
  w6_id uuid := gen_random_uuid();
  w7_id uuid := gen_random_uuid();
  w8_id uuid := gen_random_uuid();
  w9_id uuid := gen_random_uuid();
  w10_id uuid := gen_random_uuid();
  w11_id uuid := gen_random_uuid();
  w12_id uuid := gen_random_uuid();
  w13_id uuid := gen_random_uuid();
  w14_id uuid := gen_random_uuid();
  w15_id uuid := gen_random_uuid();

  -- Sessions
  kunj1_id uuid := gen_random_uuid();
  kunj2_id uuid := gen_random_uuid();
  kunj3_id uuid := gen_random_uuid();

  -- Layanan
  l1_id uuid := gen_random_uuid();
  l2_id uuid := gen_random_uuid();
  l3_id uuid := gen_random_uuid();
  l4_id uuid := gen_random_uuid();
  l5_id uuid := gen_random_uuid();
  l6_id uuid := gen_random_uuid();
  l7_id uuid := gen_random_uuid();
  l8_id uuid := gen_random_uuid();

  -- Tickets
  t1_id uuid := gen_random_uuid();
  t2_id uuid := gen_random_uuid();
  t3_id uuid := gen_random_uuid();
BEGIN
  -- 1. Fetch valid Lokus IDs
  SELECT id INTO target_rw_id FROM public.wilayah WHERE level = 'rw' LIMIT 1;
  SELECT id INTO target_rt_id FROM public.wilayah WHERE level = 'rt' LIMIT 1;

  -- Get any available user ids to assign as recorders
  SELECT id INTO kader_user_id FROM public.pengguna LIMIT 1;
  SELECT id INTO pemdes_user_id FROM public.pengguna ORDER BY id DESC LIMIT 1;

  -- 2. Insert Households
  INSERT INTO public.rumah_tangga (id, no_kk, alamat, wilayah_rt_id, dekat_industri, kondisi_rumah, status_ekonomi) VALUES
  (kk3_id, '3317011212080003', 'RT 01/RW 01, Gang Cempaka', target_rt_id, false, 'Layak Huni', 'Desil 4'),
  (kk4_id, '3317011212080004', 'RT 01/RW 01, Blok B4', target_rt_id, false, 'Layak Huni', 'Desil 3'),
  (kk5_id, '3317011212080005', 'RT 02/RW 01, Gang Melati', target_rt_id, false, 'Layak Huni', 'Desil 2'),
  (kk6_id, '3317011212080006', 'RT 02/RW 01, Gang Mawar', target_rt_id, true, 'RTLH (Rumah Tidak Layak Huni)', 'Desil 1 (Sangat Miskin)'),
  (kk7_id, '3317011212080007', 'RT 03/RW 01, Gang Flamboyan', target_rt_id, false, 'Layak Huni', 'Desil 3')
  ON CONFLICT (no_kk) DO NOTHING;

  -- 3. Insert 15 Citizens (Warga)
  INSERT INTO public.warga (id, nik, nama, jenis_kelamin, tanggal_lahir, rumah_tangga_id, hubungan_keluarga, no_hp, disabilitas, nik_terverifikasi) VALUES
  -- KK 3
  (w1_id, '3328011505850011', 'Andi Saputra', 'L', '1985-04-10', kk3_id, 'Kepala Keluarga', '081211112222', false, true),
  (w2_id, '3328012008890012', 'Mega Lestari', 'P', '1989-11-20', kk3_id, 'Istri', '081211112223', false, true),
  (w3_id, '3328011010220013', 'Dina Saputra', 'P', '2022-12-05', kk3_id, 'Anak', NULL, false, true),
  -- KK 4
  (w4_id, '3328011505850021', 'Herman Yusuf', 'L', '1980-06-14', kk4_id, 'Kepala Keluarga', '085733334444', false, true),
  (w5_id, '3328012008890022', 'Yulianti', 'P', '1983-09-18', kk4_id, 'Istri', '085733334445', false, true),
  (w6_id, '3328011010220023', 'Rehan Yusuf', 'L', '2023-02-12', kk4_id, 'Anak', NULL, false, true),
  -- KK 5
  (w7_id, '3328011505850031', 'Wawan Setiawan', 'L', '1978-01-25', kk5_id, 'Kepala Keluarga', '082155556666', false, true),
  (w8_id, '3328012008890032', 'Rini Astuti', 'P', '1981-05-14', kk5_id, 'Istri', '082155556667', false, true),
  (w9_id, '3328011010220033', 'Fajar Setiawan', 'L', '2021-08-30', kk5_id, 'Anak', NULL, false, true),
  -- KK 6
  (w10_id, '3328011505850041', 'Toni Wijaya', 'L', '1990-10-02', kk6_id, 'Kepala Keluarga', '087877778888', false, true),
  (w11_id, '3328012008890042', 'Siska Amelia', 'P', '1992-03-24', kk6_id, 'Istri', '087877778889', false, true),
  (w12_id, '3328011010220043', 'Aris Wijaya', 'L', '2024-05-15', kk6_id, 'Anak', NULL, false, true),
  -- KK 7
  (w13_id, '3328010403600051', 'Mbah Kardi', 'L', '1945-02-10', kk7_id, 'Kepala Keluarga', '089988889999', false, true),
  (w14_id, '3328012207650052', 'Mbah Kasni', 'P', '1950-04-12', kk7_id, 'Istri', NULL, true, true),
  (w15_id, '3328011010220053', 'Slamet Kardi', 'L', '1988-12-08', kk7_id, 'Anak', '089988889990', false, true)
  ON CONFLICT (nik) DO NOTHING;

  -- 4. Insert 3 Sessions (Kunjungan)
  INSERT INTO public.kunjungan (id, jenis, tanggal, wilayah_id, kader_id, catatan) VALUES
  (kunj1_id, 'hari_buka', '2026-07-10', target_rw_id, kader_user_id, 'Hari buka posyandu rutin balita & ibu hamil'),
  (kunj2_id, 'kunjungan_rumah', '2026-07-15', target_rw_id, kader_user_id, 'Pengecekan sanitasi rumah warga miskin'),
  (kunj3_id, 'hari_buka', '2026-07-20', target_rw_id, kader_user_id, 'Skrining kesehatan lansia bulanan')
  ON CONFLICT (id) DO NOTHING;

  -- 5. Insert 8 Layanan 6 SPM (layanan_spm)
  INSERT INTO public.layanan_spm (id, warga_id, bidang, kunjungan_id, tanggal_layanan, jenis_layanan, catatan, detail, kader_id) VALUES
  (l1_id, w3_id, 'kesehatan', kunj1_id, '2026-07-10', 'Penimbangan & Pengukuran', 'Pemantauan tumbuh kembang rutin', '{"berat_kg": 12.5, "tinggi_cm": 85.0}'::jsonb, kader_user_id),
  (l2_id, w6_id, 'kesehatan', kunj1_id, '2026-07-10', 'Imunisasi', 'Imunisasi campak dosis lanjutan', '{"imunisasi_tipe": "Campak"}'::jsonb, kader_user_id),
  (l3_id, w1_id, 'pekerjaan_umum', kunj2_id, '2026-07-15', 'Akses Air Minum', 'Verifikasi sambungan air bersih layak', '{"sumber_air": "PAM", "akses_layak": true}'::jsonb, kader_user_id),
  (l4_id, w2_id, 'perumahan_rakyat', kunj2_id, '2026-07-15', 'Identifikasi RTLH', 'Verifikasi kondisi atap bocor dan dinding bambu', '{"kondisi_dinding": "non-permanen", "luas_lantai": 36}'::jsonb, kader_user_id),
  (l5_id, w4_id, 'sosial', kunj2_id, '2026-07-15', 'Pengusulan DTKS', 'Pengusulan bantuan sosial akibat kemiskinan', '{"pekerjaan_kepala": "Buruh Harian", "pendapatan": 800000}'::jsonb, kader_user_id),
  (l6_id, w10_id, 'trantibumlinmas', kunj2_id, '2026-07-15', 'Sosialisasi Kebakaran', 'Penyuluhan tanggap darurat bencana pemukiman', '{"alat_padam_ada": false}'::jsonb, kader_user_id),
  (l7_id, w13_id, 'kesehatan', kunj3_id, '2026-07-20', 'Skrining Lansia PTM', 'Pengecekan tensi darah dan gula darah sewaktu', '{"sistolik": 145, "gula_darah": 180}'::jsonb, kader_user_id),
  (l8_id, w15_id, 'pendidikan', kunj2_id, '2026-07-15', 'Penyetaraan Sekolah', 'Konseling pendaftaran kejar Paket C', '{"tingkat_terakhir": "SMP"}'::jsonb, kader_user_id)
  ON CONFLICT (id) DO NOTHING;

  -- 6. Insert 5 Kesehatan/ILP (pemeriksaan_kesehatan)
  INSERT INTO public.pemeriksaan_kesehatan (id, layanan_spm_id, warga_id, tanggal, berat_kg, tinggi_cm, status_gizi, keluhan_ispa, paparan_polutan, catatan) VALUES
  (gen_random_uuid(), l1_id, w3_id, '2026-07-10', 12.5, 85.0, 'normal', false, false, 'Tumbuh kembang normal'),
  (gen_random_uuid(), l2_id, w6_id, '2026-07-10', 9.8, 74.5, 'normal', false, false, 'Kondisi sehat saat imunisasi'),
  (gen_random_uuid(), NULL, w9_id, '2026-07-10', 10.2, 80.0, 'kurang', true, false, 'Ada keluhan batuk pilek ringan'),
  (gen_random_uuid(), NULL, w12_id, '2026-07-10', 7.1, 62.0, 'stunting', false, true, 'Risiko stunting karena tinggi badan rendah dibanding umur'),
  (gen_random_uuid(), l7_id, w13_id, '2026-07-20', 65.0, 160.0, 'hipertensi', false, false, 'Diberikan anjuran diet rendah garam')
  ON CONFLICT (id) DO NOTHING;

  -- 7. Insert 3 Tickets/Referrals (tiket)
  INSERT INTO public.tiket (id, nomor_tiket, warga_id, rumah_tangga_id, layanan_spm_id, bidang, jenis_permohonan, deskripsi, status, prioritas, rahasia, tanggal_terbit, tenggat_sla, kader_id, verifikator_id, opd_tujuan) VALUES
  (t1_id, 'SPM-KESEHATAN-202607-0001', w12_id, kk6_id, NULL, 'kesehatan', 'Rujukan Stunting', 'Rujukan penanganan stunting balita Aris Wijaya ke Puskesmas Adiwerna.', 'disposisi_opd', 'tinggi', false, now(), current_date + interval '5 days', kader_user_id, pemdes_user_id, 'Dinas Kesehatan'),
  (t2_id, 'SPM-PERUMAHAN-202607-0002', w2_id, kk3_id, l4_id, 'perumahan_rakyat', 'Rekomendasi RTLH', 'Permohonan bedah rumah tidak layak huni atas nama Mega Lestari.', 'diajukan_pemdes', 'sedang', false, now(), current_date + interval '5 days', kader_user_id, NULL, 'Dinas Perkim'),
  (t3_id, 'SPM-SOSIAL-202607-0003', w4_id, kk4_id, l5_id, 'sosial', 'Bansos DTKS', 'Permohonan bantuan sosial Program Keluarga Harapan (PKH).', 'selesai', 'sedang', false, now() - interval '6 days', now() - interval '1 days', kader_user_id, pemdes_user_id, 'Dinas Sosial')
  ON CONFLICT (id) DO NOTHING;

  -- 8. Insert Ticket Status Histories (tiket_riwayat_status)
  INSERT INTO public.tiket_riwayat_status (tiket_id, status_dari, status_ke, catatan, dibuat_oleh) VALUES
  -- Ticket 1
  (t1_id, NULL, 'didata', 'Tiket dibuat oleh kader posyandu', kader_user_id),
  (t1_id, 'didata', 'verifikasi_kunjungan', 'Kader memverifikasi kondisi balita langsung', kader_user_id),
  (t1_id, 'verifikasi_kunjungan', 'diajukan_pemdes', 'Diajukan ke perangkat desa', kader_user_id),
  (t1_id, 'diajukan_pemdes', 'disposisi_opd', 'Diteruskan ke Dinas Kesehatan Kabupaten Tegal', pemdes_user_id),
  -- Ticket 2
  (t2_id, NULL, 'didata', 'Pengajuan RTLH didaftarkan', kader_user_id),
  (t2_id, 'didata', 'verifikasi_kunjungan', 'Kunjungan rumah dilakukan untuk memeriksa dinding/atap', kader_user_id),
  (t2_id, 'verifikasi_kunjungan', 'diajukan_pemdes', 'Diserahkan ke Kepala Desa Lemahduwur', kader_user_id),
  -- Ticket 3
  (t3_id, NULL, 'didata', 'Pendaftaran permohonan bansos', kader_user_id),
  (t3_id, 'didata', 'verifikasi_kunjungan', 'Kader melakukan wawancara ekonomi warga', kader_user_id),
  (t3_id, 'verifikasi_kunjungan', 'diajukan_pemdes', 'Berkas dikirim ke kelurahan', kader_user_id),
  (t3_id, 'diajukan_pemdes', 'disposisi_opd', 'Disposisi ke Dinsos Kab. Tegal', pemdes_user_id),
  (t3_id, 'disposisi_opd', 'selesai', 'Kartu bansos telah diterbitkan dan diserahkan', pemdes_user_id)
  ON CONFLICT (id) DO NOTHING;

END $$;
