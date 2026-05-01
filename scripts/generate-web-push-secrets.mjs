/**
 * Prints VAPID keys + PUSH_HOOK_SECRET for Vercel and Supabase dashboards.
 * Run: npm run generate:push-secrets
 */
import { randomBytes } from 'node:crypto'
import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()
const hookSecret = randomBytes(32).toString('base64url')

const line = (s) => console.log(s)

line('')
line('=== LOBY Web Push — copy into dashboards (do not commit this output) ===')
line('')
line('--- Vercel → Project → Settings → Environment Variables (Production + Preview) ---')
line('')
line(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}`)
line('')
line('--- Supabase → Project Settings → Edge Functions → Secrets ---')
line('')
line(`VAPID_PUBLIC_KEY=${keys.publicKey}`)
line(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
line(`PUSH_HOOK_SECRET=${hookSecret}`)
line('')
line('Optional (notification click opens your real domain):')
line('PUBLIC_APP_ORIGIN=https://YOUR_VERCEL_APP.vercel.app')
line('')
line('--- Supabase → SQL Editor (replace YOUR_PROJECT_REF; use SAME hook secret as above) ---')
line('')
line(`UPDATE public.push_delivery_config`)
line(`SET`)
line(`  edge_function_url = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-push',`)
line(`  hook_secret = '${hookSecret}',`)
line(`  edge_invoke_jwt = 'PASTE_PROJECT_ANON_KEY_FROM_SUPABASE_SETTINGS_API'`)
line(`WHERE id = 1;`)
line('')
line('(edge_invoke_jwt = anon public JWT lets Postgres pg_net pass the Edge API gateway;')
line('or disable JWT on the function in Dashboard / deploy with --no-verify-jwt — see PUSH_SETUP.md.)')
line('')
line('--- Then deploy Edge Function (Supabase CLI, from this repo) ---')
line('')
line('supabase functions deploy notify-push --project-ref YOUR_PROJECT_REF --no-verify-jwt')
line('')
line('Also ensure: Database → Extensions → pg_net is ON.')
line('')
