-- 1) Investors: add KYC fields and user link, relax NOT NULLs that KYC fills later
ALTER TABLE public.investors
  ADD COLUMN IF NOT EXISTS aadhaar_name text,
  ADD COLUMN IF NOT EXISTS gov_id_type text,
  ADD COLUMN IF NOT EXISTS gov_id_number text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS account_holder_name text,
  ADD COLUMN IF NOT EXISTS kyc_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS kyc_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS investors_user_id_unique ON public.investors(user_id) WHERE user_id IS NOT NULL;

-- Relax columns the KYC wizard will populate later. These are required for new shell rows but allowed null initially.
ALTER TABLE public.investors
  ALTER COLUMN pan DROP NOT NULL,
  ALTER COLUMN bank_account DROP NOT NULL,
  ALTER COLUMN ifsc DROP NOT NULL,
  ALTER COLUMN amount DROP NOT NULL,
  ALTER COLUMN full_name DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL;

-- gov_id_type allowed values via trigger (CHECK avoided so future values are easy)
CREATE OR REPLACE FUNCTION public.validate_investor_gov_id_type()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.gov_id_type IS NOT NULL AND NEW.gov_id_type NOT IN ('aadhaar','pan','passport','driving_license') THEN
    RAISE EXCEPTION 'Invalid gov_id_type: %', NEW.gov_id_type;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_investor_gov_id_type ON public.investors;
CREATE TRIGGER trg_validate_investor_gov_id_type
BEFORE INSERT OR UPDATE ON public.investors
FOR EACH ROW EXECUTE FUNCTION public.validate_investor_gov_id_type();

-- Let an investor read their own row
DROP POLICY IF EXISTS "Investor reads own row" ON public.investors;
CREATE POLICY "Investor reads own row" ON public.investors
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Investor updates own row" ON public.investors;
CREATE POLICY "Investor updates own row" ON public.investors
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 2) investment_requests
CREATE TABLE IF NOT EXISTS public.investment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL,
  transaction_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL DEFAULT 'bank_transfer',
  reference_number text UNIQUE,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.investment_requests TO authenticated;
GRANT ALL ON public.investment_requests TO service_role;

ALTER TABLE public.investment_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.validate_investment_request_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('pending','approved','rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_invreq_status ON public.investment_requests;
CREATE TRIGGER trg_validate_invreq_status
BEFORE INSERT OR UPDATE ON public.investment_requests
FOR EACH ROW EXECUTE FUNCTION public.validate_investment_request_status();

CREATE OR REPLACE FUNCTION public.set_investment_reference_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE candidate text; tries int := 0;
BEGIN
  IF NEW.reference_number IS NOT NULL THEN RETURN NEW; END IF;
  LOOP
    candidate := 'PROF-' || upper(substr(replace(gen_random_uuid()::text,'-',''), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.investment_requests WHERE reference_number = candidate);
    tries := tries + 1;
    IF tries > 10 THEN RAISE EXCEPTION 'Could not generate reference number'; END IF;
  END LOOP;
  NEW.reference_number := candidate;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_invreq_reference ON public.investment_requests;
CREATE TRIGGER trg_set_invreq_reference
BEFORE INSERT ON public.investment_requests
FOR EACH ROW EXECUTE FUNCTION public.set_investment_reference_number();

DROP TRIGGER IF EXISTS trg_touch_invreq_updated_at ON public.investment_requests;
CREATE TRIGGER trg_touch_invreq_updated_at
BEFORE UPDATE ON public.investment_requests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS policies
CREATE POLICY "Investor reads own requests" ON public.investment_requests
FOR SELECT TO authenticated
USING (investor_id IN (SELECT id FROM public.investors WHERE user_id = auth.uid()));

CREATE POLICY "Investor inserts own requests" ON public.investment_requests
FOR INSERT TO authenticated
WITH CHECK (investor_id IN (SELECT id FROM public.investors WHERE user_id = auth.uid()));

CREATE POLICY "Staff reads all requests" ON public.investment_requests
FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff updates all requests" ON public.investment_requests
FOR UPDATE TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

-- 3) kyc_documents
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  file_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.kyc_documents TO authenticated;
GRANT ALL ON public.kyc_documents TO service_role;

ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investor reads own kyc docs" ON public.kyc_documents
FOR SELECT TO authenticated
USING (investor_id IN (SELECT id FROM public.investors WHERE user_id = auth.uid()));

CREATE POLICY "Investor uploads own kyc docs" ON public.kyc_documents
FOR INSERT TO authenticated
WITH CHECK (investor_id IN (SELECT id FROM public.investors WHERE user_id = auth.uid()));

CREATE POLICY "Staff reads all kyc docs" ON public.kyc_documents
FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff updates all kyc docs" ON public.kyc_documents
FOR UPDATE TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

-- 4) RPC: get_or_create_my_investor
CREATE OR REPLACE FUNCTION public.get_or_create_my_investor()
RETURNS public.investors
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.investors;
  v_email text;
  v_name text;
  v_phone text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_row FROM public.investors WHERE user_id = v_uid LIMIT 1;
  IF FOUND THEN RETURN v_row; END IF;

  SELECT email, full_name INTO v_email, v_name FROM public.profiles WHERE id = v_uid;
  IF v_email IS NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  END IF;

  SELECT phone INTO v_phone FROM public.waitlist WHERE email = v_email::citext LIMIT 1;

  INSERT INTO public.investors (user_id, full_name, email, phone, status, kyc_completed)
  VALUES (v_uid, COALESCE(v_name, v_email, ''), COALESCE(v_email, ''), COALESCE(v_phone, ''), 'pending', false)
  RETURNING * INTO v_row;

  RETURN v_row;
END $$;

GRANT EXECUTE ON FUNCTION public.get_or_create_my_investor() TO authenticated;