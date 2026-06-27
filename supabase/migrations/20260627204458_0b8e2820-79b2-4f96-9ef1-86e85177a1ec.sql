
-- 1. Waitlist columns
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS resend_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS resend_email_status text NOT NULL DEFAULT 'pending';

-- 2. Email templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  subject text NOT NULL,
  html_body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view email templates" ON public.email_templates;
CREATE POLICY "Staff can view email templates"
  ON public.email_templates
  FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER email_templates_touch_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. Seed default approval template
INSERT INTO public.email_templates (name, subject, html_body) VALUES (
  'approval_notification',
  'Your PROFIRA Account Has Been Approved',
  $html$<!doctype html>
<html><body style="margin:0;padding:0;background:#07080a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#07080a;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0B0C10;border:1px solid #1F2024;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 32px 8px;">
          <div style="font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#D61F3A;font-weight:600;">PROFIRA</div>
          <h1 style="margin:16px 0 8px;font-size:24px;line-height:1.2;color:#ffffff;">You're approved, {{name}}.</h1>
          <p style="margin:0;color:#B8B8B8;font-size:15px;line-height:1.55;">Your application to PROFIRA has been approved. Use the temporary code below the first time you sign in.</p>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <div style="background:#07080a;border:1px solid #1F2024;border-radius:12px;padding:20px;text-align:center;">
            <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#B8B8B8;">Temporary Sign-in Code</div>
            <div style="margin-top:8px;font-size:32px;letter-spacing:.4em;font-weight:700;color:#ffffff;">{{tempCode}}</div>
          </div>
        </td></tr>
        <tr><td style="padding:8px 32px 32px;" align="center">
          <a href="{{signinUrl}}" style="display:inline-block;background:#D61F3A;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:999px;">Sign in to PROFIRA &rarr;</a>
          <p style="margin:20px 0 0;color:#B8B8B8;font-size:12px;line-height:1.5;">If the button doesn't work, copy this link:<br/><span style="color:#D8D8D8;word-break:break-all;">{{signinUrl}}</span></p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #1F2024;color:#B8B8B8;font-size:11px;line-height:1.5;">
          You received this email because your waitlist application was approved. If this wasn't you, ignore this message.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>$html$
)
ON CONFLICT (name) DO NOTHING;

-- 4. Public status check function (avoids exposing the table to anon)
CREATE OR REPLACE FUNCTION public.get_waitlist_status(_email text)
RETURNS TABLE(status text, approved_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.status, w.approved_at
  FROM public.waitlist w
  WHERE w.email = lower(trim(_email))::citext
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_waitlist_status(text) TO anon, authenticated;
