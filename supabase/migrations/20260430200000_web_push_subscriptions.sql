-- Web push: subscription storage + dispatcher hooks (requires pg_net — enable in Database → Extensions if missing)

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Singleton config: set edge_function_url + hook_secret via SQL Editor after deploying notify-push Edge Function.
-- Leaving null disables HTTP dispatch (subscriptions still persist).
CREATE TABLE IF NOT EXISTS public.push_delivery_config (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  edge_function_url text,
  hook_secret text
);

COMMENT ON TABLE public.push_delivery_config IS
  'Set edge_function_url to https://<project>.supabase.co/functions/v1/notify-push and hook_secret matching Edge Function PUSH_HOOK_SECRET';

INSERT INTO public.push_delivery_config (id, edge_function_url, hook_secret)
VALUES (1, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.push_delivery_config ENABLE ROW LEVEL SECURITY;

-- No authenticated access — only database owner / service role bypasses RLS via SQL Editor
CREATE POLICY push_delivery_config_deny_anon_authenticated
  ON public.push_delivery_config FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

GRANT SELECT ON TABLE public.push_delivery_config TO postgres;

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings (id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  subscription_json jsonb NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_building ON public.push_subscriptions (building_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON public.push_subscriptions (user_id);

COMMENT ON COLUMN public.push_subscriptions.subscription_json IS
  'Browser PushSubscription.toJSON(): {endpoint, expirationTime?, keys:{p256dh, auth}}';

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY push_subscriptions_select_own
  ON public.push_subscriptions FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY push_subscriptions_insert_own
  ON public.push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND building_id IN (
      SELECT bm.building_id FROM public.building_members bm WHERE bm.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY push_subscriptions_update_own
  ON public.push_subscriptions FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND building_id IN (
      SELECT bm.building_id FROM public.building_members bm WHERE bm.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY push_subscriptions_delete_own
  ON public.push_subscriptions FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.push_subscriptions_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.push_subscriptions_set_updated_at();

-- Dispatcher: reads config with definer rights, calls Edge Function with shared secret in header
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

  PERFORM net.http_post(
    url := url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-hook-secret', cfg.hook_secret
    ),
    body := payload,
    timeout_milliseconds := 8000
  );
END;
$$;

REVOKE ALL ON FUNCTION public.dispatch_push_webhook(jsonb) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.trg_posts_push_dispatch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.dispatch_push_webhook(
      jsonb_build_object(
        'event', 'post_insert',
        'post_id', NEW.id::text,
        'actor_user_id',
          CASE WHEN auth.uid() IS NOT NULL THEN auth.uid()::text ELSE NULL END
      )
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF (OLD.status IS DISTINCT FROM NEW.status) OR (OLD.pinned IS DISTINCT FROM NEW.pinned) THEN
      PERFORM public.dispatch_push_webhook(
        jsonb_build_object(
          'event', 'post_update',
          'post_id', NEW.id::text,
          'actor_user_id',
            CASE WHEN auth.uid() IS NOT NULL THEN auth.uid()::text ELSE NULL END,
          'old', to_jsonb(OLD),
          'new', to_jsonb(NEW)
        )
      );
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_push_dispatch_insert ON public.posts;
CREATE TRIGGER posts_push_dispatch_insert
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.trg_posts_push_dispatch();

DROP TRIGGER IF EXISTS posts_push_dispatch_update ON public.posts;
CREATE TRIGGER posts_push_dispatch_update
  AFTER UPDATE OF status, pinned ON public.posts
  FOR EACH ROW
  WHEN (
    OLD.status IS DISTINCT FROM NEW.status
    OR OLD.pinned IS DISTINCT FROM NEW.pinned
  )
  EXECUTE FUNCTION public.trg_posts_push_dispatch();

CREATE OR REPLACE FUNCTION public.trg_comments_push_dispatch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.dispatch_push_webhook(
    jsonb_build_object(
      'event', 'comment_insert',
      'comment_id', NEW.id::text,
      'actor_user_id',
        CASE WHEN auth.uid() IS NOT NULL THEN auth.uid()::text ELSE NULL END
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS comments_push_dispatch_insert ON public.comments;
CREATE TRIGGER comments_push_dispatch_insert
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.trg_comments_push_dispatch();

REVOKE ALL ON FUNCTION public.trg_posts_push_dispatch() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_comments_push_dispatch() FROM PUBLIC;
