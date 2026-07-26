-- Migration: Seeding 3 dummy layanan_spm records for each of the 6 SPM fields dynamically
-- Target: PostgreSQL 15+

DO $$
DECLARE
  v_warga_ids uuid[];
  v_kader_id uuid;
  v_kunjungan_id uuid;
BEGIN
  -- 1. Get up to 3 warga IDs from the database (UU PDP compliant check)
  SELECT array_agg(id) INTO v_warga_ids 
  FROM (
    SELECT id FROM public.warga 
    WHERE dihapus_pada IS NULL 
    LIMIT 3
  ) tbl;

  -- If there are no wargas, raise an exception to guide the user
  IF v_warga_ids IS NULL OR cardinality(v_warga_ids) = 0 THEN
    RAISE EXCEPTION 'Data warga kosong di database. Harap isi data warga terlebih dahulu (melalui fitur Kelola Warga atau seed_dummy_warga) sebelum menjalankan seed log layanan.';
  END IF;

  -- 2. Get a valid kader ID
  SELECT id INTO v_kader_id 
  FROM public.pengguna 
  WHERE peran_id = (SELECT id FROM public.peran WHERE kode = 'kader' LIMIT 1) 
  LIMIT 1;

  IF v_kader_id IS NULL THEN
    -- Fallback to any user if no kader found
    SELECT id INTO v_kader_id FROM public.pengguna LIMIT 1;
  END IF;

  -- 3. Get or create a kunjungan session to satisfy foreign key
  SELECT id INTO v_kunjungan_id FROM public.kunjungan LIMIT 1;
  IF v_kunjungan_id IS NULL THEN
    INSERT INTO public.kunjungan (jenis, tanggal, catatan)
    VALUES ('hari_buka', current_date, 'Hari Buka Posyandu Seeding')
    RETURNING id INTO v_kunjungan_id;
  END IF;

  -- 4. Clean up any existing dummy logs to allow clean re-runs
  DELETE FROM public.layanan_spm 
  WHERE catatan LIKE 'Catatan % dummy %' 
     OR catatan LIKE '%dummy %'
     OR catatan LIKE '%(Dummy Seeding)%';

  -- 5. Insert 3 logs for each of the 6 SPM fields cycling through available wargas
  
  -- Kesehatan
  INSERT INTO public.layanan_spm (warga_id, bidang, kunjungan_id, tanggal_layanan, jenis_layanan, catatan, detail, kader_id) VALUES
  (v_warga_ids[1], 'kesehatan', v_kunjungan_id, current_date, 'Pemeriksaan Kesehatan', 'Catatan pemeriksaan kesehatan dummy 1', '{"berat_kg": 12.5}'::jsonb, v_kader_id),
  (coalesce(v_warga_ids[2], v_warga_ids[1]), 'kesehatan', v_kunjungan_id, current_date, 'Pemberian Vitamin', 'Catatan vitamin dummy 2', '{"vitamin_tipe": "A"}'::jsonb, v_kader_id),
  (coalesce(v_warga_ids[3], v_warga_ids[1]), 'kesehatan', v_kunjungan_id, current_date, 'Imunisasi', 'Catatan imunisasi dummy 3', '{"imunisasi_tipe": "BCG"}'::jsonb, v_kader_id);

  -- Sosial
  INSERT INTO public.layanan_spm (warga_id, bidang, kunjungan_id, tanggal_layanan, jenis_layanan, catatan, detail, kader_id) VALUES
  (v_warga_ids[1], 'sosial', v_kunjungan_id, current_date, 'Penyaluran Bansos', 'Catatan bansos dummy 1', '{"nominal": 300000}'::jsonb, v_kader_id),
  (coalesce(v_warga_ids[2], v_warga_ids[1]), 'sosial', v_kunjungan_id, current_date, 'Asistensi Lansia', 'Catatan asistensi lansia dummy 2', '{}'::jsonb, v_kader_id),
  (coalesce(v_warga_ids[3], v_warga_ids[1]), 'sosial', v_kunjungan_id, current_date, 'Pengusulan DTKS', 'Catatan pengusulan DTKS dummy 3', '{}'::jsonb, v_kader_id);

  -- Pendidikan
  INSERT INTO public.layanan_spm (warga_id, bidang, kunjungan_id, tanggal_layanan, jenis_layanan, catatan, detail, kader_id) VALUES
  (v_warga_ids[1], 'pendidikan', v_kunjungan_id, current_date, 'Edukasi Anak', 'Catatan PAUD/TK dummy 1', '{}'::jsonb, v_kader_id),
  (coalesce(v_warga_ids[2], v_warga_ids[1]), 'pendidikan', v_kunjungan_id, current_date, 'Penyuluhan Belajar', 'Catatan penyuluhan belajar dummy 2', '{}'::jsonb, v_kader_id),
  (coalesce(v_warga_ids[3], v_warga_ids[1]), 'pendidikan', v_kunjungan_id, current_date, 'Konseling Putus Sekolah', 'Catatan konseling sekolah dummy 3', '{}'::jsonb, v_kader_id);

  -- Pekerjaan Umum
  INSERT INTO public.layanan_spm (warga_id, bidang, kunjungan_id, tanggal_layanan, jenis_layanan, catatan, detail, kader_id) VALUES
  (v_warga_ids[1], 'pekerjaan_umum', v_kunjungan_id, current_date, 'Akses Air Bersih', 'Catatan inspeksi air bersih dummy 1', '{}'::jsonb, v_kader_id),
  (coalesce(v_warga_ids[2], v_warga_ids[1]), 'pekerjaan_umum', v_kunjungan_id, current_date, 'Akses Sanitasi', 'Catatan jamban sehat dummy 2', '{}'::jsonb, v_kader_id),
  (coalesce(v_warga_ids[3], v_warga_ids[1]), 'pekerjaan_umum', v_kunjungan_id, current_date, 'Drainase Lingkungan', 'Catatan inspeksi selokan dummy 3', '{}'::jsonb, v_kader_id);

  -- Perumahan Rakyat
  INSERT INTO public.layanan_spm (warga_id, bidang, kunjungan_id, tanggal_layanan, jenis_layanan, catatan, detail, kader_id) VALUES
  (v_warga_ids[1], 'perumahan_rakyat', v_kunjungan_id, current_date, 'Identifikasi RTLH', 'Catatan inspeksi RTLH dummy 1', '{}'::jsonb, v_kader_id),
  (coalesce(v_warga_ids[2], v_warga_ids[1]), 'perumahan_rakyat', v_kunjungan_id, current_date, 'Inspeksi Rumah Sehat', 'Catatan inspeksi ventilasi dummy 2', '{}'::jsonb, v_kader_id),
  (coalesce(v_warga_ids[3], v_warga_ids[1]), 'perumahan_rakyat', v_kunjungan_id, current_date, 'Pengusulan Rehab', 'Catatan bedah rumah dummy 3', '{}'::jsonb, v_kader_id);

  -- Trantibumlinmas
  INSERT INTO public.layanan_spm (warga_id, bidang, kunjungan_id, tanggal_layanan, jenis_layanan, catatan, detail, kader_id) VALUES
  (v_warga_ids[1], 'trantibumlinmas', v_kunjungan_id, current_date, 'Edukasi Bencana', 'Catatan penyuluhan apar dummy 1', '{}'::jsonb, v_kader_id),
  (coalesce(v_warga_ids[2], v_warga_ids[1]), 'trantibumlinmas', v_kunjungan_id, current_date, 'Jalur Evakuasi', 'Catatan jalur evakuasi dummy 2', '{}'::jsonb, v_kader_id),
  (coalesce(v_warga_ids[3], v_warga_ids[1]), 'trantibumlinmas', v_kunjungan_id, current_date, 'Edukasi Ronda', 'Catatan ronda malam dummy 3', '{}'::jsonb, v_kader_id);

END $$;
