import { createClient } from "@supabase/supabase-js";
import type { EtsyProduct, PublishResult } from "./types";

function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

export async function recentProductIds(days = 21): Promise<Set<string>> {
  const db = client();
  if (!db) return new Set();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data } = await db.from("campaign_posts").select("etsy_listing_id").eq("status", "published").gte("created_at", since);
  return new Set((data || []).map((row) => String(row.etsy_listing_id)));
}

export async function saveRun(runId: string, products: EtsyProduct[], results: PublishResult[], trigger: string) {
  const db = client();
  if (!db) return;
  await db.from("campaign_runs").upsert({ id: runId, trigger, product_count: products.length, status: results.some((r) => r.status === "failed") ? "partial" : "complete" });
  if (results.length) await db.from("campaign_posts").insert(results.map((result) => ({
    run_id: runId,
    platform: result.platform,
    etsy_listing_id: result.productId,
    product_title: result.productTitle,
    status: result.status,
    post_url: result.postUrl || null,
    error: result.error || null,
  })));
}

export async function alreadyRanToday() {
  const db = client();
  if (!db) return false;
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const { data } = await db.from("campaign_runs").select("id").eq("trigger", "schedule").gte("created_at", `${parts}T00:00:00Z`).limit(1);
  return Boolean(data?.length);
}

export async function latestRun() {
  const db = client();
  if (!db) return null;
  const { data: runs, error: runError } = await db
    .from("campaign_runs")
    .select("id, trigger, product_count, status, created_at")
    .order("created_at", { ascending: false })
    .limit(1);
  if (runError) throw new Error(`Run history is unavailable: ${runError.message}`);
  const run = runs?.[0];
  if (!run) return null;
  const { data: posts, error: postError } = await db
    .from("campaign_posts")
    .select("platform, etsy_listing_id, product_title, status, post_url, error, created_at")
    .eq("run_id", run.id)
    .order("created_at", { ascending: true });
  if (postError) throw new Error(`Post history is unavailable: ${postError.message}`);
  return { ...run, posts: posts || [] };
}
