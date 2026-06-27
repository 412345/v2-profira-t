
-- 1. Documents: add structured payload column
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS document_payload JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Admin audit logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  executed_action_descriptor TEXT NOT NULL,
  targeted_subsystem_category TEXT NOT NULL,
  associated_record_reference_key UUID NOT NULL,
  detailed_structural_payload_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff read audit" ON public.admin_audit_logs;
CREATE POLICY "Staff read audit" ON public.admin_audit_logs
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff insert audit" ON public.admin_audit_logs;
CREATE POLICY "Staff insert audit" ON public.admin_audit_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS admin_audit_logs_target_idx
  ON public.admin_audit_logs (targeted_subsystem_category, associated_record_reference_key);
CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx
  ON public.admin_audit_logs (created_at DESC);

-- 3. Approve RPC: atomic approve + investor update + agreement doc + audit
CREATE OR REPLACE FUNCTION public.approve_investment_request(_id UUID, _notes TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_req public.investment_requests;
  v_inv public.investors;
  v_doc_id UUID;
  v_serial TEXT;
  v_monthly NUMERIC(14,2);
  v_maturity NUMERIC(14,2);
  v_payload JSONB;
BEGIN
  IF v_uid IS NULL OR NOT public.is_staff(v_uid) THEN
    RAISE EXCEPTION 'Forbidden: staff only';
  END IF;

  SELECT * INTO v_req FROM public.investment_requests WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Investment request not found'; END IF;
  IF v_req.status = 'approved' THEN RAISE EXCEPTION 'Already approved'; END IF;

  SELECT * INTO v_inv FROM public.investors WHERE id = v_req.investor_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Investor not found'; END IF;

  v_monthly := ROUND(v_req.amount * 0.10, 2);
  v_maturity := ROUND(v_req.amount + (v_req.amount * 0.10 * 6), 2);

  -- 1. Mark request approved
  UPDATE public.investment_requests
     SET status = 'approved',
         approved_by = v_uid,
         approved_at = now(),
         notes = COALESCE(_notes, notes)
   WHERE id = _id;

  -- 2. Bump investor totals + activate
  UPDATE public.investors
     SET amount = COALESCE(amount, 0) + v_req.amount,
         status = 'active',
         tenure_months = 6
   WHERE id = v_inv.id;

  -- 3. Create agreement document
  v_serial := 'AGR-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''), 1, 6));
  v_payload := jsonb_build_object(
    'principal', v_req.amount,
    'monthly_payout', v_monthly,
    'maturity_total', v_maturity,
    'tenure_months', 6,
    'interest_rate_monthly', 0.10,
    'reference_number', v_req.reference_number,
    'transaction_id', v_req.transaction_id,
    'generated_at', now(),
    'investor', jsonb_build_object(
      'id', v_inv.id,
      'full_name', v_inv.full_name,
      'email', v_inv.email,
      'phone', v_inv.phone,
      'gov_id_type', v_inv.gov_id_type,
      'gov_id_number', v_inv.gov_id_number,
      'aadhaar_name', v_inv.aadhaar_name
    ),
    'banking', jsonb_build_object(
      'bank_name', v_inv.bank_name,
      'ifsc', v_inv.ifsc,
      'bank_account', v_inv.bank_account,
      'account_holder_name', v_inv.account_holder_name
    )
  );

  INSERT INTO public.documents (investor_id, kind, serial_no, payload, document_payload)
  VALUES (v_inv.id, 'agreement', v_serial, v_payload, v_payload)
  RETURNING id INTO v_doc_id;

  -- 4. Audit log
  INSERT INTO public.admin_audit_logs (
    officer_id, executed_action_descriptor, targeted_subsystem_category,
    associated_record_reference_key, detailed_structural_payload_snapshot
  ) VALUES (
    v_uid, 'approve_investment', 'investment_requests', _id,
    jsonb_build_object(
      'amount', v_req.amount,
      'reference_number', v_req.reference_number,
      'document_id', v_doc_id,
      'investor_id', v_inv.id,
      'notes', _notes
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'document_id', v_doc_id,
    'serial_no', v_serial,
    'reference_number', v_req.reference_number,
    'monthly_payout', v_monthly,
    'maturity_total', v_maturity
  );
END $$;

-- 4. Reject RPC
CREATE OR REPLACE FUNCTION public.reject_investment_request(_id UUID, _notes TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_req public.investment_requests;
BEGIN
  IF v_uid IS NULL OR NOT public.is_staff(v_uid) THEN
    RAISE EXCEPTION 'Forbidden: staff only';
  END IF;

  SELECT * INTO v_req FROM public.investment_requests WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Investment request not found'; END IF;

  UPDATE public.investment_requests
     SET status = 'rejected',
         approved_by = v_uid,
         approved_at = now(),
         notes = COALESCE(_notes, notes)
   WHERE id = _id;

  INSERT INTO public.admin_audit_logs (
    officer_id, executed_action_descriptor, targeted_subsystem_category,
    associated_record_reference_key, detailed_structural_payload_snapshot
  ) VALUES (
    v_uid, 'reject_investment', 'investment_requests', _id,
    jsonb_build_object('amount', v_req.amount, 'reference_number', v_req.reference_number, 'notes', _notes)
  );

  RETURN jsonb_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION public.approve_investment_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_investment_request(UUID, TEXT) TO authenticated;
