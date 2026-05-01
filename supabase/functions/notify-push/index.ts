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

function parseWebPushSubscription(
  endpointColumn: string,
  jsonUnknown: unknown,
): Parameters<typeof webpush.sendNotification>[0] | null {
  if (!jsonUnknown || typeof jsonUnknown !== "object") return null;
  const j = jsonUnknown as Record<string, unknown>;
  const endpoint =
    typeof j.endpoint === "string" && j.endpoint.length > 0
      ? j.endpoint
      : endpointColumn;
  if (!endpoint) return null;
  const keysRaw = j.keys;
  if (!keysRaw || typeof keysRaw !== "object") return null;
  const keys = keysRaw as Record<string, unknown>;
  const p256dh = keys.p256dh;
  const auth = keys.auth;
  if (typeof p256dh !== "string" || typeof auth !== "string") return null;
  if (!p256dh.length || !auth.length) return null;
  const out: Parameters<typeof webpush.sendNotification>[0] = {
    endpoint,
    keys: { p256dh, auth },
  };
  if (typeof j.expirationTime === "number") {
    out.expirationTime = j.expirationTime;
  }
  return out;
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

  console.log(
    `[notify-push] building=${buildingId} target_users=${unique.length} subscription_rows=${subs?.length ?? 0}`,
  );
  if (unique.length > 0 && (subs?.length ?? 0) === 0) {
    console.warn(
      "[notify-push] no subscription rows for these users in this building",
    );
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

  let skippedBadJson = 0;
  let sendOk = 0;
  let sendFail = 0;

  for (const row of subs ?? []) {
    const sid = row.id as string;
    const sub = parseWebPushSubscription(
      String(row.endpoint ?? ""),
      row.subscription_json,
    );
    if (!sub) {
      skippedBadJson++;
      console.warn("[notify-push] skip row missing keys", sid);
      continue;
    }
    const isApple = sub.endpoint.includes("web.push.apple.com");
    try {
      const res = await webpush.sendNotification(sub, payload, {
        TTL: 3600,
        // Apple ignores urgency=low, web-push lib defaults are fine; explicit `high` helps some browsers.
        urgency: "high",
      });
      sendOk++;
      console.log(
        "[notify-push] send ok",
        isApple ? "apple" : "other",
        (res as { statusCode?: number })?.statusCode,
        sid,
      );
    } catch (e: unknown) {
      sendFail++;
      const statusCode = (e as { statusCode?: number })?.statusCode;
      const errBody = (e as { body?: string })?.body;
      if (statusCode === 410 || statusCode === 404) {
        console.warn(
          "[notify-push] removed gone",
          isApple ? "apple" : "other",
          statusCode,
          sid,
        );
        await removeDeadSubscription(sb, sid);
      } else {
        console.error(
          "[notify-push] send fail",
          isApple ? "apple" : "other",
          statusCode,
          errBody ?? "",
          e,
        );
      }
    }
  }

  if (skippedBadJson > 0 || sendFail > 0) {
    console.log(
      `[notify-push] send summary ok=${sendOk} fail=${sendFail} skipped=${skippedBadJson}`,
    );
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

  const hook = req.headers.get("x-push-hook-secret");
  const secret = Deno.env.get("PUSH_HOOK_SECRET") ?? "";
  const hookOk = Boolean(secret && hook === secret);

  if (!hookOk) {
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!anonKey || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userSb = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: authErr,
    } = await userSb.auth.getUser();
    if (authErr || !user?.id) {
      return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const evPre = body["event"] as string | undefined;
    if (evPre === "comment_insert") {
      const cid = body["comment_id"] as string | undefined;
      if (!cid) {
        return new Response(JSON.stringify({ ok: false, error: "comment_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: c } = await sb.from("comments").select("author_id").eq("id", cid).maybeSingle();
      if (!c || c.author_id !== user.id) {
        return new Response(JSON.stringify({ ok: false, error: "forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (evPre === "post_insert") {
      const pid = body["post_id"] as string | undefined;
      if (!pid) {
        return new Response(JSON.stringify({ ok: false, error: "post_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: p } = await sb.from("posts").select("author_id").eq("id", pid).maybeSingle();
      if (!p || p.author_id !== user.id) {
        return new Response(JSON.stringify({ ok: false, error: "forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      return new Response(
        JSON.stringify({ ok: false, error: "invalid_client_event" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  }

  const appOrigin = (Deno.env.get("PUBLIC_APP_ORIGIN") ?? Deno.env.get("SITE_URL") ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );

  const ev = body["event"] as string | undefined;
  console.log("[notify-push] event", ev ?? "(none)", hookOk ? "hook" : "client");

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

      console.log("[notify-push] post_insert", {
        postId,
        authorId,
        buildingId: prow.building_id,
        memberCount: (members ?? []).length,
        recipientCount: userIds.length,
      });

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

      console.log("[notify-push] comment_insert", {
        postId: comment.post_id,
        postAuthor,
        commentAuthor,
        buildingId: post.building_id,
      });

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
      } else {
        // Anonymous posts do not store author_id — notify other building members (except commenter).
        const { data: members } = await sb.from("building_members").select(
          "user_id",
        ).eq("building_id", post.building_id as string);

        const userIds = (members ?? [])
          .map((m: { user_id: string }) => m.user_id)
          .filter((uid: string) => uid !== commentAuthor);

        await sendToUsers(
          sb,
          userIds,
          post.building_id as string,
          "תגובה חדשה בפוסט אנונימי בבניין",
          "פתחו לצפייה בהודעות",
          {
            url: postUrl(comment.post_id as string, appOrigin),
            postId: comment.post_id as string,
          },
        );
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
