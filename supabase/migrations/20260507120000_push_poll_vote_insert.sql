-- Web push: notify poll author when someone casts a vote (INSERT on poll_votes).

CREATE OR REPLACE FUNCTION public.trg_poll_votes_push_dispatch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.dispatch_push_webhook(
    jsonb_build_object(
      'event', 'poll_vote_insert',
      'vote_id', NEW.id::text,
      'actor_user_id',
        CASE WHEN auth.uid() IS NOT NULL THEN auth.uid()::text ELSE NULL END
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS poll_votes_push_dispatch_insert ON public.poll_votes;
CREATE TRIGGER poll_votes_push_dispatch_insert
  AFTER INSERT ON public.poll_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_poll_votes_push_dispatch();

REVOKE ALL ON FUNCTION public.trg_poll_votes_push_dispatch() FROM PUBLIC;
