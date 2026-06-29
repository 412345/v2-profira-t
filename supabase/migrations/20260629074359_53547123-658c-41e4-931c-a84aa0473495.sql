ALTER TABLE public.investment_requests
  ADD COLUMN IF NOT EXISTS confirmation_email_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz;