-- Migration: Supabase Storage configuration for private ticket documents
-- Target: PostgreSQL 15+

-- 1. Create the 'dokumen' private bucket if it does not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dokumen',
  'dokumen',
  false, -- private bucket
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;



-- 3. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can upload ticket documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view ticket documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete ticket documents" ON storage.objects;

-- 4. Create INSERT policy for uploads
CREATE POLICY "Users can upload ticket documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'dokumen' AND (
    public.role_code() = 'admin' OR
    EXISTS (
      SELECT 1 FROM public.tiket t
      WHERE t.id::text = split_part(name, '/', 1)
    )
  )
);

-- 5. Create SELECT policy for viewing/downloading (signed URL generations)
CREATE POLICY "Users can view ticket documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'dokumen' AND (
    public.role_code() = 'admin' OR
    EXISTS (
      SELECT 1 FROM public.tiket t
      WHERE t.id::text = split_part(name, '/', 1)
    )
  )
);

-- 6. Create DELETE policy for removing files
CREATE POLICY "Users can delete ticket documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'dokumen' AND (
    public.role_code() = 'admin' OR
    owner_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM public.tiket t
      WHERE t.id::text = split_part(name, '/', 1) AND (t.kader_id = auth.uid() OR public.role_code() IN ('pemdes', 'opd'))
    )
  )
);
