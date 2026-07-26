-- Migration: Rename tanggal to tanggal_layanan in public.layanan_spm
-- Target: PostgreSQL 15+

ALTER TABLE public.layanan_spm RENAME COLUMN tanggal TO tanggal_layanan;
