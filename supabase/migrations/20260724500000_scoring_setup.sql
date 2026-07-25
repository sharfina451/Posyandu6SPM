-- Migration: Seeding scoring variables and setting up triggers for vulnerability recalculations
-- Target: PostgreSQL 15+

-- 1. Seed variables weights in public.variabel_kerentanan
INSERT INTO public.variabel_kerentanan (kode, nama, bobot, aktif, versi)
VALUES
  ('lansia_tunggal', 'Lansia Tunggal (>= 60 tahun tinggal sendiri)', 0.250, true, 'rule-based-v1'),
  ('miskin_dtks', 'Kondisi Ekonomi (Desil DTKS Rendah)', 0.250, true, 'rule-based-v1'),
  ('dekat_industri', 'Kawasan Industri Produktif', 0.150, true, 'rule-based-v1'),
  ('balita_stunting', 'Balita Stunting / Gizi Kurang', 0.200, true, 'rule-based-v1'),
  ('disabilitas', 'Anggota Keluarga Disabilitas', 0.150, true, 'rule-based-v1')
ON CONFLICT (kode) DO UPDATE
SET nama = EXCLUDED.nama,
    bobot = EXCLUDED.bobot,
    aktif = EXCLUDED.aktif,
    versi = EXCLUDED.versi;

-- 2. Recalculation function for a single household score
CREATE OR REPLACE FUNCTION public.recalculate_household_score(rt_id uuid)
RETURNS void AS $$
DECLARE
  v_total_skor numeric(6,3) := 0.0;
  v_persen numeric(5,2) := 0.0;
  v_klasifikasi public.klasifikasi_risiko;
  v_potensi_eksklusi boolean := false;
  v_skor_id uuid;
  
  -- variables condition values
  v_val_lansia numeric(6,3) := 0.0;
  v_val_miskin numeric(6,3) := 0.0;
  v_val_industri numeric(6,3) := 0.0;
  v_val_stunting numeric(6,3) := 0.0;
  v_val_disabilitas numeric(6,3) := 0.0;
  
  -- weights
  v_w_lansia numeric(5,3);
  v_w_miskin numeric(5,3);
  v_w_industri numeric(5,3);
  v_w_stunting numeric(5,3);
  v_w_disabilitas numeric(5,3);

  -- household variables
  v_dekat_industri boolean;
  v_status_ekonomi text;
  v_member_count integer;
