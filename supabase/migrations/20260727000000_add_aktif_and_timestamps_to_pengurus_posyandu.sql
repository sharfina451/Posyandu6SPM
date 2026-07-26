-- Migration to add 'aktif', 'dibuat_pada', and 'diperbarui_pada' to pengurus_posyandu
ALTER TABLE public.pengurus_posyandu 
  ADD COLUMN IF NOT EXISTS aktif boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dibuat_pada timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS diperbarui_pada timestamptz NOT NULL DEFAULT now();
