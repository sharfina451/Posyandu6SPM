-- Seed Posyandu Lemahduwur
INSERT INTO public.posyandu (id, nama, nomor_registrasi, status_registrasi, desa, kecamatan, kabupaten, no_sk_pengurus, tanggal_terdaftar)
VALUES (
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'Posyandu Lemahduwur',
  '11.01.10.2001.001',
  'terdaftar',
  'Lemahduwur',
  'Adiwerna',
  'Tegal',
  'SK-01/PEM/VIII/2025',
  '2025-08-17'
)
ON CONFLICT (id) DO NOTHING;

-- Seed RW 01 - RW 08
INSERT INTO public.wilayah (id, posyandu_id, parent_id, level, kode, nama) VALUES
('11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', NULL, 'rw', '01', 'RW Kesatu'),
('22222222-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', NULL, 'rw', '02', 'RW Kedua'),
('33333333-3333-3333-3333-333333333333', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', NULL, 'rw', '03', 'RW Ketiga'),
('44444444-4444-4444-4444-444444444444', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', NULL, 'rw', '04', 'RW Keempat'),
('55555555-5555-5555-5555-555555555555', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', NULL, 'rw', '05', 'RW Kelima'),
('66666666-6666-6666-6666-666666666666', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', NULL, 'rw', '06', 'RW Keenam'),
('77777777-7777-7777-7777-777777777777', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', NULL, 'rw', '07', 'RW Ketujuh'),
('88888888-8888-8888-8888-888888888888', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', NULL, 'rw', '08', 'RW Kedelapan')
ON CONFLICT (id) DO NOTHING;

-- Seed RT 01 and RT 02 for each RW
INSERT INTO public.wilayah (posyandu_id, parent_id, level, kode, nama) VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '11111111-1111-1111-1111-111111111111', 'rt', '01', 'RT Satu / RW Satu'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '11111111-1111-1111-1111-111111111111', 'rt', '02', 'RT Dua / RW Satu'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '22222222-2222-2222-2222-222222222222', 'rt', '01', 'RT Satu / RW Dua'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '22222222-2222-2222-2222-222222222222', 'rt', '02', 'RT Dua / RW Dua'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '33333333-3333-3333-3333-333333333333', 'rt', '01', 'RT Satu / RW Tiga'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '33333333-3333-3333-3333-333333333333', 'rt', '02', 'RT Dua / RW Tiga'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '44444444-4444-4444-4444-444444444444', 'rt', '01', 'RT Satu / RW Empat'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '44444444-4444-4444-4444-444444444444', 'rt', '02', 'RT Dua / RW Empat'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '55555555-5555-5555-5555-555555555555', 'rt', '01', 'RT Satu / RW Lima'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '55555555-5555-5555-5555-555555555555', 'rt', '02', 'RT Dua / RW Lima'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '66666666-6666-6666-6666-666666666666', 'rt', '01', 'RT Satu / RW Enam'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '66666666-6666-6666-6666-666666666666', 'rt', '02', 'RT Dua / RW Enam'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '77777777-7777-7777-7777-777777777777', 'rt', '01', 'RT Satu / RW Tujuh'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '77777777-7777-7777-7777-777777777777', 'rt', '02', 'RT Dua / RW Tujuh'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '88888888-8888-8888-8888-888888888888', 'rt', '01', 'RT Satu / RW Delapan'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '88888888-8888-8888-8888-888888888888', 'rt', '02', 'RT Dua / RW Delapan')
ON CONFLICT DO NOTHING;