BEGIN
  -- Get household details
  SELECT dekat_industri, status_ekonomi
  INTO v_dekat_industri, v_status_ekonomi
  FROM public.rumah_tangga
  WHERE id = rt_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Get member count
  SELECT count(*) INTO v_member_count
  FROM public.warga
  WHERE rumah_tangga_id = rt_id AND dihapus_pada IS NULL;

  -- Fetch weights from public.variabel_kerentanan
  SELECT bobot INTO v_w_lansia FROM public.variabel_kerentanan WHERE kode = 'lansia_tunggal' AND aktif = true;
  SELECT bobot INTO v_w_miskin FROM public.variabel_kerentanan WHERE kode = 'miskin_dtks' AND aktif = true;
  SELECT bobot INTO v_w_industri FROM public.variabel_kerentanan WHERE kode = 'dekat_industri' AND aktif = true;
  SELECT bobot INTO v_w_stunting FROM public.variabel_kerentanan WHERE kode = 'balita_stunting' AND aktif = true;
  SELECT bobot INTO v_w_disabilitas FROM public.variabel_kerentanan WHERE kode = 'disabilitas' AND aktif = true;

  -- Fallbacks if weights not seeded
  v_w_lansia := COALESCE(v_w_lansia, 0.250);
  v_w_miskin := COALESCE(v_w_miskin, 0.250);
  v_w_industri := COALESCE(v_w_industri, 0.150);
  v_w_stunting := COALESCE(v_w_stunting, 0.200);
  v_w_disabilitas := COALESCE(v_w_disabilitas, 0.150);

  -- Calculate condition values (x_ij)
  -- Lansia Tunggal (>= 60 years old living alone)
  IF v_member_count = 1 AND EXISTS (
    SELECT 1 FROM public.warga
    WHERE rumah_tangga_id = rt_id
      AND dihapus_pada IS NULL
      AND tanggal_lahir <= CURRENT_DATE - INTERVAL '60 years'
  ) THEN
    v_val_lansia := 1.0;
  END IF;

  -- Miskin DTKS (checks non-mampu classifications)
  IF v_status_ekonomi IS NOT NULL AND lower(v_status_ekonomi) IN (
    'miskin', 'sangat miskin', 'sangat_miskin', 'desil 1', 'desil 2', 'desil 3', 'desil 4', 
    'tidak mampu', 'tidak_mampu', 'prasejahtera', 'pkh', 'bpnt'
  ) THEN
    v_val_miskin := 1.0;
  END IF;

  -- Dekat Industri
  IF v_dekat_industri = true THEN
    v_val_industri := 1.0;
  END IF;

  -- Balita Stunting
  IF EXISTS (
    SELECT 1 FROM (
      SELECT DISTINCT ON (w.id) p.status_gizi
      FROM public.warga w
      JOIN public.pemeriksaan_kesehatan p ON w.id = p.warga_id
      WHERE w.rumah_tangga_id = rt_id
        AND w.dihapus_pada IS NULL
        AND w.tanggal_lahir >= CURRENT_DATE - INTERVAL '5 years'
      ORDER BY w.id, p.tanggal DESC, p.dibuat_pada DESC
    ) latest_p
    WHERE lower(latest_p.status_gizi) IN (
      'stunting', 'gizi kurang', 'gizi_kurang', 'gizi buruk', 'gizi_buruk', 
      'stunted', 'severely stunted', 'severely_stunted', 'wasted', 'severely wasted', 'underweight'
    )
  ) THEN
    v_val_stunting := 1.0;
  END IF;

  -- Disabilitas
  IF EXISTS (
    SELECT 1 FROM public.warga
    WHERE rumah_tangga_id = rt_id
      AND disabilitas = true
      AND dihapus_pada IS NULL
  ) THEN
    v_val_disabilitas := 1.0;
  END IF;

  -- Calculate total score and percentage
  v_total_skor := (v_w_lansia * v_val_lansia) + 
                  (v_w_miskin * v_val_miskin) + 
                  (v_w_industri * v_val_industri) + 
                  (v_w_stunting * v_val_stunting) + 
                  (v_w_disabilitas * v_val_disabilitas);
                  
  v_persen := v_total_skor * 100.0;

  -- Determine risk classification
  IF v_persen < 25.0 THEN
    v_klasifikasi := 'aman';
  ELSIF v_persen < 50.0 THEN
    v_klasifikasi := 'waspada';
  ELSIF v_persen < 75.0 THEN
    v_klasifikasi := 'bahaya';
  ELSE
    v_klasifikasi := 'kritis';
  END IF;

  -- Determine exclusion potential: 'bahaya' or 'kritis' AND has no resolved social assistance ticket
  IF v_klasifikasi IN ('bahaya', 'kritis') AND NOT EXISTS (
    SELECT 1 FROM public.tiket t
    WHERE t.rumah_tangga_id = rt_id
      AND t.bidang = 'sosial'
      AND t.status = 'selesai'
  ) THEN
    v_potensi_eksklusi := true;
  END IF;

  -- Fetch existing score record id
  SELECT id INTO v_skor_id FROM public.skor_kerentanan WHERE rumah_tangga_id = rt_id;
  
  IF v_skor_id IS NOT NULL THEN
    UPDATE public.skor_kerentanan
    SET total_skor = v_total_skor,
        persen = v_persen,
        klasifikasi = v_klasifikasi,
        potensi_eksklusi = v_potensi_eksklusi,
        dihitung_pada = now()
    WHERE id = v_skor_id;
  ELSE
    INSERT INTO public.skor_kerentanan (rumah_tangga_id, total_skor, persen, klasifikasi, model_versi, potensi_eksklusi, dihitung_pada)
    VALUES (rt_id, v_total_skor, v_persen, v_klasifikasi, 'rule-based-v1', v_potensi_eksklusi, now())
    RETURNING id INTO v_skor_id;
  END IF;

  -- Refresh details
  DELETE FROM public.skor_kerentanan_detail WHERE skor_id = v_skor_id;

  INSERT INTO public.skor_kerentanan_detail (skor_id, variabel_id, nilai_kondisi, kontribusi)
  SELECT v_skor_id, id, v_val_lansia, (v_w_lansia * v_val_lansia) FROM public.variabel_kerentanan WHERE kode = 'lansia_tunggal' UNION ALL
  SELECT v_skor_id, id, v_val_miskin, (v_w_miskin * v_val_miskin) FROM public.variabel_kerentanan WHERE kode = 'miskin_dtks' UNION ALL
  SELECT v_skor_id, id, v_val_industri, (v_w_industri * v_val_industri) FROM public.variabel_kerentanan WHERE kode = 'dekat_industri' UNION ALL
  SELECT v_skor_id, id, v_val_stunting, (v_w_stunting * v_val_stunting) FROM public.variabel_kerentanan WHERE kode = 'balita_stunting' UNION ALL
  SELECT v_skor_id, id, v_val_disabilitas, (v_w_disabilitas * v_val_disabilitas) FROM public.variabel_kerentanan WHERE kode = 'disabilitas';

