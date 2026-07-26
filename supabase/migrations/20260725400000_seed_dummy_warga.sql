-- Migration: Seed 5 dummy citizens (warga) and households (rumah_tangga)
-- Target: PostgreSQL 15+

DO $$
DECLARE
  target_rt_id uuid;
  kk1_id uuid := gen_random_uuid();
  kk2_id uuid := gen_random_uuid();
BEGIN
  -- 1. Get a valid RT wilayah ID
  SELECT id INTO target_rt_id FROM public.wilayah WHERE level = 'rt' LIMIT 1;

  -- 2. Insert Households (Rumah Tangga)
  INSERT INTO public.rumah_tangga (id, no_kk, alamat, wilayah_rt_id, dekat_industri, kondisi_rumah, status_ekonomi)
  VALUES 
  (
    kk1_id,
    '3317011212080001',
    'Jl. Cendrawasih No. 12, Lemahduwur',
    target_rt_id,
    false,
    'Layak Huni',
    'Desil 4'
  ),
  (
    kk2_id,
    '3317011212080002',
    'Jl. Melati No. 4, Lemahduwur',
    target_rt_id,
    true, -- dekat industri peleburan logam
    'RTLH (Rumah Tidak Layak Huni)',
    'Desil 1 (Sangat Miskin)'
  )
  ON CONFLICT (no_kk) DO NOTHING;

  -- 3. Insert Citizens (Warga)
  -- Household 1
  INSERT INTO public.warga (id, nik, nama, jenis_kelamin, tanggal_lahir, rumah_tangga_id, hubungan_keluarga, no_hp, disabilitas, nik_terverifikasi)
  VALUES
  (
    gen_random_uuid(),
    '3328011505850001',
    'Budi Santoso',
    'L',
    '1985-05-15',
    kk1_id,
    'Kepala Keluarga',
    '081234567890',
    false,
    true
  ),
  (
    gen_random_uuid(),
    '3328012008890002',
    'Siti Aminah',
    'P',
    '1989-08-20',
    kk1_id,
    'Istri',
    '081234567891',
    false,
    true
  ),
  (
    'e9b98765-4321-2109-8765-432109876543', -- fixed UUID for test assertions if needed
    '3328011010220003',
    'Rizky Santoso',
    'L',
    '2022-10-10', -- Balita
    kk1_id,
    'Anak',
    NULL,
    false,
    true
  )
  ON CONFLICT (nik) DO NOTHING;

  -- Household 2
  INSERT INTO public.warga (id, nik, nama, jenis_kelamin, tanggal_lahir, rumah_tangga_id, hubungan_keluarga, no_hp, disabilitas, nik_terverifikasi)
  VALUES
  (
    gen_random_uuid(),
    '3328010403600004',
    'Joko Susilo',
    'L',
    '1960-03-04', -- Lansia
    kk2_id,
    'Kepala Keluarga',
    '085712345678',
    false,
    true
  ),
  (
    gen_random_uuid(),
    '3328012207650005',
    'Sri Wahyuni',
    'P',
    '1965-07-22', -- Lansia
    kk2_id,
    'Istri',
    '085712345679',
    true, -- disabilitas
    true
  )
  ON CONFLICT (nik) DO NOTHING;

END $$;
