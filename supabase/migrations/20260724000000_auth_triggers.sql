-- Trigger to automatically create a profile in public.pengguna when a new user signs up in auth.users
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
      (SELECT id FROM public.peran WHERE kode = (new.raw_user_meta_data->>'role')::peran_kode),
      default_role_id
    ),
    coalesce(new.encrypted_password, 'supabase_managed'),
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger creation for handle_new_user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Trigger to sync public.pengguna updates back into auth.users.raw_app_meta_data for JWT custom claims
CREATE OR REPLACE FUNCTION public.sync_user_meta_to_auth()
RETURNS trigger AS $$
DECLARE
  role_code text;
BEGIN
  SELECT kode::text INTO role_code FROM public.peran WHERE id = new.peran_id;

  UPDATE auth.users
  SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', role_code,
      'wilayah_id', new.wilayah_id,
      'posyandu_id', new.posyandu_id
    )
  WHERE id = new.id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger creation for sync_user_meta_to_auth
CREATE OR REPLACE TRIGGER on_pengguna_changed
  AFTER INSERT OR UPDATE OF peran_id, wilayah_id, posyandu_id ON public.pengguna
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_meta_to_auth();
