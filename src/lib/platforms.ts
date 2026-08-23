import crypto from "node:crypto";
import OAuth from "oauth-1.0a";
import { createCopy } from "./copy";
import type { EtsyProduct, Platform, PublishResult } from "./types";

async function jsonFetch(url: string, init: RequestInit, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(url, init);
    const text = await response.text();
    let body: Record<string, unknown> = {};
    try { body = JSON.parse(text); } catch { body = { message: text }; }
    if (response.ok) return body;
    const metaError = body.error as { code?: number; is_transient?: boolean } | undefined;
    const retryable = response.status === 429 || response.status >= 500 || metaError?.is_transient || [1, 2, 4, 17, 32, 341, 613].includes(metaError?.code || 0);
    if (!retryable || attempt === retries) throw new Error(`${response.status}: ${JSON.stringify(body)}`);
    await new Promise((resolve) => setTimeout(resolve, 1800 * (attempt + 1)));
  }
  throw new Error("The platform request failed.");
}

function metaUrl(path: string) {
  const version = process.env.META_GRAPH_VERSION || "v24.0";
  return `https://graph.facebook.com/${version}/${path}`;
}

async function instagram(product: EtsyProduct) {
  const userId = process.env.INSTAGRAM_USER_ID!;
  const token = process.env.META_ACCESS_TOKEN!;
  const copy = createCopy(product, "instagram");
  const container = await jsonFetch(metaUrl(`${userId}/media`), { method: "POST", body: new URLSearchParams({ image_url: product.imageUrl, caption: copy.caption, access_token: token }) });
  const creationId = String(container.id);
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const check = await jsonFetch(metaUrl(`${creationId}?fields=status_code,status&access_token=${encodeURIComponent(token)}`), { method: "GET" });
    if (check.status_code === "FINISHED") break;
    if (check.status_code === "ERROR" || check.status_code === "EXPIRED") throw new Error(`Instagram could not prepare the image: ${String(check.status || check.status_code)}`);
    if (attempt === 14) throw new Error("Instagram did not finish preparing the image within 45 seconds.");
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  const published = await jsonFetch(metaUrl(`${userId}/media_publish`), { method: "POST", body: new URLSearchParams({ creation_id: creationId, access_token: token }) });
  const media = await jsonFetch(metaUrl(`${String(published.id)}?fields=permalink&access_token=${encodeURIComponent(token)}`), { method: "GET" });
  return String(media.permalink || `instagram-media:${published.id}`);
}

async function facebook(product: EtsyProduct) {
  const pageId = process.env.FACEBOOK_PAGE_ID!;
  const token = process.env.META_ACCESS_TOKEN!;
  const copy = createCopy(product, "facebook");
  const post = await jsonFetch(metaUrl(`${pageId}/photos`), { method: "POST", body: new URLSearchParams({ url: product.imageUrl, caption: copy.caption, access_token: token, published: "true" }) });
  return `https://www.facebook.com/${post.post_id || post.id || ""}`;
}

async function pinterest(product: EtsyProduct) {
  const copy = createCopy(product, "pinterest");
  const pin = await jsonFetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.PINTEREST_ACCESS_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ board_id: process.env.PINTEREST_BOARD_ID, title: copy.title, description: copy.description, link: product.url, media_source: { source_type: "image_url", url: product.imageUrl } }),
  });
  return `https://www.pinterest.com/pin/${pin.id}`;
}

function oauthClient() {
  return new OAuth({ consumer: { key: process.env.X_API_KEY!, secret: process.env.X_API_SECRET! }, signature_method: "HMAC-SHA1", hash_function(base, key) { return crypto.createHmac("sha1", key).update(base).digest("base64"); } });
}

