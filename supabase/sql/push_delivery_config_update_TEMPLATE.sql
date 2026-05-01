-- Run in Supabase SQL Editor AFTER deploying notify-push.
-- Replace YOUR_PROJECT_REF and use the SAME hook_secret as Supabase Edge secret PUSH_HOOK_SECRET.

UPDATE public.push_delivery_config
SET
  edge_function_url = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-push',
  hook_secret = 'PASTE_PUSH_HOOK_SECRET_FROM_NPM_SCRIPT',
  edge_invoke_jwt = 'PASTE_ANON_PUBLIC_KEY_FROM_SUPABASE_SETTINGS_API'
WHERE id = 1;
