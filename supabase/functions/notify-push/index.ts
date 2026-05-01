/**
 * Internal web push sender (invoked by Postgres trigger via pg_net or manually).
 * Required secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, PUSH_HOOK_SECRET,
 * optional VAPID_CONTACT_MAILTO (default mailto:notify@example.com)
 *
 * Do not expose PUSH_HOOK_SECRET or VAPID private key to the client.
 */

import { createClient } from "npm:@supabase/supabase-js@2.49.8";
import webpush from "npm:web-push@3.6.7";

type Supabase = ReturnType<typeof createClient>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-push-hook-secret",
};

type Json = Record<string, unknown>;

interface PostRow {
  id: string;
  building_id: string;
  author_id: string | null;
  type: string;
  status: string;
  title: string;
  pinned?: boolean;
}

function truncate(s: string, n: number): string {
  const t = s.trim();
  if (t.length <= n) return t;
  return t.slice(0, n - 1) + "…";
}

function statusHe(status: string): string {
  switch (status) {
    case "open":
      return "פתוח";
    case "in_progress":
      return "בטיפול";
    case "closed":
      return "נסגר";
    default:
      return status;
  }
}

function postUrl(postId: string, origin: string): string {
  return `${origin.replace(/\/$/, "")}/post/${postId}`;
}

async function removeDeadSubscription(
  sb: Supabase,
  id: string,
): Promise<void> {
  await sb.from("push_subscriptions").delete().eq("id", id);
}

async function sendToUsers(
  sb: Supabase,
  userIds: string[],
  buildingId: string,
  title: string,
  body: string,
  data: Json,
): Promise<void> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return;

  const { data: subs, error } = await sb
    .from("push_subscriptions")
    .select("id, user_id, endpoint, subscription_json")
    .eq("building_id", buildingId)
    .in("user_id", unique);

  if (error) {
    console.error("[notify-push] load subscriptions", error);
    return;
  }

  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
  const contact = Deno.env.get("VAPID_CONTACT_MAILTO") ??
    "mailto:support@localhost";

  if (!vapidPublic || !vapidPrivate) {
    console.error("[notify-push] missing VAPID keys");
    return;
  }

  webpush.setVapidDetails(contact, vapidPublic, vapidPrivate);

  const payload = JSON.stringify({
    title,
    body,
    data,
  });

  for (const row of subs ?? []) {
    const sid = row.id as string;
    const subUnknown = row.subscription_json as unknown;
    if (!subUnknown || typeof subUnknown !== "object") continue;

    const sub = subUnknown as Parameters<typeof webpush.sendNotification>[0];
    try {
      await webpush.sendNotification(sub, payload, {
        TTL: 3600,
      });
    } catch (e: unknown) {
      const statusCode = (e as { statusCode?: number })?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        await removeDeadSubscription(sb, sid);
      } else {
        console.error("[notify-push] send fail", e);
      }
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const hook = req.headers.get("x-push-hook-secret");
  const secret = Deno.env.get("PUSH_HOOK_SECRET") ?? "";
  if (!secret || hook !== secret) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ ok: false, error: "missing_env" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: Json;
  try {
    body = (await req.json()) as Json;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const appOrigin = (Deno.env.get("PUBLIC_APP_ORIGIN") ?? Deno.env.get("SITE_URL") ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );

  const ev = body["event"] as string | undefined;

  try {
    if (ev === "post_insert") {
      const postId = body["post_id"] as string | undefined;
      if (!postId) throw new Error("post_id");

      const { data: post, error: pErr } = await sb.from("posts").select(
        "id, building_id, author_id, type, status, title, pinned",
      ).eq("id", postId).maybeSingle();
      if (pErr || !post) throw pErr ?? new Error("post");

      const prow = post as PostRow;
      const authorId = prow.author_id;

      const { data: members } = await sb.from("building_members").select(
        "user_id",
      ).eq("building_id", prow.building_id);

      const userIds = (members ?? [])
        .map((m: { user_id: string }) => m.user_id)
        .filter((uid: string) => authorId == null || uid !== authorId);

      if (prow.type === "poll") {
        await sendToUsers(
          sb,
          userIds,
          prow.building_id,
          "סקר חדש בבניין",
          truncate(prow.title, 140),
          { url: postUrl(postId, appOrigin), postId },
        );
      } else {
        await sendToUsers(
          sb,
          userIds,
          prow.building_id,
          "פוסט חדש בבניין",
          truncate(prow.title, 140),
          { url: postUrl(postId, appOrigin), postId },
        );
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ev === "comment_insert") {
      const commentId = body["comment_id"] as string | undefined;
      if (!commentId) throw new Error("comment_id");

      const { data: comment, error: cErr } = await sb.from("comments").select(
        "id, post_id, author_id",
      ).eq("id", commentId).maybeSingle();
      if (cErr || !comment) throw cErr ?? new Error("comment");

      const { data: post, error: pErr } = await sb.from("posts").select(
        "id, building_id, author_id",
      ).eq("id", comment.post_id as string).maybeSingle();
      if (pErr || !post) throw pErr ?? new Error("post");

      const postAuthor = post.author_id as string | null;
      const commentAuthor = comment.author_id as string;

      if (postAuthor && postAuthor === commentAuthor) {
        return new Response(JSON.stringify({ ok: true, skipped: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (postAuthor) {
        await sendToUsers(sb, [postAuthor], post.building_id as string, "תגובה חדשה לפוסט שלך", "פתחו לצפייה בהודעות", {
          url: postUrl(comment.post_id as string, appOrigin),
          postId: comment.post_id as string,
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ev === "post_update") {
      const newRow = body["new"] as PostRow | undefined;
      const oldRow = body["old"] as PostRow | undefined;
      const actorStr = body["actor_user_id"] as string | undefined;

      if (!newRow || !oldRow) throw new Error("old/new rows");

      const prevPinned = Boolean(oldRow.pinned);
      const nextPinned = Boolean(newRow.pinned);

      // Report status change → notify report author only (no author for anonymous posts)
      if (
        newRow.type === "report" &&
        oldRow.status !== newRow.status &&
        newRow.author_id
      ) {
        await sendToUsers(
          sb,
          [newRow.author_id],
          newRow.building_id,
          "עדכון סטטוס לדיווח",
          `הסטטוס השתנה ל${statusHe(newRow.status)} · ${truncate(newRow.title, 80)}`,
          {
            url: postUrl(newRow.id, appOrigin),
            postId: newRow.id,
          },
        );
      }

      // Pinned announcement
      if (
        prevPinned === false &&
        nextPinned === true &&
        actorStr != null &&
        actorStr.length > 0
      ) {
        const { data: members } = await sb.from("building_members").select(
          "user_id",
        ).eq("building_id", newRow.building_id);

        const userIds = (members ?? [])
          .map((m: { user_id: string }) => m.user_id)
          .filter((uid: string) => uid !== actorStr);

        await sendToUsers(
          sb,
          userIds,
          newRow.building_id,
          "הודעה חשובה נעוצה",
          truncate(newRow.title, 140),
          { url: postUrl(newRow.id, appOrigin), postId: newRow.id },
        );
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: false, error: "unknown_event" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[notify-push]", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