async function x(product: EtsyProduct) {
  const oauth = oauthClient();
  const token = { key: process.env.X_ACCESS_TOKEN!, secret: process.env.X_ACCESS_TOKEN_SECRET! };
  const imageResponse = await fetch(product.imageUrl);
  if (!imageResponse.ok) throw new Error("The Etsy image could not be downloaded for X.");
  const imageBytes = await imageResponse.arrayBuffer();
  const imageType = imageResponse.headers.get("content-type") || "image/jpeg";
  const extension = imageType.includes("png") ? "png" : imageType.includes("webp") ? "webp" : "jpg";
  const form = new FormData();
  form.append("media", new Blob([imageBytes], { type: imageType }), `etsy-${product.id}.${extension}`);
  const uploadUrl = "https://upload.twitter.com/1.1/media/upload.json";
  const uploadHeaders = { Authorization: oauth.toHeader(oauth.authorize({ url: uploadUrl, method: "POST" }, token)).Authorization };
  const upload = await jsonFetch(uploadUrl, { method: "POST", headers: uploadHeaders, body: form });
  const tweetUrl = "https://api.x.com/2/tweets";
  const tweetHeaders = { Authorization: oauth.toHeader(oauth.authorize({ url: tweetUrl, method: "POST" }, token)).Authorization };
  const tweet = await jsonFetch(tweetUrl, { method: "POST", headers: { ...tweetHeaders, "content-type": "application/json" }, body: JSON.stringify({ text: createCopy(product, "x").caption, media: { media_ids: [String(upload.media_id_string)] } }) });
  const data = tweet.data as { id?: string } | undefined;
  return `https://x.com/newforest3d/status/${data?.id}`;
}

async function tiktok(product: EtsyProduct) {
  const copy = createCopy(product, "tiktok");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!.replace(/\/$/, "");
  const post = await jsonFetch("https://open.tiktokapis.com/v2/post/publish/content/init/", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.TIKTOK_ACCESS_TOKEN}`, "content-type": "application/json; charset=UTF-8" },
    body: JSON.stringify({
      media_type: "PHOTO",
      post_mode: "DIRECT_POST",
      post_info: { title: copy.title.slice(0, 90), description: `${copy.description}\n${product.url}\n${copy.hashtags.join(" ")}`, privacy_level: process.env.TIKTOK_PRIVACY_LEVEL || "SELF_ONLY", disable_comment: false, auto_add_music: true, brand_content_toggle: false, brand_organic_toggle: true },
      source_info: { source: "PULL_FROM_URL", photo_images: [`${appUrl}/api/media/${product.id}`], photo_cover_index: 0 },
    }),
  });
  const data = post.data as { publish_id?: string } | undefined;
  return `tiktok-publish:${data?.publish_id}`;
}

const publishers: Record<Platform, (product: EtsyProduct) => Promise<string>> = { instagram, pinterest, facebook, x, tiktok };

export async function publish(platform: Platform, product: EtsyProduct): Promise<PublishResult> {
  try {
    const postUrl = await publishers[platform](product);
    return { platform, productId: product.id, productTitle: product.title, status: "published", postUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown publication error";
    console.error("Publication failed", { platform, productId: product.id, productTitle: product.title, error: message });
    return { platform, productId: product.id, productTitle: product.title, status: "failed", error: message };
  }
}

export function configuration() {
  const requirements: Record<Platform, string[]> = {
    instagram: ["META_ACCESS_TOKEN", "INSTAGRAM_USER_ID"],
    pinterest: ["PINTEREST_ACCESS_TOKEN", "PINTEREST_BOARD_ID"],
    facebook: ["META_ACCESS_TOKEN", "FACEBOOK_PAGE_ID"],
    x: ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"],
    tiktok: ["TIKTOK_ACCESS_TOKEN", "NEXT_PUBLIC_APP_URL"],
  };
  return Object.fromEntries(Object.entries(requirements).map(([platform, names]) => [platform, { configured: names.every((name) => Boolean(process.env[name])), missing: names.filter((name) => !process.env[name]) }]));
}
