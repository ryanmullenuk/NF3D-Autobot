import type { EtsyProduct } from "./types";

type EtsyMoney = { amount: number; divisor: number; currency_code: string };
type EtsyListing = {
  listing_id: number;
  title: string;
  description: string;
  url: string;
  tags?: string[];
  price: EtsyMoney;
  converted_price?: EtsyMoney;
  listing_type?: string;
  type?: string;
  is_digital?: boolean;
};

const api = "https://openapi.etsy.com/v3/application";

function headers(accessToken?: string) {
  const key = process.env.ETSY_API_KEY;
  if (!key) throw new Error("ETSY_API_KEY is not configured.");
  const values: Record<string, string> = { "x-api-key": key };
  if (accessToken) values.authorization = `Bearer ${accessToken}`;
  return values;
}

async function etsyFetch<T>(path: string, accessToken?: string): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${api}${path}`, { headers: headers(accessToken), cache: "no-store" });
    if (response.ok) return response.json() as Promise<T>;
    const message = await response.text();
    if (response.status !== 429 || attempt === 3) throw new Error(`Etsy returned ${response.status}: ${message}`);
    const retryAfter = Number(response.headers.get("retry-after"));
    await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1200 * (attempt + 1)));
  }
  throw new Error("Etsy catalogue request failed.");
}

async function catalogueAccessToken() {
  const key = process.env.ETSY_API_KEY;
  const refreshToken = process.env.ETSY_REFRESH_TOKEN;
  if (!key) throw new Error("ETSY_API_KEY is not configured.");
  if (!refreshToken) throw new Error("ETSY_REFRESH_TOKEN is not configured.");
  const response = await fetch("https://api.etsy.com/v3/public/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", client_id: key.split(":")[0], refresh_token: refreshToken }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Etsy authentication returned ${response.status}: ${await response.text()}`);
  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error("Etsy did not return a catalogue access token.");
  return data.access_token;
}

function formatMoney(value: EtsyMoney) {
  const amount = value.amount / value.divisor;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: value.currency_code }).format(amount);
}

async function primaryImage(listingId: number, accessToken?: string) {
  const data = await etsyFetch<{ results: Array<{ rank: number; url_fullxfull: string; url_570xN: string }> }>(`/listings/${listingId}/images`, accessToken);
  const image = [...data.results].sort((a, b) => a.rank - b.rank)[0];
  if (!image) throw new Error(`Listing ${listingId} has no public Etsy image.`);
  return image.url_fullxfull || image.url_570xN;
}

function productType(listing: EtsyListing): EtsyProduct["type"] {
  const digital = listing.is_digital || listing.type === "download" || listing.listing_type === "download";
  return digital ? "Digital download" : "Physical product";
}

function normalise(listing: EtsyListing): EtsyProduct {
  const money = listing.converted_price?.currency_code === "GBP" ? listing.converted_price : listing.price;
  return {
    id: String(listing.listing_id),
    title: listing.title.trim(),
    description: listing.description.trim(),
    price: formatMoney(money),
    currency: money.currency_code,
    type: productType(listing),
    url: listing.url.split("?")[0],
    imageUrl: "",
    tags: listing.tags || [],
  };
}

export async function getActiveProducts(): Promise<EtsyProduct[]> {
  const shopId = process.env.ETSY_SHOP_ID;
  if (!shopId) throw new Error("ETSY_SHOP_ID is not configured.");
  const accessToken = await catalogueAccessToken();
  const first = await etsyFetch<{ count: number; results: EtsyListing[] }>(`/shops/${shopId}/listings?state=active&limit=100&offset=0`, accessToken);
  const listings = [...first.results];
  for (let offset = 100; offset < first.count; offset += 100) {
    const page = await etsyFetch<{ results: EtsyListing[] }>(`/shops/${shopId}/listings?state=active&limit=100&offset=${offset}`, accessToken);
    listings.push(...page.results);
  }
  return listings.map(normalise);
}

export async function addPrimaryImages(products: EtsyProduct[]): Promise<EtsyProduct[]> {
  const accessToken = await catalogueAccessToken();
  const hydrated: EtsyProduct[] = [];
  for (const product of products) {
    hydrated.push({ ...product, imageUrl: await primaryImage(Number(product.id), accessToken) });
    if (products.length > 1) await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return hydrated;
}

export async function getProductById(id: string): Promise<EtsyProduct> {
  const accessToken = await catalogueAccessToken();
  const listing = await etsyFetch<EtsyListing>(`/listings/${encodeURIComponent(id)}`, accessToken);
  if ((listing as EtsyListing & { state?: string }).state !== "active") throw new Error("The Etsy listing is not active.");
  return { ...normalise(listing), imageUrl: await primaryImage(listing.listing_id, accessToken) };
}
