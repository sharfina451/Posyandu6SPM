-- Migration: Setup monthly reports tracking table
-- Target: PostgreSQL 15+

-- 1. Create public.laporan_bulanan table
CREATE TABLE IF NOT EXISTS public.laporan_bulanan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posyandu_id uuid NOT NULL REFERENCES public.posyandu(id) ON DELETE CASCADE,
  periode date NOT NULL,
  bidang text CHECK (bidang IN ('pendidikan', 'kesehatan', 'pekerjaan_umum', 'perumahan_rakyat', 'trantibumlinmas', 'sosial') OR bidang IS NULL),
  format text NOT NULL CHECK (format IN ('pdf', 'excel')),
  file_path text NOT NULL,
  nama_file text NOT NULL,
  dibuat_oleh uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.laporan_bulanan ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DROP POLICY IF EXISTS select_laporan_bulanan ON public.laporan_bulanan;
CREATE POLICY select_laporan_bulanan ON public.laporan_bulanan
FOR SELECT TO authenticated
USING (
  posyandu_id = (auth.jwt() -> 'app_metadata' ->> 'posyandu_id')::uuid
  OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'pemdes', 'opd')
);

DROP POLICY IF EXISTS insert_laporan_bulanan ON public.laporan_bulanan;
CREATE POLICY insert_laporan_bulanan ON public.laporan_bulanan
FOR INSERT TO authenticated
WITH CHECK (
  posyandu_id = (auth.jwt() -> 'app_metadata' ->> 'posyandu_id')::uuid
  OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'pemdes', 'kader')
);

DROP POLICY IF EXISTS delete_laporan_bulanan ON public.laporan_bulanan;
CREATE POLICY delete_laporan_bulanan ON public.laporan_bulanan
FOR DELETE TO authenticated
USING (
  posyandu_id = (auth.jwt() -> 'app_metadata' ->> 'posyandu_id')::uuid
  OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'pemdes')
);
