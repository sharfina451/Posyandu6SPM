-- Helper functions inside auth schema to get JWT metadata claims easily
CREATE OR REPLACE FUNCTION public.role_code() RETURNS text AS $$
  SELECT coalesce(nullif(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role', ''), 'guest');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.wilayah_id() RETURNS uuid AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'wilayah_id', '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.posyandu_id() RETURNS uuid AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'posyandu_id', '')::uuid;
$$ LANGUAGE sql STABLE;


-- ---------------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
ALTER TABLE public.peran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posyandu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wilayah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengguna ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengurus_posyandu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rumah_tangga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_pdp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kunjungan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layanan_spm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pemeriksaan_kesehatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiket ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiket_riwayat_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dokumen_persyaratan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variabel_kerentanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skor_kerentanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skor_kerentanan_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_bulanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dokumen_registrasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hari_libur ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------
-- 1. ADMIN POLICIES (Full Access to Everything)
-- ---------------------------------------------------------------------
CREATE POLICY admin_all ON public.peran FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.posyandu FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.wilayah FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.pengguna FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.pengurus_posyandu FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.rumah_tangga FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.warga FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.consent_pdp FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.kunjungan FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.layanan_spm FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.pemeriksaan_kesehatan FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.tiket FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.tiket_riwayat_status FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.dokumen_persyaratan FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.variabel_kerentanan FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.skor_kerentanan FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.skor_kerentanan_detail FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.laporan_bulanan FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.dokumen_registrasi FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.audit_log FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');
CREATE POLICY admin_all ON public.hari_libur FOR ALL TO authenticated USING (public.role_code() = 'admin') WITH CHECK (public.role_code() = 'admin');


-- ---------------------------------------------------------------------
-- 2. PUBLIC / READ-ONLY MASTER TABLES
-- ---------------------------------------------------------------------
CREATE POLICY read_auth ON public.peran FOR SELECT TO authenticated USING (true);
CREATE POLICY read_auth ON public.hari_libur FOR SELECT TO authenticated USING (true);
CREATE POLICY read_auth ON public.variabel_kerentanan FOR SELECT TO authenticated USING (true);


-- ---------------------------------------------------------------------
-- 3. POSYANDU & WILAYAH POLICIES
-- ---------------------------------------------------------------------
CREATE POLICY read_posyandu ON public.posyandu FOR SELECT TO authenticated 
  USING (id = public.posyandu_id() OR public.role_code() IN ('opd', 'pemdes'));

CREATE POLICY read_wilayah ON public.wilayah FOR SELECT TO authenticated 
  USING (posyandu_id = public.posyandu_id() OR public.role_code() IN ('opd', 'pemdes'));


-- ---------------------------------------------------------------------
-- 4. PENGGUNA & PENGURUS_POSYANDU POLICIES
-- ---------------------------------------------------------------------
CREATE POLICY read_pengguna ON public.pengguna FOR SELECT TO authenticated 
  USING (posyandu_id = public.posyandu_id() OR public.role_code() IN ('opd', 'pemdes'));

CREATE POLICY update_own_pengguna ON public.pengguna FOR UPDATE TO authenticated 
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY read_pengurus ON public.pengurus_posyandu FOR SELECT TO authenticated 
  USING (posyandu_id = public.posyandu_id() OR public.role_code() IN ('opd', 'pemdes'));


-- ---------------------------------------------------------------------
-- 5. RUMAH TANGGA & WARGA POLICIES (Kader & Pemdes/Bidan scope)
-- ---------------------------------------------------------------------
-- Helper function to check if RT is in user's wilayah scope (own RT or parent RW matches)
CREATE OR REPLACE FUNCTION public.is_rt_in_user_wilayah(rt_id uuid) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.rumah_tangga rt
    WHERE rt.id = rt_id AND (
      rt.wilayah_rt_id = public.wilayah_id() OR
      (SELECT w.parent_id FROM public.wilayah w WHERE w.id = rt.wilayah_rt_id) = public.wilayah_id()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY user_rt ON public.rumah_tangga FOR ALL TO authenticated
  USING (
    public.role_code() = 'admin' OR
    (public.role_code() = 'kader' AND (
      wilayah_rt_id = public.wilayah_id() OR
      (SELECT w.parent_id FROM public.wilayah w WHERE w.id = wilayah_rt_id) = public.wilayah_id()
    )) OR
    (public.role_code() IN ('pemdes', 'bidan', 'opd') AND EXISTS (
      SELECT 1 FROM public.wilayah w WHERE w.id = wilayah_rt_id AND w.posyandu_id = public.posyandu_id()
    ))
  )
  WITH CHECK (
    public.role_code() = 'admin' OR
    (public.role_code() = 'kader' AND (
      wilayah_rt_id = public.wilayah_id() OR
      (SELECT w.parent_id FROM public.wilayah w WHERE w.id = wilayah_rt_id) = public.wilayah_id()
    ))
  );

CREATE POLICY user_warga ON public.warga FOR ALL TO authenticated
  USING (
    public.role_code() = 'admin' OR
    (public.role_code() = 'kader' AND (rumah_tangga_id IS NULL OR public.is_rt_in_user_wilayah(rumah_tangga_id))) OR
    (public.role_code() IN ('pemdes', 'bidan', 'opd') AND (
      rumah_tangga_id IS NULL OR EXISTS (
        SELECT 1 FROM public.rumah_tangga rt
        JOIN public.wilayah w ON w.id = rt.wilayah_rt_id
        WHERE rt.id = rumah_tangga_id AND w.posyandu_id = public.posyandu_id()
      )
    ))
  )
  WITH CHECK (
    public.role_code() = 'admin' OR
    (public.role_code() = 'kader' AND (rumah_tangga_id IS NULL OR public.is_rt_in_user_wilayah(rumah_tangga_id)))
  );

CREATE POLICY user_consent ON public.consent_pdp FOR ALL TO authenticated
  USING (
    public.role_code() = 'admin' OR
    (public.role_code() = 'kader' AND EXISTS (
      SELECT 1 FROM public.warga w WHERE w.id = warga_id AND (w.rumah_tangga_id IS NULL OR public.is_rt_in_user_wilayah(w.rumah_tangga_id))
    )) OR
    (public.role_code() IN ('pemdes', 'bidan', 'opd') AND EXISTS (
      SELECT 1 FROM public.warga w
      LEFT JOIN public.rumah_tangga rt ON rt.id = w.rumah_tangga_id
      LEFT JOIN public.wilayah wil ON wil.id = rt.wilayah_rt_id
      WHERE w.id = warga_id AND (w.rumah_tangga_id IS NULL OR wil.posyandu_id = public.posyandu_id())
    ))
  )
  WITH CHECK (
    public.role_code() = 'admin' OR
    (public.role_code() = 'kader' AND EXISTS (
      SELECT 1 FROM public.warga w WHERE w.id = warga_id AND (w.rumah_tangga_id IS NULL OR public.is_rt_in_user_wilayah(w.rumah_tangga_id))
    ))
  );


-- ---------------------------------------------------------------------
-- 6. TRANSACTIONS POLICIES (Kunjungan, Layanan, Pemeriksaan)
-- ---------------------------------------------------------------------
CREATE POLICY user_kunjungan ON public.kunjungan FOR ALL TO authenticated
  USING (
    public.role_code() = 'admin' OR
    (public.role_code() = 'kader' AND (kader_id = auth.uid() OR wilayah_id = public.wilayah_id())) OR
    (public.role_code() IN ('pemdes', 'bidan', 'opd') AND EXISTS (
      SELECT 1 FROM public.wilayah w WHERE w.id = wilayah_id AND w.posyandu_id = public.posyandu_id()
    ))
  )
  WITH CHECK (
    public.role_code() = 'admin' OR
    (public.role_code() = 'kader' AND kader_id = auth.uid())
  );

CREATE POLICY user_layanan ON public.layanan_spm FOR ALL TO authenticated
  USING (
    public.role_code() = 'admin' OR
    (public.role_code() = 'kader' AND (
      kader_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.warga w WHERE w.id = warga_id AND (w.rumah_tangga_id IS NULL OR public.is_rt_in_user_wilayah(w.rumah_tangga_id))
      )
    )) OR
    (public.role_code() IN ('pemdes', 'bidan', 'opd') AND EXISTS (
      SELECT 1 FROM public.warga w
      LEFT JOIN public.rumah_tangga rt ON rt.id = w.rumah_tangga_id
      LEFT JOIN public.wilayah wil ON wil.id = rt.wilayah_rt_id
      WHERE w.id = warga_id AND (w.rumah_tangga_id IS NULL OR wil.posyandu_id = public.posyandu_id())
    ))
  )
  WITH CHECK (
    public.role_code() = 'admin' OR
    (public.role_code() = 'kader' AND (
      kader_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.warga w WHERE w.id = warga_id AND (w.rumah_tangga_id IS NULL OR public.is_rt_in_user_wilayah(w.rumah_tangga_id))
      )
    ))
  );

