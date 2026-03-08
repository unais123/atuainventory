
-- Allow any authenticated user to insert/update/delete inventory (for now, until role system is fully set up)
DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory;
CREATE POLICY "Authenticated can manage inventory" ON public.inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Same for customers, suppliers, service_requests, invoices, invoice_items, payments
DROP POLICY IF EXISTS "Admins can manage customers" ON public.customers;
CREATE POLICY "Authenticated can manage customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage suppliers" ON public.suppliers;
CREATE POLICY "Authenticated can manage suppliers" ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage service requests" ON public.service_requests;
CREATE POLICY "Authenticated can manage service requests" ON public.service_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage service jobs" ON public.service_jobs;
CREATE POLICY "Authenticated can manage service jobs" ON public.service_jobs FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage job items" ON public.service_job_items;
CREATE POLICY "Authenticated can manage job items" ON public.service_job_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
CREATE POLICY "Authenticated can manage invoices" ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage invoice items" ON public.invoice_items;
CREATE POLICY "Authenticated can manage invoice items" ON public.invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
CREATE POLICY "Authenticated can manage payments" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage transactions" ON public.inventory_transactions;
CREATE POLICY "Authenticated can manage transactions" ON public.inventory_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
