-- Restore reliable server-side push delivery for all posts and comments.
-- pg_net is verified working in production; client-side invoke is fragile on
-- older mobile browsers (e.g. iOS 15 Safari aborts fetch on navigation).

DROP TRIGGER IF EXISTS posts_push_dispatch_insert_anonymous_only ON public.posts;

DROP TRIGGER IF EXISTS posts_push_dispatch_insert ON public.posts;

CREATE TRIGGER posts_push_dispatch_insert
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.trg_posts_push_dispatch();

DROP TRIGGER IF EXISTS comments_push_dispatch_insert ON public.comments;

CREATE TRIGGER comments_push_dispatch_insert
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.trg_comments_push_dispatch();
