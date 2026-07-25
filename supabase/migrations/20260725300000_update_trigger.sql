-- Migration: Update handle_new_user trigger function to safely parse role
-- Target: PostgreSQL 15+

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role_id smallint;
BEGIN
  -- Get default role 'kader'
  SELECT id INTO default_role_id FROM public.peran WHERE kode = 'kader';

  INSERT INTO public.pengguna (id, nama, username, peran_id, kata_sandi_hash, aktif)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', new.email),
    coalesce(new.raw_user_meta_data->>'username', new.email),
    coalesce(
      (SELECT id FROM public.peran WHERE kode::text = new.raw_user_meta_data->>'role'),
      default_role_id
    ),
    coalesce(new.encrypted_password, 'supabase_managed'),
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
