
-- Company settings table (single row for the organization)
CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT '',
  company_name_ar text DEFAULT '',
  logo_url text DEFAULT '',
  address text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  vat_number text DEFAULT '',
  cr_number text DEFAULT '',
  bank_account_name text DEFAULT '',
  bank_name text DEFAULT '',
  bank_account_no text DEFAULT '',
  bank_iban text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view company settings"
  ON public.company_settings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can manage company settings"
  ON public.company_settings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Insert a default row
INSERT INTO public.company_settings (company_name, bank_account_name, bank_name, bank_account_no, bank_iban)
VALUES ('GRAY LANE TRADING COMPANY', 'GRAY LANE TRADING COMPANY', 'SAUDI BRITISH BANK', '262-353493-001', 'SA70 4500 0000 2623 5349 3001');

-- Storage bucket for company logo
INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true);

CREATE POLICY "Authenticated can upload company assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-assets');

CREATE POLICY "Authenticated can update company assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'company-assets');

CREATE POLICY "Anyone can view company assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-assets');

CREATE POLICY "Authenticated can delete company assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'company-assets');
