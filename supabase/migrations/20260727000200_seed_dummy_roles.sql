-- Seeding 2 dummy users for each role (kader, bidan, pemdes, opd, pengurus)

-- 1. Insert into auth.users (will automatically trigger handle_new_user and set roles)
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
  -- 1. Kader Posyandu
  (
    '00000000-0000-0000-0000-000000000000',
    'da111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'kader.tina@lemahduwur.id',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"nama":"Tina Rahmawati","username":"kader_tina","role":"kader"}',
    now(),
    now(),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'da222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'kader.eko@lemahduwur.id',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"nama":"Eko Prasetyo","username":"kader_eko","role":"kader"}',
    now(),
    now(),
    '', '', '', ''
  ),
  -- 2. Bidan Desa
  (
    '00000000-0000-0000-0000-000000000000',
    'db111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'bidan.sri@lemahduwur.id',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"nama":"Sri Wahyuni","username":"bidan_sri","role":"bidan"}',
    now(),
    now(),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'db222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'bidan.lani@lemahduwur.id',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"nama":"Lani Herlina","username":"bidan_lani","role":"bidan"}',
    now(),
    now(),
    '', '', '', ''
  ),
  -- 3. Pemerintah Desa
  (
    '00000000-0000-0000-0000-000000000000',
    'dc111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'pemdes.suprapto@lemahduwur.id',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"nama":"Suprapto","username":"pemdes_suprapto","role":"pemdes"}',
    now(),
    now(),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'dc222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'pemdes.hartono@lemahduwur.id',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"nama":"Hartono","username":"pemdes_hartono","role":"pemdes"}',
    now(),
    now(),
    '', '', '', ''
  ),
  -- 4. OPD
  (
    '00000000-0000-0000-0000-000000000000',
    'dd111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'opd.dinkes@lemahduwur.id',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"nama":"Dinkes Auditor","username":"opd_dinkes","role":"opd"}',
    now(),
    now(),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'dd222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'opd.dinsos@lemahduwur.id',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"nama":"Dinsos Auditor","username":"opd_dinsos","role":"opd"}',
    now(),
    now(),
    '', '', '', ''
  ),
  -- 5. Pengurus Posyandu
  (
    '00000000-0000-0000-0000-000000000000',
    'de111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'pengurus.hartati@lemahduwur.id',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"nama":"Hartati","username":"pengurus_hartati","role":"pengurus"}',
    now(),
    now(),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'de222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'pengurus.subagyo@lemahduwur.id',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"nama":"Subagyo","username":"pengurus_subagyo","role":"pengurus"}',
    now(),
    now(),
    '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Update public.pengguna to link posyandu_id and assign local wilayah RW scopes for kader
UPDATE public.pengguna
SET 
  posyandu_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'::uuid,
  wilayah_id = CASE id
    WHEN 'da111111-1111-1111-1111-111111111111'::uuid THEN '66666666-6666-6666-6666-666666666666'::uuid
    WHEN 'da222222-2222-2222-2222-222222222222'::uuid THEN '77777777-7777-7777-7777-777777777777'::uuid
    ELSE NULL
  END
WHERE id IN (
  'da111111-1111-1111-1111-111111111111'::uuid,
  'da222222-2222-2222-2222-222222222222'::uuid,
  'db111111-1111-1111-1111-111111111111'::uuid,
  'db222222-2222-2222-2222-222222222222'::uuid,
  'dc111111-1111-1111-1111-111111111111'::uuid,
  'dc222222-2222-2222-2222-222222222222'::uuid,
  'dd111111-1111-1111-1111-111111111111'::uuid,
  'dd222222-2222-2222-2222-222222222222'::uuid,
  'de111111-1111-1111-1111-111111111111'::uuid,
  'de222222-2222-2222-2222-222222222222'::uuid
);
