-- Migration: Setup kelembagaan registration tables and columns
-- Target: PostgreSQL 15+

-- 1. Alter public.posyandu to include catatan_registrasi feedback column
ALTER TABLE public.posyandu ADD COLUMN IF NOT EXISTS catatan_registrasi text;

-- 2. Create public.dokumen_registrasi table
CREATE TABLE IF NOT EXISTS public.dokumen_registrasi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posyandu_id uuid NOT NULL REFERENCES public.posyandu(id) ON DELETE CASCADE,
  jenis_dokumen text NOT NULL CHECK (jenis_dokumen IN ('sk_tp_posyandu', 'sk_pengurus', 'matriks_rekap')),
  file_path text NOT NULL,
  nama_file text NOT NULL,
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  diperbarui_pada timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_posyandu_jenis UNIQUE (posyandu_id, jenis_dokumen)
);

-- 3. Attach updated_at trigger helper
DROP TRIGGER IF EXISTS trg_set_diperbarui_pada_dokumen_registrasi ON public.dokumen_registrasi;
CREATE TRIGGER trg_set_diperbarui_pada_dokumen_registrasi
BEFORE UPDATE ON public.dokumen_registrasi
FOR EACH ROW EXECUTE FUNCTION set_diperbarui_pada();

-- 4. Enable RLS on public.dokumen_registrasi
ALTER TABLE public.dokumen_registrasi ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
DROP POLICY IF EXISTS select_dokumen_registrasi ON public.dokumen_registrasi;
CREATE POLICY select_dokumen_registrasi ON public.dokumen_registrasi
FOR SELECT TO authenticated
USING (
  posyandu_id = (auth.jwt() -> 'app_metadata' ->> 'posyandu_id')::uuid
  OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'pemdes', 'opd')
);

DROP POLICY IF EXISTS insert_dokumen_registrasi ON public.dokumen_registrasi;
CREATE POLICY insert_dokumen_registrasi ON public.dokumen_registrasi
FOR INSERT TO authenticated
WITH CHECK (
  posyandu_id = (auth.jwt() -> 'app_metadata' ->> 'posyandu_id')::uuid
  OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'pemdes')
);

DROP POLICY IF EXISTS delete_dokumen_registrasi ON public.dokumen_registrasi;
CREATE POLICY delete_dokumen_registrasi ON public.dokumen_registrasi
FOR DELETE TO authenticated
USING (
  posyandu_id = (auth.jwt() -> 'app_metadata' ->> 'posyandu_id')::uuid
  OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'pemdes')
);