END;
$$ LANGUAGE plpgsql;

-- 3. Trigger function for public.warga modifications
CREATE OR REPLACE FUNCTION public.trg_fn_recalculate_warga()
RETURNS trigger AS $$
BEGIN
  -- Recalculate for the new/updated household
  IF NEW IS NOT NULL AND NEW.rumah_tangga_id IS NOT NULL THEN
    PERFORM public.recalculate_household_score(NEW.rumah_tangga_id);
  END IF;
  -- Recalculate for the old household if it changed
  IF TG_OP = 'UPDATE' AND OLD.rumah_tangga_id IS NOT NULL AND OLD.rumah_tangga_id <> COALESCE(NEW.rumah_tangga_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    PERFORM public.recalculate_household_score(OLD.rumah_tangga_id);
  END IF;
  -- Recalculate for deleted warga
  IF TG_OP = 'DELETE' AND OLD.rumah_tangga_id IS NOT NULL THEN
    PERFORM public.recalculate_household_score(OLD.rumah_tangga_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger function for public.pemeriksaan_kesehatan additions
CREATE OR REPLACE FUNCTION public.trg_fn_recalculate_pemeriksaan()
RETURNS trigger AS $$
DECLARE
  v_rt_id uuid;
BEGIN
  SELECT rumah_tangga_id INTO v_rt_id
  FROM public.warga
  WHERE id = NEW.warga_id;
  
  IF v_rt_id IS NOT NULL THEN
    PERFORM public.recalculate_household_score(v_rt_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger function for public.rumah_tangga updates
CREATE OR REPLACE FUNCTION public.trg_fn_recalculate_rumah_tangga()
RETURNS trigger AS $$
BEGIN
  PERFORM public.recalculate_household_score(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Attach triggers to tables
DROP TRIGGER IF EXISTS trg_recalculate_on_warga ON public.warga;
CREATE TRIGGER trg_recalculate_on_warga
AFTER INSERT OR UPDATE OR DELETE ON public.warga
FOR EACH ROW EXECUTE FUNCTION public.trg_fn_recalculate_warga();

DROP TRIGGER IF EXISTS trg_recalculate_on_pemeriksaan ON public.pemeriksaan_kesehatan;
CREATE TRIGGER trg_recalculate_on_pemeriksaan
AFTER INSERT OR UPDATE ON public.pemeriksaan_kesehatan
FOR EACH ROW EXECUTE FUNCTION public.trg_fn_recalculate_pemeriksaan();

DROP TRIGGER IF EXISTS trg_recalculate_on_rumah_tangga ON public.rumah_tangga;
CREATE TRIGGER trg_recalculate_on_rumah_tangga
AFTER INSERT OR UPDATE ON public.rumah_tangga
FOR EACH ROW EXECUTE FUNCTION public.trg_fn_recalculate_rumah_tangga();

-- 7. View for spatial households data
CREATE OR REPLACE VIEW public.v_spatial_households AS
SELECT 
  rt.id as rumah_tangga_id,
  rt.no_kk,
  rt.alamat,
  rt.dekat_industri,
  rt.kondisi_rumah,
  rt.status_ekonomi,
  rt.wilayah_rt_id,
  w_rt.parent_id as wilayah_rw_id,
  st_y(rt.titik) as latitude,
  st_x(rt.titik) as longitude,
  sk.total_skor,
  sk.persen,
  sk.klasifikasi,
  sk.potensi_eksklusi,
  (
    SELECT w.nama 
    FROM public.warga w 
    WHERE w.rumah_tangga_id = rt.id 
      AND w.hubungan_keluarga = 'Kepala Keluarga' 
      AND w.dihapus_pada IS NULL 
    LIMIT 1
  ) as nama_kepala_keluarga
FROM public.rumah_tangga rt
LEFT JOIN public.wilayah w_rt ON rt.wilayah_rt_id = w_rt.id
LEFT JOIN public.skor_kerentanan sk ON rt.id = sk.rumah_tangga_id;