CREATE POLICY user_pemeriksaan ON public.pemeriksaan_kesehatan FOR ALL TO authenticated
  USING (
    public.role_code() = 'admin' OR
    (public.role_code() = 'kader' AND EXISTS (
      SELECT 1 FROM public.warga w WHERE w.id = warga_id AND (w.rumah_tangga_id IS NULL OR public.is_rt_in_user_wilayah(w.rumah_tangga_id))
    )) OR
    (public.role_code() = 'bidan' AND EXISTS (
      SELECT 1 FROM public.warga w
      LEFT JOIN public.rumah_tangga rt ON rt.id = w.rumah_tangga_id
      LEFT JOIN public.wilayah wil ON wil.id = rt.wilayah_rt_id
      WHERE w.id = warga_id AND (w.rumah_tangga_id IS NULL OR wil.posyandu_id = public.posyandu_id())
    )) OR
    (public.role_code() IN ('pemdes', 'opd') AND EXISTS (
      SELECT 1 FROM public.warga w
      LEFT JOIN public.rumah_tangga rt ON rt.id = w.rumah_tangga_id
      LEFT JOIN public.wilayah wil ON wil.id = rt.wilayah_rt_id
      WHERE w.id = warga_id AND (w.rumah_tangga_id IS NULL OR wil.posyandu_id = public.posyandu_id())
    ))
  )
  WITH CHECK (
    public.role_code() = 'admin' OR
    (public.role_code() = 'kader' AND EXISTS (
      SELECT 1 FROM public.warga w WHERE w.id = warga_id AND (w.rumah_tangga_id IS NULL OR public.is_rt_in_user_wilayah(w.rumah_tangga_id))
    )) OR
    (public.role_code() = 'bidan' AND EXISTS (
      SELECT 1 FROM public.warga w
      LEFT JOIN public.rumah_tangga rt ON rt.id = w.rumah_tangga_id
      LEFT JOIN public.wilayah wil ON wil.id = rt.wilayah_rt_id
      WHERE w.id = warga_id AND (w.rumah_tangga_id IS NULL OR wil.posyandu_id = public.posyandu_id())
    ))
  );


