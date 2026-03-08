
-- Junction table for service jobs <-> employees (many-to-many)
CREATE TABLE public.service_job_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_job_id uuid NOT NULL REFERENCES public.service_jobs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_job_id, employee_id)
);

ALTER TABLE public.service_job_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view job employees"
  ON public.service_job_employees FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage job employees"
  ON public.service_job_employees FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Migrate existing employee_id data to junction table
INSERT INTO public.service_job_employees (service_job_id, employee_id)
SELECT id, employee_id FROM public.service_jobs WHERE employee_id IS NOT NULL;
