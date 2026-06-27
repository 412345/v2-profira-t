
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

DO $$
DECLARE v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'adminprofira@gmail.com';
  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_uid, 'authenticated', 'authenticated',
      'adminprofira@gmail.com',
      crypt('profirarnc@1416', gen_salt('bf')),
      now(),
      jsonb_build_object('provider','email','providers',ARRAY['email']),
      jsonb_build_object('full_name','PROFIRA Admin'),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'adminprofira@gmail.com', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  END IF;

  INSERT INTO public.profiles (id, full_name, email)
  VALUES (v_uid, 'PROFIRA Admin', 'adminprofira@gmail.com')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

INSERT INTO public.waitlist (email, name, phone, status, source)
VALUES ('adminprofira@gmail.com', 'PROFIRA Admin', 'N/A', 'approved', 'bootstrap')
ON CONFLICT (email) DO UPDATE SET status = 'approved';

DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id IN (SELECT id FROM auth.users WHERE email = 'aryanreshav8@gmail.com');
