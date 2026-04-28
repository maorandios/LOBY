# Web push notifications (production checklist)

Notifications are scoped per building subscription row; the Edge Function `notify-push` sends pushes when posts, comments, or status/pin updates occur.

## Fast path (you only paste keys in Vercel + Supabase)

1. In this repo, install deps and generate keys (prints a full SQL snippet with the hook secret already filled):

   ```bash
   npm install
   npm run generate:push-secrets
   ```

2. **Vercel** → your project → **Settings → Environment Variables**  
   Add exactly: **`VITE_VAPID_PUBLIC_KEY`** = the public key line from the script output. Redeploy.

3. **Supabase** → **Edge Functions → Secrets**  
   Add exactly: **`VAPID_PUBLIC_KEY`**, **`VAPID_PRIVATE_KEY`**, **`PUSH_HOOK_SECRET`** (same values the script printed).  
   Optional: **`PUBLIC_APP_ORIGIN`** = your live site URL (e.g. `https://xxx.vercel.app`) so notification taps open the app.

4. Deploy the function (Supabase CLI linked to this project):

   ```bash
   supabase functions deploy notify-push --project-ref YOUR_PROJECT_REF
   ```

5. **Supabase → SQL Editor** — run the **`UPDATE public.push_delivery_config`** block the script printed (or edit `supabase/sql/push_delivery_config_update_TEMPLATE.sql`).

6. **Database → Extensions** — ensure **pg_net** is enabled.

---

## Manual / alternative: VAPID without the script

Generate a key pair:

```bash
npx web-push generate-vapid-keys
```

- **Public key**: add to your **hosting env** as `VITE_VAPID_PUBLIC_KEY` (Vite exposes it to the browser).
- **Private key**: never commit. Set as a **Supabase Edge Function secret** (Dashboard → Edge Functions → Secrets or CLI):

```bash
supabase secrets set VAPID_PUBLIC_KEY="<public-from-cli>" \
  VAPID_PRIVATE_KEY="<private-from-cli>" \
  PUSH_HOOK_SECRET="<long-random-secret-min-16-chars>" \
  VAPID_CONTACT_MAILTO="mailto:you@yourdomain.com"
```

`PUSH_HOOK_SECRET` must match the value you store in the database (below).

Optional: set `PUBLIC_APP_ORIGIN` or `SITE_URL` to your deployed PWA origin (e.g. `https://app.example.com`) so notification clicks open the correct host.

## 2. Enable `pg_net`

In Supabase **Database → Extensions**, enable **pg_net** if the migration did not create it (some projects require toggling it on once).

## 3. Wire the dispatcher URL

After deploying the function, run in the **SQL Editor** (replace placeholders):

```sql
UPDATE public.push_delivery_config
SET
  edge_function_url = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-push',
  hook_secret = 'THE_SAME_PUSH_HOOK_SECRET_AS_ABOVE'
WHERE id = 1;
```

Leave both `NULL` to disable outbound HTTP dispatch (subscriptions can still be stored).

## 4. Deploy the Edge Function

```bash
supabase functions deploy notify-push --project-ref YOUR_PROJECT_REF
```

## 5. HTTPS and PWA

Web Push requires a **secure context** (`https://` or `http://localhost`). The app registers `public/sw.js` automatically.

---

**Spam avoidance**: Notifications are emitted only on the events mapped in `notify-push`; the client never triggers sends directly without the shared hook secret stored only on Supabase.
