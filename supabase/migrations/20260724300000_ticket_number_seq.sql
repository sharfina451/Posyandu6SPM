-- Migration: Ticket number generation and SLA calculation
-- Target: PostgreSQL 15+

-- 1. Create ticket sequence table
CREATE TABLE IF NOT EXISTS public.tiket_sequence (
  bidang public.bidang_spm NOT NULL,
  bulan varchar(6) NOT NULL,
  last_value integer NOT NULL,
  PRIMARY KEY (bidang, bulan)
);

ALTER TABLE public.tiket_sequence ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all ON public.tiket_sequence FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY read_auth ON public.tiket_sequence FOR SELECT TO authenticated USING (true);

-- 2. Create function to calculate SLA date excluding weekends and holidays
CREATE OR REPLACE FUNCTION public.calculate_sla_date(p_start_date date, p_days integer)
RETURNS date AS $$
DECLARE
  v_current_date date := p_start_date;
  v_added_days integer := 0;
  v_is_holiday boolean;
BEGIN
  WHILE v_added_days < p_days LOOP
    v_current_date := v_current_date + 1;
    -- Check if weekend (Saturday = 6, Sunday = 7)
    IF extract(isodow from v_current_date) IN (6, 7) THEN
      CONTINUE;
    END IF;
    -- Check if holiday
    SELECT EXISTS (
      SELECT 1 FROM public.hari_libur WHERE tanggal = v_current_date
    ) INTO v_is_holiday;
    
    IF NOT v_is_holiday THEN
      v_added_days := v_added_days + 1;
    END IF;
  END LOOP;
  RETURN v_current_date;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Create function to generate sequential ticket number
CREATE OR REPLACE FUNCTION public.generate_nomor_tiket(p_bidang public.bidang_spm)
RETURNS text AS $$
DECLARE
  v_bulan varchar(6);
  v_seq integer;
  v_nomor text;
BEGIN
  v_bulan := to_char(now(), 'YYYYMM');
  
  INSERT INTO public.tiket_sequence (bidang, bulan, last_value)
  VALUES (p_bidang, v_bulan, 1)
  ON CONFLICT (bidang, bulan)
  DO UPDATE SET last_value = public.tiket_sequence.last_value + 1
  RETURNING last_value INTO v_seq;
  
  v_nomor := 'SPM-' || upper(p_bidang::text) || '-' || v_bulan || '-' || lpad(v_seq::text, 4, '0');
  RETURN v_nomor;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger function to auto-populate ticket number and SLA
CREATE OR REPLACE FUNCTION public.trg_populate_tiket_details()
RETURNS trigger AS $$
BEGIN
  -- Generate ticket number if not provided
  IF NEW.nomor_tiket IS NULL OR NEW.nomor_tiket = '' THEN
    NEW.nomor_tiket := public.generate_nomor_tiket(NEW.bidang);
  END IF;
  
  -- Calculate SLA date if not provided
  IF NEW.tenggat_sla IS NULL THEN
    NEW.tenggat_sla := public.calculate_sla_date(coalesce(NEW.tanggal_terbit, now())::date, 5);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Bind trigger to public.tiket table
DROP TRIGGER IF EXISTS trg_tiket_nomor_sla ON public.tiket;
CREATE TRIGGER trg_tiket_nomor_sla
  BEFORE INSERT ON public.tiket
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_populate_tiket_details();

-- 6. Seed holiday calendar (National Holidays 2026)
INSERT INTO public.hari_libur (tanggal, keterangan) VALUES
  ('2026-01-01', 'Tahun Baru Masehi'),
  ('2026-02-17', 'Isra Mi''raj Nabi Muhammad SAW'),
  ('2026-02-26', 'Tahun Baru Imlek 2577 Kongzili'),
  ('2026-03-24', 'Hari Suci Nyepi Tahun Baru Saka 1948'),
  ('2026-03-29', 'Hari Raya Idul Fitri 1447 H'),
  ('2026-03-30', 'Cuti Bersama Hari Raya Idul Fitri'),
  ('2026-04-18', 'Wafat Isa Almasih'),
  ('2026-05-01', 'Hari Buruh Internasional'),
  ('2026-05-13', 'Kenaikan Isa Almasih'),
  ('2026-06-01', 'Hari Lahir Pancasila'),
  ('2026-06-03', 'Hari Raya Waisak 2570 BE'),
  ('2026-06-15', 'Hari Raya Idul Adha 1447 H'),
  ('2026-07-16', 'Tahun Baru Islam 1448 H'),
  ('2026-08-17', 'Hari Kemerdekaan Republik Indonesia'),
  ('2026-09-24', 'Maulid Nabi Muhammad SAW'),
  ('2026-12-25', 'Hari Raya Natal')
ON CONFLICT (tanggal) DO UPDATE SET keterangan = EXCLUDED.keterangan;
