-- Seeding 5 dummy users (kader) and their profiles as Pengurus Posyandu Lemahduwur

-- 1. Insert into auth.users (triggers handle_new_user to populate public.pengguna)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'd1111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'kader.siti@lemahduwur.id',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"nama":"Siti Aminah","username":"kader_siti"}',
    now(),
    now(),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'd2222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'kader.dewi@lemahduwur.id',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"nama":"Dewi Lestari","username":"kader_dewi"}',
    now(),
    now(),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'd3333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'kader.budi@lemahduwur.id',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"nama":"Budi Raharjo","username":"kader_budi"}',
    now(),
    now(),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'd4444444-4444-4444-4444-444444444444',
    'authenticated',
    'authenticated',
    'kader.rina@lemahduwur.id',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"nama":"Rina Wati","username":"kader_rina"}',
    now(),
    now(),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'd5555555-5555-5555-5555-555555555555',
    'authenticated',
    'authenticated',
    'kader.ahmad@lemahduwur.id',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"nama":"Ahmad Fauzi","username":"kader_ahmad"}',
    now(),
    now(),
    '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Update public.pengguna to link posyandu_id and assign local wilayah RW scopes
UPDATE public.pengguna
SET 
  posyandu_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'::uuid,
  wilayah_id = CASE id
    WHEN 'd1111111-1111-1111-1111-111111111111'::uuid THEN '11111111-1111-1111-1111-111111111111'::uuid
    WHEN 'd2222222-2222-2222-2222-222222222222'::uuid THEN '22222222-2222-2222-2222-222222222222'::uuid
    WHEN 'd3333333-3333-3333-3333-333333333333'::uuid THEN '33333333-3333-3333-3333-333333333333'::uuid
    WHEN 'd4444444-4444-4444-4444-444444444444'::uuid THEN '44444444-4444-4444-4444-444444444444'::uuid
    WHEN 'd5555555-5555-5555-5555-555555555555'::uuid THEN '55555555-5555-5555-5555-555555555555'::uuid
  END
WHERE id IN (
  'd1111111-1111-1111-1111-111111111111'::uuid,
  'd2222222-2222-2222-2222-222222222222'::uuid,
  'd3333333-3333-3333-3333-333333333333'::uuid,
  'd4444444-4444-4444-4444-444444444444'::uuid,
  'd5555555-5555-5555-5555-555555555555'::uuid
);

-- 3. Insert into public.pengurus_posyandu
INSERT INTO public.pengurus_posyandu (
  id, posyandu_id, pengguna_id, nama, jabatan, no_sk, aktif
) VALUES
  (
    'e1111111-1111-1111-1111-111111111111',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'd1111111-1111-1111-1111-111111111111',
    'Siti Aminah',
    'Ketua',
    'SK-02/PEM/VIII/2025',
    true
  ),
  (
    'e2222222-2222-2222-2222-222222222222',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'd2222222-2222-2222-2222-222222222222',
    'Dewi Lestari',
    'Sekretaris',
    'SK-02/PEM/VIII/2025',
    true
  ),
  (
    'e3333333-3333-3333-3333-333333333333',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'd3333333-3333-3333-3333-333333333333',
    'Budi Raharjo',
    'Bendahara',
    'SK-02/PEM/VIII/2025',
    true
  ),
  (
    'e4444444-4444-4444-4444-444444444444',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'd4444444-4444-4444-4444-444444444444',
    'Rina Wati',
    'Ketua Bidang Kesehatan',
    'SK-02/PEM/VIII/2025',
    true
  ),
  (
    'e5555555-5555-5555-5555-555555555555',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'd5555555-5555-5555-5555-555555555555',
    'Ahmad Fauzi',
    'Kader Pembantu',
    'SK-03/PEM/VIII/2025',
    true
  )
ON CONFLICT (id) DO NOTHING;
