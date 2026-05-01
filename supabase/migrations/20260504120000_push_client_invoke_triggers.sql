-- Regular (attributed) post_insert + comment_insert are invoked from the app after write.
-- Anonymous posts keep a DB trigger so pg_net can still fire without client author proof.

DROP TRIGGER IF EXISTS comments_push_dispatch_insert ON public.comments;

DROP TRIGGER IF EXISTS posts_push_dispatch_insert ON public.posts;

CREATE TRIGGER posts_push_dispatch_insert_anonymous_only
  AFTER INSERT ON public.posts
  FOR EACH ROW
  WHEN (NEW.is_anonymous = true)
  EXECUTE FUNCTION public.trg_posts_push_dispatch();
