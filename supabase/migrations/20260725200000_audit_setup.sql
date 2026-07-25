-- Migration: Automated audit trail logging setup
-- Target: PostgreSQL 15+

-- 1. Create the general trigger function to record updates, inserts, deletes into audit_log
CREATE OR REPLACE FUNCTION public.fn_audit_logger()
RETURNS trigger AS $$
DECLARE
  current_user_id uuid;
  current_action public.aksi_audit;
  target_record_id text;
  old_data jsonb := NULL;
  new_data jsonb := NULL;
BEGIN
  -- Resolve execution user from auth context (if available, otherwise NULL)
  BEGIN
    current_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;

  -- Determine action, payload, and record ID based on operation
  IF (TG_OP = 'INSERT') THEN
    current_action := 'create'::public.aksi_audit;
    new_data := row_to_json(NEW)::jsonb;
    target_record_id := new_data->>'id';
  ELSIF (TG_OP = 'UPDATE') THEN
    current_action := 'update'::public.aksi_audit;
    old_data := row_to_json(OLD)::jsonb;
    new_data := row_to_json(NEW)::jsonb;
    target_record_id := new_data->>'id';
  ELSIF (TG_OP = 'DELETE') THEN
    current_action := 'delete'::public.aksi_audit;
    old_data := row_to_json(OLD)::jsonb;
    target_record_id := old_data->>'id';
  END IF;

  -- Insert audit trail log record
  INSERT INTO public.audit_log (
    pengguna_id,
    aksi,
    tabel,
    record_id,
    data_lama,
    data_baru,
    pada
  ) VALUES (
    current_user_id,
    current_action,
    TG_TABLE_NAME,
    target_record_id,
    old_data,
    new_data,
    now()
  );

  -- Return appropriate row to complete trigger chain
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing triggers if any, and register them on sensitive tables

-- Table: public.warga
DROP TRIGGER IF EXISTS trg_audit_warga ON public.warga;
CREATE TRIGGER trg_audit_warga
AFTER INSERT OR UPDATE OR DELETE ON public.warga
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_logger();

-- Table: public.rumah_tangga
DROP TRIGGER IF EXISTS trg_audit_rumah_tangga ON public.rumah_tangga;
CREATE TRIGGER trg_audit_rumah_tangga
AFTER INSERT OR UPDATE OR DELETE ON public.rumah_tangga
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_logger();

-- Table: public.pemeriksaan_kesehatan
DROP TRIGGER IF EXISTS trg_audit_pemeriksaan ON public.pemeriksaan_kesehatan;
CREATE TRIGGER trg_audit_pemeriksaan
AFTER INSERT OR UPDATE OR DELETE ON public.pemeriksaan_kesehatan
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_logger();
