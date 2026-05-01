-- pg_net calls to Supabase Edge Functions often fail at the API gateway with 401
-- when no Authorization/apikey JWT is sent (verify_jwt is easy to leave enabled on deploy).
-- Store the project anon key here so dispatch can attach standard Supabase client headers.

ALTER TABLE public.push_delivery_config
  ADD COLUMN IF NOT EXISTS edge_invoke_jwt text;

COMMENT ON COLUMN public.push_delivery_config.edge_invoke_jwt IS
  'Optional. Paste the project anon public key (JWT) from Supabase Settings → API. '
  'When set, dispatch_push_webhook adds Authorization: Bearer … and apikey so pg_net can reach notify-push.';

CREATE OR REPLACE FUNCTION public.dispatch_push_webhook(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  cfg public.push_delivery_config%ROWTYPE;
  url text;
  jwt text;
  hdr jsonb;
BEGIN
  SELECT * INTO cfg FROM public.push_delivery_config WHERE id = 1;
  IF cfg IS NULL THEN
    RETURN;
  END IF;
  url := nullif(trim(cfg.edge_function_url), '');
  IF url IS NULL THEN
    RETURN;
  END IF;
  IF cfg.hook_secret IS NULL OR length(trim(cfg.hook_secret)) < 16 THEN
    RETURN;
  END IF;

  hdr := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-push-hook-secret', trim(cfg.hook_secret)
  );

  jwt := nullif(trim(cfg.edge_invoke_jwt), '');
  IF jwt IS NOT NULL THEN
    hdr := hdr || jsonb_build_object(
      'Authorization', 'Bearer ' || jwt,
      'apikey', jwt
    );
  END IF;

  PERFORM net.http_post(
    url := url,
    headers := hdr,
    body := payload,
    timeout_milliseconds := 8000
  );
END;
$$;
