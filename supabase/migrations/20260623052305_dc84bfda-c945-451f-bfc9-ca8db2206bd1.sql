
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['inventory_transactions','invoice_items','invoices','payments','service_job_employees','service_job_items','service_jobs','service_requests'];
  polname text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    FOR polname IN
      SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t AND cmd='ALL' AND qual='true'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', polname, t);
    END LOOP;
    EXECUTE format('CREATE POLICY "Authenticated users can manage %I" ON public.%I FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', t, t);
  END LOOP;
END $$;
