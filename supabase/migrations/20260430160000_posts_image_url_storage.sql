-- Posts: remove location; replace has_image boolean with image_url (public URL from storage).
-- Storage: post-images bucket + policies so members upload only under their building_id/ folder.

ALTER TABLE public.posts DROP COLUMN IF EXISTS location;
ALTER TABLE public.posts DROP COLUMN IF EXISTS has_image;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN public.posts.image_url IS 'Public URL from Supabase Storage post-images bucket; null if no image.';

-- Storage bucket (public read via URL; uploads restricted by policy)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS post_images_insert_member ON storage.objects;
CREATE POLICY post_images_insert_member
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'post-images'
    AND EXISTS (
      SELECT 1 FROM public.building_members bm
      WHERE bm.user_id = (SELECT auth.uid())
        AND bm.building_id = split_part(name, '/', 1)::uuid
    )
  );

DROP POLICY IF EXISTS post_images_select_member ON storage.objects;
CREATE POLICY post_images_select_member
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'post-images'
    AND EXISTS (
      SELECT 1 FROM public.building_members bm
      WHERE bm.user_id = (SELECT auth.uid())
        AND bm.building_id = split_part(name, '/', 1)::uuid
    )
  );

DROP POLICY IF EXISTS post_images_update_member ON storage.objects;
CREATE POLICY post_images_update_member
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'post-images'
    AND EXISTS (
      SELECT 1 FROM public.building_members bm
      WHERE bm.user_id = (SELECT auth.uid())
        AND bm.building_id = split_part(name, '/', 1)::uuid
    )
  );

DROP POLICY IF EXISTS post_images_delete_member ON storage.objects;
CREATE POLICY post_images_delete_member
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'post-images'
    AND EXISTS (
      SELECT 1 FROM public.building_members bm
      WHERE bm.user_id = (SELECT auth.uid())
        AND bm.building_id = split_part(name, '/', 1)::uuid
    )
  );
