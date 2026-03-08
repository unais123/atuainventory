
-- Employees table
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text DEFAULT '',
  email text DEFAULT '',
  role text DEFAULT 'Technician',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view employees"
  ON public.employees FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage employees"
  ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add employee_id to service_jobs
ALTER TABLE public.service_jobs ADD COLUMN employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;
