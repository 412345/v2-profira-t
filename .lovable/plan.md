## Goal
Make `adminprofira@gmail.com` the only bootstrap-allowed admin email, and create the auth user with password `profirarnc@1416` assigned the `admin` role.

## Changes

### 1. Migration: update `prevent_unapproved_signups` bootstrap email
Replace the hardcoded `aryanreshav8@gmail.com` fallback with `adminprofira@gmail.com` so only that email can sign up when no admin exists yet.

```sql
CREATE OR REPLACE FUNCTION public.prevent_unapproved_signups()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE has_admin boolean;
BEGIN
  IF public.is_email_approved(NEW.email) THEN RETURN NEW; END IF;
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO has_admin;
  IF NOT has_admin AND NEW.email = 'adminprofira@gmail.com' THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'This email is not approved. Please join the waitlist first.'
    USING ERRCODE = 'check_violation';
END;
$$;
```

### 2. Migration: provision the admin user
Use `auth.admin` via a one-shot SQL block (pgcrypto + direct insert into `auth.users`) OR — preferred — run a server-side bootstrap using the service role:

- Insert/confirm user `adminprofira@gmail.com` with password `profirarnc@1416` (email pre-confirmed).
- Insert into `public.waitlist` as `approved` (so future re-signups also pass).
- Insert `('admin')` row into `public.user_roles` for that user id.
- Also insert the matching `public.profiles` row if the trigger doesn't fire.

### 3. Optional cleanup
If `aryanreshav8@gmail.com` currently has an `admin` role row and you want it revoked, remove that row in the same migration. (Tell me yes/no.)

## Security note
Password `profirarnc@1416` is now visible in this chat. After first login I recommend rotating it from the account's profile settings.

## Questions before I implement
1. Revoke admin from `aryanreshav8@gmail.com`? (yes / no / keep both as admin)
2. Should `adminprofira@gmail.com` be the *only* allowed admin going forward (block future bootstrap), or keep the "first admin" fallback in place for this one email?
