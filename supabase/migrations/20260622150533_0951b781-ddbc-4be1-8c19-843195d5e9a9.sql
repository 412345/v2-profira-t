
-- 1. Add investor role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'investor';

-- 2. citext for case-insensitive email
CREATE EXTENSION IF NOT EXISTS citext;

-- 3. Waitlist table
CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email citext NOT NULL UNIQUE,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  source text NOT NULL DEFAULT 'website',
  notes text,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.waitlist TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.waitlist TO authenticated;
GRANT ALL ON public.waitlist TO service_role;

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit waitlist"
  ON public.waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can view waitlist"
  ON public.waitlist FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can update waitlist"
  ON public.waitlist FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can delete waitlist"
  ON public.waitlist FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE TRIGGER waitlist_touch_updated_at
  BEFORE UPDATE ON public.waitlist
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. Email approval helper
CREATE OR REPLACE FUNCTION public.is_email_approved(_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.waitlist
    WHERE email = _email::citext AND status = 'approved'
  )
$$;

-- 5. Block unapproved signups
CREATE OR REPLACE FUNCTION public.prevent_unapproved_signups()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_admin boolean;
BEGIN
  IF public.is_email_approved(NEW.email) THEN
    RETURN NEW;
  END IF;
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO has_admin;
  IF NOT has_admin AND NEW.email = 'aryanreshav8@gmail.com' THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'This email is not approved. Please join the waitlist first.'
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS prevent_unapproved_signups_trg ON auth.users;
CREATE TRIGGER prevent_unapproved_signups_trg
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_unapproved_signups();

-- 6. Default investor role assignment (skip if bootstrap_first_admin already granted admin)
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'investor')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Run AFTER bootstrap_first_admin (alphabetical order in pg triggers; use 'z_' prefix to ensure it runs last)
DROP TRIGGER IF EXISTS z_assign_default_role_trg ON auth.users;
CREATE TRIGGER z_assign_default_role_trg
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

CREATE INDEX IF NOT EXISTS waitlist_status_idx ON public.waitlist (status);
CREATE INDEX IF NOT EXISTS waitlist_source_idx ON public.waitlist (source);
CREATE INDEX IF NOT EXISTS waitlist_created_at_idx ON public.waitlist (created_at DESC);