-- ---------------------------------------------------------------------
-- 7. TIKET & DOKUMEN PERSYARATAN POLICIES (Trantibumlinmas Privacy)
-- ---------------------------------------------------------------------
CREATE POLICY user_tiket ON public.tiket FOR ALL TO authenticated
  USING (
    public.role_code() = 'admin' OR
    (public.role_code() = 'kader' AND (
      kader_id = auth.uid() OR (
        -- Can view if in their RW scope AND is NOT private Trantibumlinmas
        (rahasia = false OR rahasia IS NULL) AND
        EXISTS (
          SELECT 1 FROM public.warga w WHERE w.id = warga_id AND (w.rumah_tangga_id IS NULL OR public.is_rt_in_user_wilayah(w.rumah_tangga_id))
        )
      )
    )) OR
    (public.role_code() = 'bidan' AND bidang = 'kesehatan' AND EXISTS (
      SELECT 1 FROM public.warga w
      LEFT JOIN public.rumah_tangga rt ON rt.id = w.rumah_tangga_id
      LEFT JOIN public.wilayah wil ON wil.id = rt.wilayah_rt_id
      WHERE w.id = warga_id AND (w.rumah_tangga_id IS NULL OR wil.posyandu_id = public.posyandu_id())
    )) OR
    -- Pemdes and OPD can view tickets in their posyandu (including private tickets)
    (public.role_code() IN ('pemdes', 'opd') AND EXISTS (
      SELECT 1 FROM public.warga w
      LEFT JOIN public.rumah_tangga rt ON rt.id = w.rumah_tangga_id
      LEFT JOIN public.wilayah wil ON wil.id = rt.wilayah_rt_id
      WHERE w.id = warga_id AND (w.rumah_tangga_id IS NULL OR wil.posyandu_id = public.posyandu_id())
    ))
  )
  WITH CHECK (
    public.role_code() = 'admin' OR
    (public.role_code() = 'kader' AND (kader_id = auth.uid() OR kader_id IS NULL)) OR
    (public.role_code() IN ('pemdes', 'opd', 'bidan'))
  );

CREATE POLICY user_tiket_status ON public.tiket_riwayat_status FOR ALL TO authenticated
  USING (
    public.role_code() = 'admin' OR
    EXISTS (
      SELECT 1 FROM public.tiket t WHERE t.id = tiket_id
    )
  )
  WITH CHECK (
    public.role_code() = 'admin' OR
    (oleh_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.tiket t WHERE t.id = tiket_id
    ))
  );

CREATE POLICY user_dokumen ON public.dokumen_persyaratan FOR ALL TO authenticated
  USING (
    public.role_code() = 'admin' OR
    diunggah_oleh = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.tiket t WHERE t.id = tiket_id
    )
  )
  WITH CHECK (
    public.role_code() = 'admin' OR
    diunggah_oleh = auth.uid()
  );


-- ---------------------------------------------------------------------
-- 8. SKOR KERENTANAN & LAPORAN & AUDIT & REGISTRASI POLICIES
-- ---------------------------------------------------------------------
CREATE POLICY user_skor ON public.skor_kerentanan FOR ALL TO authenticated
  USING (
    public.role_code() = 'admin' OR
    (public.role_code() = 'kader' AND public.is_rt_in_user_wilayah(rumah_tangga_id)) OR
    (public.role_code() IN ('pemdes', 'bidan', 'opd') AND EXISTS (
      SELECT 1 FROM public.rumah_tangga rt
      JOIN public.wilayah w ON w.id = rt.wilayah_rt_id
      WHERE rt.id = rumah_tangga_id AND w.posyandu_id = public.posyandu_id()
    ))
  )
  WITH CHECK (
    public.role_code() = 'admin'
  );

CREATE POLICY user_skor_detail ON public.skor_kerentanan_detail FOR ALL TO authenticated
  USING (
    public.role_code() = 'admin' OR
    EXISTS (
      SELECT 1 FROM public.skor_kerentanan s WHERE s.id = skor_id
    )
  )
  WITH CHECK (
    public.role_code() = 'admin'
  );

CREATE POLICY user_laporan ON public.laporan_bulanan FOR ALL TO authenticated
  USING (
    posyandu_id = public.posyandu_id() OR public.role_code() IN ('admin', 'opd', 'pemdes')
  )
  WITH CHECK (
    public.role_code() IN ('admin', 'pengurus', 'pemdes')
  );

CREATE POLICY user_dokumen_reg ON public.dokumen_registrasi FOR ALL TO authenticated
  USING (
    posyandu_id = public.posyandu_id() OR public.role_code() IN ('admin', 'opd', 'pemdes')
  )
  WITH CHECK (
    public.role_code() IN ('admin', 'pengurus', 'pemdes')
  );

CREATE POLICY user_audit ON public.audit_log FOR SELECT TO authenticated
  USING (
    public.role_code() IN ('admin', 'pemdes', 'opd')
  );

CREATE POLICY insert_audit ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (
    pengguna_id = auth.uid()
  );
