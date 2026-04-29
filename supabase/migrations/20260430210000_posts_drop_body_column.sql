-- Posts use a single text field `title` for displayed content (no separate description/body).

ALTER TABLE public.posts DROP COLUMN IF EXISTS body;
